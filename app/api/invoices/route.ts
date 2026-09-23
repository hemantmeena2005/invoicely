import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'
import { computeNextReminderDate, ReminderSchedule } from '@/lib/reminderHelper'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices from Supabase:', error)
      return NextResponse.json([], { status: 200 })
    }

    const formatted = (invoices || []).map((inv: any) => ({
      ...inv,
      _id: inv.id,
      invoiceNumber: inv.invoice_number,
      taxRate: inv.tax_rate,
      taxAmount: inv.tax_amount,
      issueDate: inv.issue_date,
      dueDate: inv.due_date,
      paidAt: inv.paid_at,
      emailStatus: inv.email_status,
      lastEmailedAt: inv.last_emailed_at,
      emailLogs: inv.email_logs,
      reminderSchedule: inv.reminder_schedule || 'off',
      nextReminderAt: inv.next_reminder_at,
      reminderCount: inv.reminder_count || 0,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
      clientId: inv.client
        ? {
            ...inv.client,
            _id: inv.client.id,
          }
        : {
            name: 'Unknown Client',
            email: '',
          },
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
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
      taxRate = 0, 
      notes = '', 
      terms = '',
      reminderSchedule = 'off'
    } = body

    if (!clientId || !dueDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Client, due date, and at least one item are required' },
        { status: 400 }
      )
    }

    // Count existing invoices for invoice number generation
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    // Calculate totals
    const calculatedItems = items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
    }))

    const subtotal = calculatedItems.reduce((sum: number, item: any) => sum + item.amount, 0)
    const taxAmount = (subtotal * Number(taxRate)) / 100
    const total = subtotal + taxAmount

    const computedNextReminder = computeNextReminderDate(reminderSchedule as ReminderSchedule, dueDate)

    const newInvoiceData = {
      user_id: user.id,
      client_id: clientId,
      invoice_number: invoiceNumber,
      items: calculatedItems,
      subtotal,
      tax_rate: Number(taxRate),
      tax_amount: taxAmount,
      total,
      due_date: new Date(dueDate).toISOString(),
      issue_date: new Date().toISOString(),
      notes,
      terms,
      status: 'draft',
      email_status: 'not_sent',
      reminder_schedule: reminderSchedule,
      next_reminder_at: computedNextReminder,
      reminder_count: 0,
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([newInvoiceData])
      .select('*, client:clients(*)')
      .single()

    if (error) {
      console.error('Supabase invoice create error:', error)
      // Retry without reminder columns if table schema doesn't have them yet
      const fallbackData = {
        user_id: user.id,
        client_id: clientId,
        invoice_number: invoiceNumber,
        items: calculatedItems,
        subtotal,
        tax_rate: Number(taxRate),
        tax_amount: taxAmount,
        total,
        due_date: new Date(dueDate).toISOString(),
        issue_date: new Date().toISOString(),
        notes: reminderSchedule !== 'off' 
          ? `${notes}\n[ReminderSchedule: ${reminderSchedule}]`.trim() 
          : notes,
        terms,
        status: 'draft',
        email_status: 'not_sent',
      }
      const retry = await supabase
        .from('invoices')
        .insert([fallbackData])
        .select('*, client:clients(*)')
        .single()

      if (!retry.error && retry.data) {
        return NextResponse.json(
          {
            ...retry.data,
            _id: retry.data.id,
            invoiceNumber: retry.data.invoice_number,
            taxRate: retry.data.tax_rate,
            taxAmount: retry.data.tax_amount,
            issueDate: retry.data.issue_date,
            dueDate: retry.data.due_date,
            reminderSchedule,
            nextReminderAt: computedNextReminder,
            reminderCount: 0,
            clientId: retry.data.client ? { ...retry.data.client, _id: retry.data.client.id } : { name: 'Unknown' },
          },
          { status: 201 }
        )
      }

      return NextResponse.json(
        {
          _id: `temp_${Date.now()}`,
          id: `temp_${Date.now()}`,
          invoiceNumber,
          ...newInvoiceData,
          reminderSchedule,
          nextReminderAt: computedNextReminder,
          reminderCount: 0,
          createdAt: new Date().toISOString(),
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        ...invoice,
        _id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        taxRate: invoice.tax_rate,
        taxAmount: invoice.tax_amount,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        reminderSchedule: invoice.reminder_schedule || reminderSchedule,
        nextReminderAt: invoice.next_reminder_at || computedNextReminder,
        reminderCount: invoice.reminder_count || 0,
        clientId: invoice.client ? { ...invoice.client, _id: invoice.client.id } : { name: 'Unknown' },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}