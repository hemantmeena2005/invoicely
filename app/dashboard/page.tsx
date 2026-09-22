import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  EnvelopeIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/ui/Badge'
import { DashboardLoadingSkeleton } from '@/components/ui/Skeleton'

async function getDashboardData() {
  const user = await getSessionUser()
  if (!user) return null

  try {
    const [invoicesRes, clientsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, client:clients(name, email)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id),
    ])

    const invoices = invoicesRes.data || []
    const clients = clientsRes.data || []

    const totalInvoices = invoices.length
    const totalClients = clients.length
    
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent')
    const overdueInvoices = invoices.filter(inv => {
      return inv.status === 'sent' && new Date(inv.due_date) < new Date()
    })
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)

    // Get recent invoices for display
    const recentInvoices = invoices.slice(0, 5).map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.client?.name || 'Unknown Client',
      amount: Number(invoice.total) || 0,
      status: invoice.status,
      dueDate: invoice.due_date,
      issueDate: invoice.issue_date,
      emailStatus: invoice.email_status || 'not_sent',
      lastEmailedAt: invoice.last_emailed_at,
    }))

    // Calculate monthly revenue for the last 6 months
    const monthlyRevenue = []
    const currentDate = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0)
      
      const monthInvoices = paidInvoices.filter(inv => {
        const paidDate = new Date(inv.paid_at || inv.updated_at || inv.created_at)
        return paidDate >= monthStart && paidDate <= monthEnd
      })
      
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      })
    }

    // Get top clients by revenue
    const clientRevenue: { [key: string]: number } = {}
    paidInvoices.forEach(invoice => {
      const clientName = invoice.client?.name || 'Unknown'
      clientRevenue[clientName] = (clientRevenue[clientName] || 0) + (Number(invoice.total) || 0)
    })
    
    const topClients = Object.entries(clientRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)

    // Email statistics
    const emailStats = {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      notSent: 0
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
          emailType: 'invoice',
          status: invoice.email_status || 'sent',
          sentAt: invoice.last_emailed_at
        })
      }
    }

    return {
      totalInvoices,
      totalClients,
      totalRevenue,
      pendingInvoices: pendingInvoices.length,
      pendingAmount,
      overdueInvoices: overdueInvoices.length,
      overdueAmount,
      recentInvoices,
      monthlyRevenue,
      topClients,
      paidInvoices: paidInvoices.length,
      emailStats,
      recentEmailActivity
    }
  } catch (error) {
    console.error('Error fetching dashboard data from Supabase:', error)
    return null
  }
}


export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }

  const data = await getDashboardData()

  if (!data) {
    return (
      <DashboardLayout>
        <DashboardLoadingSkeleton />
      </DashboardLayout>
    )
  }

  const stats = [
    {
      name: 'Total Revenue',
      value: `₹${data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CurrencyDollarIcon,
      accent: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60',
      change: `${data.paidInvoices} paid invoices`,
      trend: '+12% vs last month',
    },
    {
      name: 'Pending Amount',
      value: `₹${data.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ClockIcon,
      accent: 'from-indigo-500 to-primary-600',
      bgGlow: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/60',
      change: `${data.pendingInvoices} awaiting payment`,
      trend: 'Follow-ups recommended',
    },
    {
      name: 'Total Invoices',
      value: data.totalInvoices.toString(),
      icon: DocumentTextIcon,
      accent: 'from-blue-500 to-cyan-600',
      bgGlow: 'bg-blue-500/10 text-blue-600 border-blue-200/60',
      change: `${data.overdueInvoices} overdue`,
      trend: 'Lifetime generated',
    },
    {
      name: 'Active Clients',
      value: data.totalClients.toString(),
      icon: UserGroupIcon,
      accent: 'from-purple-500 to-violet-600',
      bgGlow: 'bg-purple-500/10 text-purple-600 border-purple-200/60',
      change: 'Client directory',
      trend: 'Recurring accounts',
    },
  ]

  // Max value for visual bar chart calculation
  const maxMonthlyRevenue = Math.max(...data.monthlyRevenue.map(m => m.revenue), 1000)

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Hemant'} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Here is what is happening with your invoices, clients, and payments today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/clients/new"
              className="btn-secondary text-xs sm:text-sm py-2 px-3.5"
            >
              <UserGroupIcon className="h-4 w-4 mr-1.5" />
              Add Client
            </Link>
            <Link
              href="/invoices/new"
              className="btn-primary text-xs sm:text-sm py-2 px-3.5"
            >
              <PlusIcon className="h-4 w-4 mr-1.5 stroke-[2.5]" />
              New Invoice
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <div
              key={stat.name}
              className="card-hover p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.name}
                </span>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${stat.bgGlow}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{stat.change}</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                    <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart & Top Clients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Revenue Bar Chart */}
          <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Revenue Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5">Monthly revenue trends for the last 6 months</p>
              </div>
              <Link
                href="/analytics"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View Analytics &rarr;
              </Link>
            </div>

            {/* Custom Interactive SVG / CSS Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="h-56 flex items-end gap-3 sm:gap-6 justify-between px-2">
                {data.monthlyRevenue.map((item, idx) => {
                  const percentage = Math.max(Math.round((item.revenue / maxMonthlyRevenue) * 100), 8)
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-slate-900 text-white text-[11px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-10">
                        ₹{item.revenue.toLocaleString('en-IN')}
                      </div>
                      <div className="w-full bg-slate-100 rounded-xl h-44 flex items-end p-1 overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-primary-600 to-indigo-500 rounded-lg group-hover:from-primary-500 group-hover:to-indigo-400 transition-all duration-500 shadow-sm"
                          style={{ height: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                        {item.month}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top Clients by Revenue */}
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Top Clients</h3>
                <Link href="/clients" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                  All Clients
                </Link>
              </div>
              <div className="divide-y divide-slate-100 mt-2">
                {data.topClients.length > 0 ? (
                  data.topClients.map((client, index) => (
                    <div key={index} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center border border-slate-200">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{client.name}</p>
                          <p className="text-[11px] text-slate-400">Rank #{index + 1}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        ₹{client.revenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No paid client revenue recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link href="/clients/new" className="btn-secondary w-full text-xs py-2">
                <PlusIcon className="h-3.5 w-3.5 mr-1" />
                Register New Client
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Invoices & Email Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices (2 cols) */}
          <div className="lg:col-span-2 card p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Invoices</h3>
                <p className="text-xs text-slate-500">Track recently dispatched client bills</p>
              </div>
              <Link href="/invoices" className="btn-secondary text-xs py-1.5 px-3">
                View All Invoices
              </Link>
            </div>

            {data.recentInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead>
                    <tr>
                      <th className="table-th">Invoice</th>
                      <th className="table-th">Client</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Due Date</th>
                      <th className="table-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="table-td font-semibold text-slate-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="table-td font-medium text-slate-700">
                          {invoice.clientName}
                        </td>
                        <td className="table-td font-bold text-slate-900">
                          ₹{invoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="table-td">
                          <StatusBadge status={invoice.status} pulse={invoice.status === 'sent'} />
                        </td>
                        <td className="table-td text-xs text-slate-500">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="table-td text-right">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 p-1 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <DocumentTextIcon className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No invoices generated yet</p>
                <Link href="/invoices/new" className="btn-primary text-xs py-2 px-4">
                  Create Your First Invoice
                </Link>
              </div>
            )}
          </div>

          {/* Email Activity Widget (1 col) */}
          <div className="card p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Email Delivery</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {data.emailStats.totalSent} sent
                </span>
              </div>

              {/* Delivery stats cards */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100">
                  <p className="text-[11px] font-bold uppercase text-teal-600">Delivered</p>
                  <p className="text-xl font-extrabold text-teal-900 mt-1">{data.emailStats.delivered}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                  <p className="text-[11px] font-bold uppercase text-rose-600">Failed</p>
                  <p className="text-xl font-extrabold text-rose-900 mt-1">{data.emailStats.failed}</p>
                </div>
              </div>

              {/* Recent activity list */}
              <div className="mt-4 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Dispatches</p>
                {data.recentEmailActivity.length > 0 ? (
                  data.recentEmailActivity.slice(0, 4).map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{activity.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-400">{activity.clientName}</p>
                      </div>
                      <StatusBadge status={activity.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No automated emails logged yet.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link href="/invoices" className="btn-secondary w-full text-xs py-2">
                <PaperAirplaneIcon className="h-3.5 w-3.5 mr-1" />
                Dispatch Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 