import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all invoices for user with client details
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, client:clients(id, name, email, company)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching history:', error)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    const allInvoices = invoices || []

    // 1. Paid Payments History
    const paymentHistory = allInvoices
      .filter((inv) => inv.status === 'paid')
      .map((inv) => {
        const rawClient = Array.isArray(inv.client) ? inv.client[0] : inv.client
        return {
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          clientName: rawClient?.name || 'Client',
          clientEmail: rawClient?.email || '',
          amount: Number(inv.total || 0),
          paidAt: inv.paid_at || inv.updated_at || inv.created_at,
          paymentMethod: 'UPI / Direct',
          status: 'paid',
        }
      })
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())

    // 2. Email Logs History
    const emailHistory: Array<{
      id: string
      invoiceId: string
      invoiceNumber: string
      clientName: string
      recipient: string
      emailType: string
      status: string
      sentAt: string
      messageId?: string
    }> = []

    allInvoices.forEach((inv) => {
      const rawClient = Array.isArray(inv.client) ? inv.client[0] : inv.client
      const logs = Array.isArray(inv.email_logs) ? inv.email_logs : []
      logs.forEach((log: any, idx: number) => {
        emailHistory.push({
          id: `${inv.id}-log-${idx}`,
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          clientName: rawClient?.name || 'Client',
          recipient: log.recipient || rawClient?.email || '',
          emailType: log.emailType || 'invoice',
          status: log.status || 'delivered',
          sentAt: log.sentAt || inv.last_emailed_at || inv.created_at,
          messageId: log.messageId,
        })
      })
    })

    emailHistory.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())

    // 3. Stats Calculation
    const totalCollected = paymentHistory.reduce((sum, p) => sum + p.amount, 0)
    const totalTransactions = paymentHistory.length
    const totalEmailsSent = emailHistory.length
    const averagePayment = totalTransactions > 0 ? totalCollected / totalTransactions : 0

    return NextResponse.json({
      payments: paymentHistory,
      emails: emailHistory,
      allInvoices: allInvoices.map((inv) => {
        const rawClient = Array.isArray(inv.client) ? inv.client[0] : inv.client
        return {
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          clientName: rawClient?.name || 'Client',
          amount: Number(inv.total || 0),
          status: inv.status,
          createdAt: inv.created_at,
          updatedAt: inv.updated_at,
          paidAt: inv.paid_at,
        }
      }),
      stats: {
        totalCollected,
        totalTransactions,
        totalEmailsSent,
        averagePayment,
      },
    })
  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
