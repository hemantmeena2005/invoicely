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

    // 1.5 Auto-expire under_review if > 5 minutes without matching bank SMS
    let reviewStartedAt: string | null = null
    if (invoice.status === 'under_review') {
      let reviewStartTime: number | null = null

      if (invoice.terms && invoice.terms.includes('[REVIEW_AT:')) {
        const match = invoice.terms.match(/\[REVIEW_AT:([^\]]+)\]/)
        if (match && match[1]) {
          const parsed = new Date(match[1]).getTime()
          if (!isNaN(parsed)) {
            reviewStartTime = parsed
            reviewStartedAt = match[1]
          }
        }
      }

      if (!reviewStartTime && Array.isArray(invoice.email_logs)) {
        const reviewLog = [...invoice.email_logs].reverse().find((l: any) => l && l.status === 'under_review')
        if (reviewLog && reviewLog.sentAt) {
          const parsed = new Date(reviewLog.sentAt).getTime()
          if (!isNaN(parsed)) {
            reviewStartTime = parsed
            reviewStartedAt = reviewLog.sentAt
          }
        }
      }

      if (!reviewStartTime && invoice.updated_at) {
        const parsed = new Date(invoice.updated_at).getTime()
        if (!isNaN(parsed)) {
          reviewStartTime = parsed
          reviewStartedAt = invoice.updated_at
        }
      }

      // Check if 5 minutes (300,000 ms) have passed
      if (reviewStartTime && Date.now() - reviewStartTime > 5 * 60 * 1000) {
        const submittedUtr = invoice.terms?.includes('UTR:')
          ? invoice.terms.split('UTR:')[1]?.split('|')[0]?.trim()
          : 'UNKNOWN'

        const cleanTerms = (invoice.terms || '')
          .replace(/\[REVIEW_AT:[^\]]+\]/gi, '')
          .replace(/\[REJECTED:[^\]]+\]/gi, '')
          .replace(/\|?\s*UTR:[^\s|]+/gi, '')
          .trim()

        const updatedTermsWithReject = cleanTerms
          ? `${cleanTerms} | [REJECTED:${submittedUtr}]`
          : `[REJECTED:${submittedUtr}]`

        const currentLogs = Array.isArray(invoice.email_logs) ? invoice.email_logs : []
        const auditEntry = {
          sentAt: new Date().toISOString(),
          emailType: 'auto_timeout_5min_rejection',
          status: 'rejected',
          utr: submittedUtr,
          reason: 'No matching bank SMS credit received within 5 minutes',
        }

        await supabaseAdmin
          .from('invoices')
          .update({
            status: 'sent',
            terms: updatedTermsWithReject,
            updated_at: new Date().toISOString(),
            email_logs: [...currentLogs, auditEntry],
          })
          .eq('id', invoice.id)

        invoice.status = 'sent'
        invoice.terms = updatedTermsWithReject
        reviewStartedAt = null
      }
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
      reviewStartedAt,
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
