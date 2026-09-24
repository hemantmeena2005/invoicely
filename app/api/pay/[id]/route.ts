import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // 1. Fetch invoice and client
    const { data: invoice, error: invError } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', invoiceId)
      .single()

    if (invError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // 2. Fetch invoice creator's user profile (for UPI and branding)
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('id, name, email, upi_id, upi_name, upi_qr_code, business_name, business_phone, business_address')
      .eq('id', invoice.user_id)
      .single()

    const rawClient = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client

    const formattedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number || 'INV-0000',
      status: invoice.status,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      subtotal: Number(invoice.subtotal || 0),
      taxRate: Number(invoice.tax_rate || 0),
      taxAmount: Number(invoice.tax_amount || 0),
      total: Number(invoice.total || 0),
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      items: Array.isArray(invoice.items) ? invoice.items : [],
      client: rawClient || {
        name: 'Client',
        email: '',
      },
      merchant: {
        name: userProfile?.name || 'Invoicely Merchant',
        email: userProfile?.email || '',
        businessName: userProfile?.business_name || '',
        businessPhone: userProfile?.business_phone || '',
        businessAddress: userProfile?.business_address || '',
        upiId: userProfile?.upi_id || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'demo@upi',
        upiName: userProfile?.upi_name || userProfile?.name || 'Invoicely Merchant',
        upiQrCode: userProfile?.upi_qr_code || '',
      },
    }

    return NextResponse.json({ invoice: formattedInvoice })
  } catch (error) {
    console.error('Public invoice fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status, paymentMethod } = body

    if (status !== 'paid') {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 })
    }

    const { data: updatedInvoice, error } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) {
      console.error('Error marking invoice paid:', error)
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice marked as paid successfully',
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error('Public invoice update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
