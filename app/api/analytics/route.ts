import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [invoicesRes, clientsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, client:clients(name, email)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id),
    ])

    const invoices = invoicesRes.data || []
    const clients = clientsRes.data || []

    const totalInvoices = invoices.length
    const totalClients = clients.length

    const paidInvoices = invoices.filter((i) => i.status === 'paid')
    const pendingInvoices = invoices.filter((i) => i.status === 'sent')
    const overdueInvoices = invoices.filter((i) => {
      const dueDate = new Date(i.due_date)
      const today = new Date()
      return dueDate < today && i.status !== 'paid'
    })

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0)
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0)
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0)

    const emailStats = {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      notSent: 0,
    }

    const recentEmailActivity = []

    for (const invoice of invoices) {
      if (invoice.email_status && invoice.email_status !== 'not_sent') {
        emailStats.totalSent++
        if (invoice.email_status === 'delivered') {
          emailStats.delivered++
        } else if (invoice.email_status === 'failed') {
          emailStats.failed++
        } else {
          emailStats.notSent++
        }
      }

      if (invoice.last_emailed_at) {
        recentEmailActivity.push({
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.client?.name || 'Unknown',
          status: invoice.email_status || 'sent',
          sentAt: invoice.last_emailed_at,
        })
      }
    }

    return NextResponse.json({
      totalInvoices,
      totalClients,
      totalRevenue,
      pendingAmount,
      overdueAmount,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      emailStats,
      recentEmailActivity: recentEmailActivity.slice(0, 5),
    })
  } catch (error) {
    console.error('Error fetching analytics from Supabase:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}