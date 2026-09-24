import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseBankSms } from '@/lib/bankSmsParser'
import { embedReminderToTerms } from '@/lib/reminderHelper'

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'Invoicely Automated Bank SMS & UPI Webhook',
    version: '2.0',
    documentation: 'Send POST with JSON { sms: "..." } or { content: "..." } to auto-verify bank UPI credits without fees.',
  })
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.UPI_WEBHOOK_SECRET

    // Optional secret token check if configured
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let payload: any = {}
    let rawText = ''

    if (contentType.includes('application/json')) {
      payload = await request.json()
      rawText = payload.sms || payload.content || payload.message || payload.text || payload.body || payload.msg || ''
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      const entries: Record<string, any> = {}
      formData.forEach((val, key) => { entries[key] = val })
      payload = entries
      rawText = payload.sms || payload.content || payload.message || payload.text || payload.body || ''
    } else {
      rawText = await request.text()
    }

    // 1. If an SMS text was forwarded, parse it with our Bank SMS parser
    let parsedSms: any = null
    let refUtr = (payload.utr || payload.transactionId || '').toString().trim()
    let invoiceNumber = (payload.invoiceNumber || '').toString().trim()
    let invoiceId = (payload.invoiceId || '').toString().trim()
    let amount = payload.amount ? parseFloat(payload.amount) : null

    if (rawText && typeof rawText === 'string') {
      parsedSms = parseBankSms(rawText)
      console.log('📱 [BANK SMS WEBHOOK] Parsed incoming SMS:', parsedSms)

      // If it's explicitly a debit, skip processing
      if (!parsedSms.isCredit) {
        return NextResponse.json({
          success: false,
          ignored: true,
          reason: 'Notification is not a credit or deposit transaction',
          parsed: parsedSms,
        }, { status: 200 })
      }

      if (!refUtr && parsedSms.utr) refUtr = parsedSms.utr
      if (!amount && parsedSms.amount) amount = parsedSms.amount
      if (!invoiceNumber && parsedSms.invoiceHint) invoiceNumber = parsedSms.invoiceHint
    }

    console.log(`🔎 [BANK SMS WEBHOOK] Searching invoice for UTR: "${refUtr}", Amount: ${amount}, Hint: "${invoiceNumber}"`)

    // 2. Multi-tier Matching Engine
    let matchedInvoice: any = null

    // Match Tier 1: Search by Invoice ID if provided directly
    if (invoiceId) {
      const { data } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*)')
        .eq('id', invoiceId)
        .single()
      if (data) matchedInvoice = data
    }

    // Match Tier 2: Search by UTR already submitted by client on /pay/[id]
    if (!matchedInvoice && refUtr) {
      const { data: utrMatches } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*)')
        .ilike('terms', `%UTR:${refUtr}%`)
        .limit(1)

      if (utrMatches && utrMatches.length > 0) {
        matchedInvoice = utrMatches[0]
        console.log(`✅ [BANK SMS WEBHOOK] Matched invoice #${matchedInvoice.invoice_number} by client-submitted UTR ${refUtr}`)
      }
    }

    // Match Tier 3: Search by Invoice Number (e.g. from transaction note or hint)
    if (!matchedInvoice && invoiceNumber) {
      // Clean invoice number hint (remove hyphens to match format variants)
      const cleanHint = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')
      const { data: numMatches } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*)')
        .neq('status', 'paid')

      if (numMatches && numMatches.length > 0) {
        const found = numMatches.find(inv => 
          inv.invoice_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanHint.toLowerCase()
        )
        if (found) {
          matchedInvoice = found
          console.log(`✅ [BANK SMS WEBHOOK] Matched invoice #${matchedInvoice.invoice_number} by note hint "${invoiceNumber}"`)
        }
      }
    }

    // Match Tier 4: Search by exact Amount among unpaid invoices
    if (!matchedInvoice && amount && amount > 0) {
      const { data: amountMatches } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*)')
        .neq('status', 'paid')
        .eq('total', amount)
        .order('created_at', { ascending: false })

      if (amountMatches && amountMatches.length > 0) {
        // If an invoice is under_review with a specific client-submitted UTR,
        // do NOT match it by amount if the SMS contains a different conflicting UTR.
        const validMatch = amountMatches.find(inv => {
          if (inv.status === 'under_review' && inv.terms?.includes('UTR:') && refUtr) {
            const existingUtr = inv.terms.split('UTR:')[1]?.split('|')[0]?.trim()
            if (existingUtr && existingUtr !== refUtr) {
              return false // Conflicting UTR! Skip this invoice
            }
          }
          return true
        })

        if (validMatch) {
          matchedInvoice = validMatch
          console.log(`✅ [BANK SMS WEBHOOK] Matched invoice #${matchedInvoice.invoice_number} by exact amount ₹${amount}`)
        }
      }
    }

    // If no invoice could be matched, log the event and return details
    if (!matchedInvoice) {
      console.warn('⚠️ [BANK SMS WEBHOOK] Received credit SMS but no matching unpaid invoice found:', {
        refUtr,
        amount,
        invoiceNumber,
        parsedSms,
      })
      return NextResponse.json({
        success: false,
        matched: false,
        message: 'Bank credit received and parsed, but no unpaid invoice matched the UTR or amount.',
        parsed: {
          isCredit: true,
          amount,
          utr: refUtr,
          bank: parsedSms?.bank,
          accountLast4: parsedSms?.accountLast4,
        },
      }, { status: 200 })
    }

    // 3. Mark Invoice as PAID and record audit trail
    const nowIso = new Date().toISOString()
    const cleanTermsBase = (matchedInvoice.terms || '').replace(/\[REMINDER:[^\]]+\]/gi, '').trim()
    const finalUtr = refUtr || 'BANK-VERIFIED'
    
    // Add verified UTR tag to terms
    let updatedTerms = cleanTermsBase
    if (!updatedTerms.includes(`UTR:${finalUtr}`)) {
      updatedTerms = updatedTerms ? `${updatedTerms} | UTR:${finalUtr}` : `UTR:${finalUtr}`
    }
    // Deactivate reminder schedule upon payment
    updatedTerms = embedReminderToTerms(updatedTerms, 'off', null, 0)

    // Audit log entry
    const currentLogs = Array.isArray(matchedInvoice.email_logs) ? matchedInvoice.email_logs : []
    const auditEntry = {
      sentAt: nowIso,
      emailType: 'bank_sms_auto_reconciliation',
      status: 'paid_verified',
      utr: finalUtr,
      amount: amount || matchedInvoice.total,
      bank: parsedSms?.bank || 'Bank Transfer',
      accountLast4: parsedSms?.accountLast4 || null,
      source: 'automated_bank_sms_webhook',
      rawSms: rawText ? (rawText.length > 120 ? rawText.substring(0, 120) + '...' : rawText) : undefined,
    }

    const updatePayload: Record<string, any> = {
      status: 'paid',
      paid_at: nowIso,
      updated_at: nowIso,
      terms: updatedTerms,
      next_reminder_at: null,
      reminder_schedule: 'off',
      email_logs: [...currentLogs, auditEntry],
    }

    let { data: updatedInvoice, error: updateError } = await supabaseAdmin
      .from('invoices')
      .update(updatePayload)
      .eq('id', matchedInvoice.id)
      .select('*, client:clients(*)')
      .single()

    if (updateError) {
      // Fallback update without reminder column extensions if database lacks columns
      delete updatePayload.next_reminder_at
      delete updatePayload.reminder_schedule
      const retry = await supabaseAdmin
        .from('invoices')
        .update(updatePayload)
        .eq('id', matchedInvoice.id)
        .select('*, client:clients(*)')
        .single()

      if (retry.error) {
        console.error('❌ [BANK SMS WEBHOOK] Failed to update invoice:', retry.error)
        return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 })
      }
      updatedInvoice = retry.data
    }

    console.log(`🎉 [BANK SMS WEBHOOK] Successfully verified and marked invoice #${matchedInvoice.invoice_number} as PAID!`)

    return NextResponse.json({
      success: true,
      matched: true,
      message: `Invoice #${matchedInvoice.invoice_number} successfully verified and marked as PAID via Bank SMS!`,
      invoiceId: matchedInvoice.id,
      invoiceNumber: matchedInvoice.invoice_number,
      total: matchedInvoice.total,
      paidAt: nowIso,
      utr: finalUtr,
      bank: parsedSms?.bank || 'Bank Transfer',
    })
  } catch (error) {
    console.error('❌ [BANK SMS WEBHOOK] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error in webhook handler' }, { status: 500 })
  }
}
