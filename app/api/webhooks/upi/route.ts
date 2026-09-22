import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.UPI_WEBHOOK_SECRET

    // Optional secret token check if configured
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const payload = await request.json()
    const {
      invoiceId,
      invoiceNumber,
      amount,
      utr,
      status = 'SUCCESS',
      transactionId,
    } = payload

    const refUtr = (utr || transactionId || '').toString().trim()

    if (!invoiceId && !invoiceNumber) {
      return NextResponse.json({ error: 'Missing invoiceId or invoiceNumber in webhook payload' }, { status: 400 })
    }

    if (status !== 'SUCCESS' && status !== 'paid') {
      return NextResponse.json({ message: 'Webhook received for non-success status, skipped', status }, { status: 200 })
    }

    // 1. Find invoice by ID or Invoice Number
    let query = supabaseAdmin.from('invoices').select('*')
    if (invoiceId) {
      query = query.eq('id', invoiceId)
    } else if (invoiceNumber) {
      query = query.eq('invoice_number', invoiceNumber)
    }

    const { data: invoice, error: findError } = await query.single()

    if (findError || !invoice) {
      return NextResponse.json({ error: 'Invoice matching webhook payload not found' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()
    const existingTerms = invoice.terms || ''
    const updatedTerms = refUtr ? (existingTerms ? `${existingTerms} | UTR:${refUtr}` : `UTR:${refUtr}`) : existingTerms

    // 2. Mark invoice as paid
    const { data: updatedInvoice, error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: nowIso,
        updated_at: nowIso,
        terms: updatedTerms,
      })
      .eq('id', invoice.id)
      .select()
      .single()

    if (updateError) {
      console.error('UPI Webhook update error:', updateError)
      return NextResponse.json({ error: 'Failed to update invoice status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice successfully marked as paid via UPI webhook',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      utr: refUtr,
      paidAt: nowIso,
    })
  } catch (error) {
    console.error('UPI Webhook handler error:', error)
    return NextResponse.json({ error: 'Internal server error in webhook handler' }, { status: 500 })
  }
}
