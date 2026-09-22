import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton, StatCardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton'

async function getAnalyticsData() {
  const user = await getSessionUser()
  if (!user) return null

  try {
    const [invoicesRes, clientsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, client:clients(name)')
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
    
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent')
    const overdueInvoices = invoices.filter(inv => {
      return inv.status === 'sent' && new Date(inv.due_date) < new Date()
    })
    const draftInvoices = invoices.filter(inv => inv.status === 'draft')
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)

    // Monthly revenue for the last 12 months
    const monthlyRevenue = []
    const currentDate = new Date()
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0)
      
      const monthInvoices = paidInvoices.filter(inv => {
        const paidDate = new Date(inv.paid_at || inv.updated_at || inv.created_at)
        return paidDate >= monthStart && paidDate <= monthEnd
      })
      
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        count: monthInvoices.length
      })
    }

    // Top clients by revenue
    const clientRevenue: { [key: string]: number } = {}
    const clientInvoiceCount: { [key: string]: number } = {}
    
    paidInvoices.forEach(invoice => {
      const clientName = invoice.client?.name || 'Unknown'
      clientRevenue[clientName] = (clientRevenue[clientName] || 0) + (Number(invoice.total) || 0)
      clientInvoiceCount[clientName] = (clientInvoiceCount[clientName] || 0) + 1
    })
    
    const topClients = Object.entries(clientRevenue)
      .map(([name, totalPaid]) => ({ 
        name, 
        totalPaid, 
        invoiceCount: clientInvoiceCount[name] || 0 
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 8)

    const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0
    const previousMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0

    const averageInvoiceValue = paidInvoices.length > 0 
      ? totalRevenue / paidInvoices.length 
      : 0

    const collectionRate = totalInvoices > 0 
      ? (paidInvoices.length / totalInvoices) * 100 
      : 0

    return {
      totalInvoices,
      totalClients,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      draftInvoices: draftInvoices.length,
      totalRevenue,
      pendingAmount,
      overdueAmount,
      monthlyRevenue,
      topClients,
      revenueGrowth,
      averageInvoiceValue,
      collectionRate,
    }
  } catch (error) {
    console.error('Error fetching analytics from Supabase:', error)
    return null
  }
}


export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }

  const data = await getAnalyticsData()

  if (!data) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          <Skeleton className="h-8 w-44" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <ChartSkeleton />
        </div>
      </DashboardLayout>
    )
  }

  const maxRevenue = Math.max(...data.monthlyRevenue.map(m => m.revenue), 1000)

  const stats = [
    {
      name: 'Total Revenue',
      value: `₹${data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CurrencyDollarIcon,
      bgGlow: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60',
      change: `${data.revenueGrowth >= 0 ? '+' : ''}${data.revenueGrowth.toFixed(1)}% vs last mo`,
      trend: data.revenueGrowth >= 0 ? 'positive' : 'negative',
    },
    {
      name: 'Collection Rate',
      value: `${data.collectionRate.toFixed(1)}%`,
      icon: CheckCircleIcon,
      bgGlow: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/60',
      change: `${data.paidInvoices} of ${data.totalInvoices} settled`,
      trend: 'positive',
    },
    {
      name: 'Average Invoice',
      value: `₹${data.averageInvoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ChartBarIcon,
      bgGlow: 'bg-blue-500/10 text-blue-600 border-blue-200/60',
      change: 'Per completed bill',
      trend: 'neutral',
    },
    {
      name: 'Outstanding',
      value: `₹${(data.pendingAmount + data.overdueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ClockIcon,
      bgGlow: 'bg-amber-500/10 text-amber-600 border-amber-200/60',
      change: `${data.pendingInvoices + data.overdueInvoices} unpaid invoices`,
      trend: data.overdueInvoices > 0 ? 'negative' : 'neutral',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Analytics & Financials</h1>
          <p className="text-slate-500 text-sm mt-0.5">Deep insights into revenue velocity, client rankings, and cash flow</p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div key={stat.name} className="card-hover p-6 relative">
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
                    Insight
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 12-Month Revenue Chart */}
        <div className="card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Annual Revenue Trajectory</h2>
              <p className="text-xs text-slate-500 mt-0.5">12-month paid revenue performance</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
              <span className="text-xs font-semibold text-slate-600">Monthly Revenue</span>
            </div>
          </div>

          <div className="pt-4 pb-2">
            <div className="h-64 flex items-end gap-2 sm:gap-4 justify-between px-2">
              {data.monthlyRevenue.map((item, idx) => {
                const percentage = Math.max(Math.round((item.revenue / maxRevenue) * 100), 6)
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-10">
                      ₹{item.revenue.toLocaleString('en-IN')} ({item.count} inv)
                    </div>
                    <div className="w-full bg-slate-100 rounded-xl h-52 flex items-end p-1 overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-primary-600 to-indigo-500 rounded-lg group-hover:from-primary-500 group-hover:to-indigo-400 transition-all duration-500 shadow-sm"
                        style={{ height: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                      {item.month}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Clients Leaderboard & Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Clients (2 cols) */}
          <div className="lg:col-span-2 card p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Client Revenue Ranking</h3>
                <p className="text-xs text-slate-500">Top contributors to your business income</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {data.topClients.length > 0 ? (
                data.topClients.map((client, idx) => {
                  const maxClientRevenue = data.topClients[0]?.totalPaid || 1
                  const progress = Math.round((client.totalPaid / maxClientRevenue) * 100)
                  return (
                    <div key={idx} className="py-3.5 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' :
                            idx === 1 ? 'bg-slate-200 text-slate-800' :
                            idx === 2 ? 'bg-amber-700/20 text-amber-900' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{client.name}</span>
                          <span className="text-xs text-slate-400">({client.invoiceCount} invoices)</span>
                        </div>
                        <span className="font-extrabold text-slate-900">
                          ₹{client.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No client revenue records available yet.
                </div>
              )}
            </div>
          </div>

          {/* Status Breakdown (1 col) */}
          <div className="card p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4">
              Invoice Distribution
            </h3>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-900">Paid Invoices</span>
                </div>
                <span className="text-sm font-extrabold text-emerald-900">{data.paidInvoices}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-indigo-900">Sent / Pending</span>
                </div>
                <span className="text-sm font-extrabold text-indigo-900">{data.pendingInvoices}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-rose-900">Overdue</span>
                </div>
                <span className="text-sm font-extrabold text-rose-900">{data.overdueInvoices}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-900">Drafts</span>
                </div>
                <span className="text-sm font-extrabold text-amber-900">{data.draftInvoices}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}