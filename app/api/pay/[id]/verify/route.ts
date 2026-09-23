import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { embedReminderToTerms } from '@/lib/reminderHelper'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { utr } = body

    if (!utr || typeof utr !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid 12-digit UPI UTR / Transaction Reference number' }, { status: 400 })
    }

    const cleanUtr = utr.trim().replace(/\s+/g, '')

    // Standard NPCI UPI UTR length is 12 digits (or 12-16 alphanumeric)
    if (cleanUtr.length < 10 || cleanUtr.length > 20) {
      return NextResponse.json({ 
        error: 'Invalid UTR format. Bank UPI Reference IDs (UTR/RRN) are typically 12 digits (e.g. 426718902345)' 
      }, { status: 400 })
    }

    // 1. Fetch invoice to ensure it exists and isn't already paid
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // 2. Check for duplicate UTR reuse across other invoices
    const { data: existingDuplicate } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number')
      .neq('id', invoiceId)
      .ilike('terms', `%UTR:${cleanUtr}%`)
      .limit(1)

    if (existingDuplicate && existingDuplicate.length > 0) {
      return NextResponse.json({ 
        error: 'This UPI UTR reference number has already been used for another invoice payment.' 
      }, { status: 400 })
    }

    const nowIso = new Date().toISOString()
    const cleanTermsBase = (invoice.terms || '').replace(/\[REMINDER:[^\]]+\]/gi, '').trim()
    let updatedTerms = cleanTermsBase
    if (!updatedTerms.includes(`UTR:${cleanUtr}`)) {
      updatedTerms = updatedTerms ? `${updatedTerms} | UTR:${cleanUtr}` : `UTR:${cleanUtr}`
    }
    // Deactivate reminder schedule upon client payment
    updatedTerms = embedReminderToTerms(updatedTerms, 'off', null, 0)

    const currentLogs = Array.isArray(invoice.email_logs) ? invoice.email_logs : []
    const auditEntry = {
      sentAt: nowIso,
      emailType: 'client_submitted_utr',
      status: 'under_review',
      utr: cleanUtr,
      amount: invoice.total,
      source: 'hosted_checkout_portal',
    }

    // 3. Update invoice as UNDER_REVIEW with UTR recorded in terms & audit log
    const updatePayload: Record<string, any> = {
      status: 'under_review',
      updated_at: nowIso,
      terms: updatedTerms,
      next_reminder_at: null, // Pause reminders while under review
      reminder_schedule: 'off',
      email_logs: [...currentLogs, auditEntry],
    }

    let { data: updatedInvoice, error: updateError } = await supabaseAdmin
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      delete updatePayload.next_reminder_at
      delete updatePayload.reminder_schedule
      const retry = await supabaseAdmin
        .from('invoices')
        .update(updatePayload)
        .eq('id', invoiceId)
        .select()
        .single()

      if (retry.error) {
        console.error('Error updating invoice with UTR:', retry.error)
        return NextResponse.json({ error: 'Failed to record payment verification' }, { status: 500 })
      }
      updatedInvoice = retry.data
    }

    return NextResponse.json({
      success: true,
      status: 'under_review',
      message: `Payment submitted for verification with Bank UTR: ${cleanUtr}`,
      utr: cleanUtr,
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error('UTR verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
