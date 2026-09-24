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

    // 2. Matching Engine (Strict Under-Review UTR Verification)
    let matchedInvoice: any = null

    // Search exclusively for invoices that are currently UNDER_REVIEW with this client-submitted UTR
    if (refUtr) {
      const { data: utrMatches } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*)')
        .eq('status', 'under_review')
        .ilike('terms', `%UTR:${refUtr}%`)
        .limit(1)

      if (utrMatches && utrMatches.length > 0) {
        const candidate = utrMatches[0]

        // Check 5-minute review timeout
        let reviewStartTime: number | null = null
        if (candidate.terms && candidate.terms.includes('[REVIEW_AT:')) {
          const match = candidate.terms.match(/\[REVIEW_AT:([^\]]+)\]/)
          if (match && match[1]) {
            const parsed = new Date(match[1]).getTime()
            if (!isNaN(parsed)) reviewStartTime = parsed
          }
        }
        if (!reviewStartTime && candidate.updated_at) {
          const parsed = new Date(candidate.updated_at).getTime()
          if (!isNaN(parsed)) reviewStartTime = parsed
        }

        const isExpired = reviewStartTime ? (Date.now() - reviewStartTime > 5 * 60 * 1000) : false

        if (isExpired) {
          console.warn(`⏳ [BANK SMS WEBHOOK] UTR ${refUtr} for #${candidate.invoice_number} arrived after 5-min timeout! Rejecting...`)
          // Automatically reject expired invoice
          const cleanTerms = (candidate.terms || '')
            .replace(/\[REVIEW_AT:[^\]]+\]/gi, '')
            .replace(/\[REJECTED:[^\]]+\]/gi, '')
            .replace(/\|?\s*UTR:[^\s|]+/gi, '')
            .trim()
          const updatedTermsWithReject = cleanTerms 
            ? `${cleanTerms} | [REJECTED:${refUtr}]`
            : `[REJECTED:${refUtr}]`

          const currentLogs = Array.isArray(candidate.email_logs) ? candidate.email_logs : []
          await supabaseAdmin
            .from('invoices')
            .update({
              status: 'sent',
              terms: updatedTermsWithReject,
              updated_at: new Date().toISOString(),
              email_logs: [...currentLogs, {
                sentAt: new Date().toISOString(),
                emailType: 'timeout_rejected_at_webhook',
                status: 'rejected',
                utr: refUtr,
                reason: 'Bank SMS arrived after 5-minute review window expired',
              }],
            })
            .eq('id', candidate.id)

          return NextResponse.json({
            success: false,
            matched: false,
            expired: true,
            message: `Bank credit UTR ${refUtr} arrived after the 5-minute review window expired. Invoice #${candidate.invoice_number} was rejected and marked unpaid.`,
            parsed: {
              isCredit: true,
              amount,
              utr: refUtr,
              bank: parsedSms?.bank,
            },
          }, { status: 200 })
        }

        matchedInvoice = candidate
        console.log(`✅ [BANK SMS WEBHOOK] Matched under_review invoice #${matchedInvoice.invoice_number} by client-submitted UTR ${refUtr}`)
      }
    }

    // Direct invoice ID matching (only if explicitly called by test or direct API)
    if (!matchedInvoice && invoiceId) {
      const { data } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*)')
        .eq('id', invoiceId)
        .eq('status', 'under_review')
        .single()
      if (data) matchedInvoice = data
    }

    // If no under_review invoice matched this UTR, do not match any invoice
    if (!matchedInvoice) {
      console.warn('⚠️ [BANK SMS WEBHOOK] Received credit SMS but no under_review invoice matched this UTR:', {
        refUtr,
        amount,
        parsedSms,
      })
      return NextResponse.json({
        success: false,
        matched: false,
        message: refUtr
          ? `Bank credit received with UTR ${refUtr}, but no invoice currently in "Under Review" matches this UTR.`
          : 'Bank credit received, but no valid 12-digit UTR was extracted or found under review.',
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
