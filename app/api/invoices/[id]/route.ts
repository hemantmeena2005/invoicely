import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...invoice,
      _id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      taxRate: invoice.tax_rate,
      taxAmount: invoice.tax_amount,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      emailStatus: invoice.email_status,
      lastEmailedAt: invoice.last_emailed_at,
      emailLogs: invoice.email_logs,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      clientId: invoice.client
        ? {
            ...invoice.client,
            _id: invoice.client.id,
          }
        : {
            name: 'Unknown Client',
            email: '',
          },
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, dueDate, items, taxRate, notes, terms, status } = body

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Only recalculate and overwrite items/totals if items is explicitly provided
    if (items && Array.isArray(items) && items.length > 0) {
      const calculatedItems = items.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
      }))

      const subtotal = calculatedItems.reduce((sum: number, item: any) => sum + item.amount, 0)
      const rateNum = Number(taxRate !== undefined ? taxRate : 0)
      const taxAmount = (subtotal * rateNum) / 100
      const total = subtotal + taxAmount

      updatePayload.items = calculatedItems
      updatePayload.subtotal = subtotal
      updatePayload.tax_rate = rateNum
      updatePayload.tax_amount = taxAmount
      updatePayload.total = total
    }

    if (clientId) updatePayload.client_id = clientId
    if (dueDate) updatePayload.due_date = new Date(dueDate).toISOString()
    if (notes !== undefined) updatePayload.notes = notes
    if (terms !== undefined) updatePayload.terms = terms
    if (status) {
      updatePayload.status = status
      if (status === 'paid') {
        updatePayload.paid_at = new Date().toISOString()
      } else {
        updatePayload.paid_at = null
      }
    }

    const { data: updated, error } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('*, client:clients(*)')
      .single()

    if (error || !updated) {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 404 })
    }

    return NextResponse.json({
      ...updated,
      _id: updated.id,
      invoiceNumber: updated.invoice_number,
      taxRate: updated.tax_rate,
      taxAmount: updated.tax_amount,
      issueDate: updated.issue_date,
      dueDate: updated.due_date,
      clientId: updated.client ? { ...updated.client, _id: updated.client.id } : { name: 'Unknown' },
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting invoice from Supabase:', error)
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}