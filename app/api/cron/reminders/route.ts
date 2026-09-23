import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendInvoiceReminder } from '@/lib/email'
import { 
  computeNextReminderDate, 
  ReminderSchedule, 
  extractReminderConfig, 
  embedReminderToTerms,
  cleanDisplayTerms 
} from '@/lib/reminderHelper'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(request: NextRequest) {
  return handleCronReminders(request)
}

export async function POST(request: NextRequest) {
  return handleCronReminders(request)
}

async function handleCronReminders(request: NextRequest) {
  try {
    // Check Authorization: Vercel Cron header or CRON_SECRET or local dev
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
      // In dev mode or with query param secret, allow for testing
      const urlSecret = request.nextUrl.searchParams.get('secret')
      if (urlSecret !== cronSecret && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 })
      }
    }

    const now = new Date()
    const nowIso = now.toISOString()

    console.log(`⏰ [CRON] Checking scheduled invoice reminders at ${nowIso}...`)

    // Fetch unpaid invoices with safe query (resilient to missing columns)
    const { data: invoices, error: fetchError } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*), user:users(*)')
      .neq('status', 'paid')

    if (fetchError) {
      console.error('❌ [CRON] Error querying scheduled invoices:', fetchError)
      return NextResponse.json({ error: 'Database query failed', details: fetchError.message }, { status: 500 })
    }

    // Filter in-memory using extractReminderConfig (handles both direct columns & fallback terms)
    const eligibleInvoices = (invoices || []).filter((inv: any) => {
      // Don't nag clients if payment is currently under review
      if (inv.status === 'under_review') return false

      const config = extractReminderConfig(
        inv.reminder_schedule,
        inv.next_reminder_at,
        inv.reminder_count,
        inv.terms,
        inv.email_logs
      )
      if (config.schedule === 'off') return false
      if (!config.nextReminderAt) return false
      return new Date(config.nextReminderAt).getTime() <= now.getTime()
    })

    console.log(`⏰ [CRON] Found ${eligibleInvoices.length} invoices scheduled for reminders`)

    const results = []

    for (const invoice of eligibleInvoices) {
      try {
        const client = (Array.isArray(invoice.client) ? invoice.client[0] : invoice.client) as any
        const user = (Array.isArray(invoice.user) ? invoice.user[0] : invoice.user) as any

        if (!client?.email) {
          console.warn(`⚠️ [CRON] Skipping invoice ${invoice.invoice_number}: No client email found`)
          results.push({
            invoiceNumber: invoice.invoice_number,
            status: 'skipped',
            reason: 'Missing client email',
          })
          continue
        }

        const senderName = user?.name || user?.raw_user_meta_data?.name || 'Invoicely Merchant'
        const senderEmail = user?.email || undefined

        // Generate PDF Buffer
        const pdfBytes = await generateReminderPDF({
          ...invoice,
          client,
          items: Array.isArray(invoice.items) ? invoice.items : [],
        })

        // Dispatch Email
        const emailResult = await sendInvoiceReminder({
          to: client.email,
          clientName: client.name || 'Valued Client',
          invoiceNumber: invoice.invoice_number,
          amount: Number(invoice.total || 0),
          dueDate: invoice.due_date,
          pdfBytes,
          invoiceId: invoice.id,
          senderName,
          senderEmail,
        })

        if (!emailResult.success) {
          console.error(`❌ [CRON] Failed to send email for ${invoice.invoice_number}:`, emailResult.error)
          results.push({
            invoiceNumber: invoice.invoice_number,
            status: 'failed',
            error: emailResult.error,
          })
          continue
        }

        // Extract config & calculate next reminder date
        const config = extractReminderConfig(
          invoice.reminder_schedule,
          invoice.next_reminder_at,
          invoice.reminder_count,
          invoice.terms,
          invoice.email_logs
        )
        const schedule = config.schedule
        const nextDate = computeNextReminderDate(schedule, invoice.due_date, now)

        // Log entry
        const newLog = {
          sentAt: nowIso,
          messageId: emailResult.messageId,
          emailType: 'reminder',
          recipient: client.email,
          status: 'sent',
          automatedCron: true,
          schedule,
        }

        const currentLogs = Array.isArray(invoice.email_logs) ? invoice.email_logs : []
        const updatedLogs = [...currentLogs, newLog]
        const reminderCount = (config.reminderCount || 0) + 1

        const updatedTerms = embedReminderToTerms(
          invoice.terms,
          schedule,
          nextDate,
          reminderCount
        )

        const updatePayload: Record<string, any> = {
          email_logs: updatedLogs,
          last_emailed_at: nowIso,
          email_status: 'sent',
          terms: updatedTerms,
          reminder_count: reminderCount,
          next_reminder_at: nextDate,
          reminder_schedule: schedule,
        }

        let { error: updateErr } = await supabaseAdmin
          .from('invoices')
          .update(updatePayload)
          .eq('id', invoice.id)

        if (updateErr) {
          // Retry without column extensions
          delete updatePayload.reminder_count
          delete updatePayload.next_reminder_at
          delete updatePayload.reminder_schedule
          await supabaseAdmin
            .from('invoices')
            .update(updatePayload)
            .eq('id', invoice.id)
        }

        console.log(`✅ [CRON] Reminder #${reminderCount} sent for ${invoice.invoice_number}. Next: ${nextDate}`)

        results.push({
          invoiceNumber: invoice.invoice_number,
          status: 'sent',
          recipient: client.email,
          reminderCount,
          nextReminderAt: nextDate,
        })

      } catch (err: any) {
        console.error(`❌ [CRON] Error processing invoice ${invoice.id}:`, err)
        results.push({
          invoiceNumber: invoice.invoice_number || invoice.id,
          status: 'error',
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      totalEligible: eligibleInvoices.length,
      processed: results.length,
      results,
    })

  } catch (error: any) {
    console.error('❌ [CRON] Unhandled error in reminder cron:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

async function generateReminderPDF(invoice: any) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { height } = page.getSize()
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 11
  const lineHeight = fontSize * 1.3
  
  let y = height - 50
  
  // Header
  page.drawText('INVOICE PAYMENT REMINDER', { x: 50, y, size: 20, font: boldFont, color: rgb(0.88, 0.11, 0.28) })
  y -= 40
  
  // Details
  page.drawText(`Invoice Number: ${invoice.invoice_number || invoice.invoiceNumber}`, { x: 50, y, size: fontSize, font: boldFont })
  y -= lineHeight
  page.drawText(`Issue Date: ${new Date(invoice.issue_date || invoice.issueDate || Date.now()).toLocaleDateString()}`, { x: 50, y, size: fontSize, font })
  y -= lineHeight
  page.drawText(`Due Date: ${new Date(invoice.due_date || invoice.dueDate || Date.now()).toLocaleDateString()}`, { x: 50, y, size: fontSize, font: boldFont, color: rgb(0.8, 0.1, 0.1) })
  y -= lineHeight
  
  // Client info
  y -= 20
  page.drawText('Bill To:', { x: 50, y, size: fontSize, font: boldFont, color: rgb(0.4, 0.4, 0.4) })
  y -= lineHeight
  page.drawText(invoice.client?.name || 'Valued Client', { x: 50, y, size: fontSize, font })
  y -= lineHeight
  if (invoice.client?.email) {
    page.drawText(invoice.client.email, { x: 50, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) })
    y -= lineHeight
  }
  
  // Items table header
  y -= 30
  page.drawRectangle({
    x: 48,
    y: y - 4,
    width: 500,
    height: 22,
    color: rgb(0.95, 0.95, 0.97),
  })
  page.drawText('Description', { x: 55, y: y + 2, size: fontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
  page.drawText('Qty', { x: 300, y: y + 2, size: fontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
  page.drawText('Rate', { x: 370, y: y + 2, size: fontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
  page.drawText('Amount', { x: 460, y: y + 2, size: fontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
  y -= lineHeight + 8
  
  // Table rows
  const items = Array.isArray(invoice.items) ? invoice.items : []
  for (const item of items) {
    const desc = String(item.description || 'Item')
    const qty = Number(item.quantity || 1)
    const rate = Number(item.rate || 0)
    const amt = Number(item.amount || qty * rate)

    page.drawText(desc.substring(0, 35), { x: 55, y, size: fontSize, font })
    page.drawText(qty.toString(), { x: 300, y, size: fontSize, font })
    page.drawText(`Rs. ${rate.toFixed(2)}`, { x: 370, y, size: fontSize, font })
    page.drawText(`Rs. ${amt.toFixed(2)}`, { x: 460, y, size: fontSize, font })
    y -= lineHeight + 4
  }
  
  // Totals
  y -= 20
  const subtotal = Number(invoice.subtotal || 0)
  const taxRate = Number(invoice.tax_rate || invoice.taxRate || 0)
  const taxAmount = Number(invoice.tax_amount || invoice.taxAmount || 0)
  const total = Number(invoice.total || 0)

  page.drawText(`Subtotal: Rs. ${subtotal.toFixed(2)}`, { x: 370, y, size: fontSize, font })
  y -= lineHeight
  if (taxRate > 0) {
    page.drawText(`Tax (${taxRate}%): Rs. ${taxAmount.toFixed(2)}`, { x: 370, y, size: fontSize, font })
    y -= lineHeight
  }
  page.drawText(`Total Due: Rs. ${total.toFixed(2)}`, { x: 370, y, size: 14, font: boldFont, color: rgb(0.88, 0.11, 0.28) })
  
  return await pdfDoc.save()
}
