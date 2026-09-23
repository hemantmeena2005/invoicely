import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'
import { 
  computeNextReminderDate, 
  ReminderSchedule, 
  extractReminderConfig, 
  embedReminderToTerms,
  cleanDisplayTerms 
} from '@/lib/reminderHelper'

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

    const reminderConfig = extractReminderConfig(
      invoice.reminder_schedule,
      invoice.next_reminder_at,
      invoice.reminder_count,
      invoice.terms,
      invoice.email_logs
    )

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
      reminderSchedule: invoice.status === 'paid' ? 'off' : reminderConfig.schedule,
      nextReminderAt: invoice.status === 'paid' ? null : reminderConfig.nextReminderAt,
      reminderCount: reminderConfig.reminderCount,
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
    const { 
      clientId, 
      dueDate, 
      items, 
      taxRate, 
      notes, 
      terms, 
      status,
      reminderSchedule,
      nextReminderAt
    } = body

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
    
    // Fetch existing invoice to preserve terms and handle schema fallback
    const { data: currentInvoice } = await supabase
      .from('invoices')
      .select('terms, email_logs, due_date, status, reminder_schedule, next_reminder_at, reminder_count')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    const currentTerms = terms !== undefined ? terms : (currentInvoice?.terms || '')
    const effectiveDueDate = dueDate || currentInvoice?.due_date || new Date().toISOString()
    const effectiveStatus = status || currentInvoice?.status || 'draft'

    if (status) {
      updatePayload.status = status
      if (status === 'paid') {
        updatePayload.paid_at = new Date().toISOString()
        // Stop any automated reminders immediately upon payment!
        updatePayload.next_reminder_at = null
        updatePayload.terms = embedReminderToTerms(currentTerms, 'off', null, 0)
      } else {
        updatePayload.paid_at = null
      }
    }

    if (reminderSchedule !== undefined) {
      updatePayload.reminder_schedule = reminderSchedule
      if (reminderSchedule === 'off' || effectiveStatus === 'paid' || effectiveStatus === 'under_review') {
        updatePayload.next_reminder_at = null
        updatePayload.terms = embedReminderToTerms(currentTerms, 'off', null, 0)
      } else {
        updatePayload.next_reminder_at = computeNextReminderDate(
          reminderSchedule as ReminderSchedule, 
          effectiveDueDate
        )
        updatePayload.terms = embedReminderToTerms(
          currentTerms,
          reminderSchedule as ReminderSchedule,
          updatePayload.next_reminder_at,
          currentInvoice?.reminder_count || 0
        )
      }
    } else if (nextReminderAt !== undefined) {
      updatePayload.next_reminder_at = nextReminderAt
      const existingConfig = extractReminderConfig(
        currentInvoice?.reminder_schedule,
        currentInvoice?.next_reminder_at,
        currentInvoice?.reminder_count,
        currentTerms,
        currentInvoice?.email_logs
      )
      if (existingConfig.schedule !== 'off') {
        updatePayload.terms = embedReminderToTerms(
          currentTerms,
          existingConfig.schedule,
          nextReminderAt,
          existingConfig.reminderCount
        )
      }
    }

    let { data: updated, error } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('*, client:clients(*)')
      .single()

    if (error) {
      console.warn('Supabase update error (retrying with safe columns):', error)
      // Retry without reminder columns if Supabase doesn't have them
      const safePayload = { ...updatePayload }
      delete safePayload.reminder_schedule
      delete safePayload.next_reminder_at
      delete safePayload.reminder_count

      const retry = await supabase
        .from('invoices')
        .update(safePayload)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select('*, client:clients(*)')
        .single()

      if (!retry.error && retry.data) {
        updated = retry.data
      }
    }

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 404 })
    }

    const reminderConfig = extractReminderConfig(
      updated.reminder_schedule,
      updated.next_reminder_at,
      updated.reminder_count,
      updated.terms,
      updated.email_logs
    )

    return NextResponse.json({
      ...updated,
      _id: updated.id,
      invoiceNumber: updated.invoice_number,
      taxRate: updated.tax_rate,
      taxAmount: updated.tax_amount,
      issueDate: updated.issue_date,
      dueDate: updated.due_date,
      reminderSchedule: effectiveStatus === 'paid' ? 'off' : reminderConfig.schedule,
      nextReminderAt: effectiveStatus === 'paid' ? null : reminderConfig.nextReminderAt,
      reminderCount: reminderConfig.reminderCount,
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