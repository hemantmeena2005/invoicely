'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import {
  ClockIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  CurrencyRupeeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  SparklesIcon,
  CheckIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'

interface PaymentItem {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  amount: number
  paidAt: string
  paymentMethod: string
  status: string
}

interface EmailItem {
  id: string
  invoiceId: string
  invoiceNumber: string
  clientName: string
  recipient: string
  emailType: string
  status: string
  sentAt: string
  messageId?: string
}

export default function HistoryPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalTransactions: 0,
    totalEmailsSent: 0,
    averagePayment: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'payments' | 'emails' | 'timeline'>('payments')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '7days'>('all')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/history')
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        setEmails(data.emails || [])
        setStats(data.stats || {
          totalCollected: 0,
          totalTransactions: 0,
          totalEmailsSent: 0,
          averagePayment: 0,
        })
      }
    } catch (e) {
      console.error('Failed to fetch history:', e)
    } finally {
      setLoading(false)
    }
  }

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return new Date(p.paidAt) >= sevenDaysAgo
    }
    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return new Date(p.paidAt) >= thirtyDaysAgo
    }
    return true
  })

  // Filter emails
  const filteredEmails = emails.filter((e) => {
    const matchesSearch =
      e.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.recipient.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return new Date(e.sentAt) >= sevenDaysAgo
    }
    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return new Date(e.sentAt) >= thirtyDaysAgo
    }
    return true
  })

  // Export filtered payment history to CSV
  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Client Name', 'Client Email', 'Amount (INR)', 'Paid At Date', 'Status']
    const rows = filteredPayments.map((p) => [
      p.invoiceNumber,
      `"${p.clientName}"`,
      p.clientEmail,
      p.amount.toFixed(2),
      new Date(p.paidAt).toISOString(),
      p.status,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `payment-history-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ClockIcon className="h-8 w-8 text-primary-600 stroke-[2.2]" />
              Transaction & Activity History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Audit log of completed INR (₹) payments, UPI settlements, and Brevo email dispatches.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredPayments.length === 0}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 text-slate-600" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats KPIs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-slate-200/90 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Collected</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base border border-emerald-100">
                ₹
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  ₹{stats.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              )}
              <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                100% Settled via Direct UPI QR
              </p>
            </div>
          </div>

          <div className="card p-5 border-slate-200/90 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Paid Invoices</span>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <CheckIcon className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.totalTransactions}
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">Completed payment transactions</p>
            </div>
          </div>

          <div className="card p-5 border-slate-200/90 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Emails Dispatched</span>
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <PaperAirplaneIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.totalEmailsSent}
                </p>
              )}
              <p className="text-[11px] text-purple-600 mt-1 font-semibold">Delivered via Brevo Relay</p>
            </div>
          </div>

          <div className="card p-5 border-slate-200/90 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Payment</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <ArrowTrendingUpIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  ₹{stats.averagePayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">Per paid transaction</p>
            </div>
          </div>
        </div>

        {/* Tab Selector & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 max-w-md w-full">
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'emails'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <EnvelopeIcon className="h-4 w-4" />
              Email Audit ({emails.length})
            </button>
          </div>

          {/* Search & Date Filter */}
          <div className="flex items-center gap-2.5 flex-1 max-w-lg justify-end">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice #, client, or email..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="7days">Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* Content Table Card */}
        <div className="card border-slate-200/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : activeTab === 'payments' ? (
            filteredPayments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <DocumentTextIcon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No payment records found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm
                    ? 'No payments match your search criteria. Try a different query.'
                    : 'When clients pay your invoices via UPI or Card, their transactions will appear here.'}
                </p>
                <Link href="/invoices" className="btn-primary py-2 px-4 text-xs font-bold inline-block mt-2">
                  View Invoices
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="table-th">Invoice</th>
                      <th className="table-th">Client</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Paid Date & Time</th>
                      <th className="table-th">Method</th>
                      <th className="table-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="table-td">
                          <Link
                            href={`/invoices/${payment.id}`}
                            className="font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1.5"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            {payment.invoiceNumber}
                          </Link>
                        </td>
                        <td className="table-td">
                          <div className="font-semibold text-slate-900">{payment.clientName}</div>
                          <div className="text-[11px] text-slate-400">{payment.clientEmail}</div>
                        </td>
                        <td className="table-td">
                          <span className="font-extrabold text-emerald-600 text-sm">
                            ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="table-td">
                          <span className="text-xs text-slate-700 font-medium block">
                            {new Date(payment.paidAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(payment.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="table-td">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td className="table-td text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/invoices/${payment.id}`}
                              className="btn-secondary text-[11px] py-1 px-2.5"
                            >
                              View Invoice
                            </Link>
                            <a
                              href={`/api/invoices/${payment.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary text-[11px] py-1 px-2 text-slate-600"
                              title="Download PDF Receipt"
                            >
                              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filteredEmails.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <EnvelopeIcon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No email dispatch logs found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you send invoices or automated payment reminders to clients, delivery audit logs will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="table-th">Invoice</th>
                      <th className="table-th">Recipient</th>
                      <th className="table-th">Email Type</th>
                      <th className="table-th">Dispatch Timestamp</th>
                      <th className="table-th">Delivery Status</th>
                      <th className="table-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="table-td">
                          <Link
                            href={`/invoices/${email.invoiceId}`}
                            className="font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1.5"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            {email.invoiceNumber}
                          </Link>
                        </td>
                        <td className="table-td">
                          <div className="font-semibold text-slate-900">{email.clientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{email.recipient}</div>
                        </td>
                        <td className="table-td">
                          <span className="capitalize text-xs font-semibold text-slate-800">
                            {email.emailType === 'reminder' ? 'Payment Reminder' : 'Invoice Notification'}
                          </span>
                        </td>
                        <td className="table-td">
                          <span className="text-xs text-slate-700 font-medium block">
                            {new Date(email.sentAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="table-td">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            ✓ {email.status}
                          </span>
                        </td>
                        <td className="table-td text-right">
                          <Link
                            href={`/invoices/${email.invoiceId}`}
                            className="btn-secondary text-[11px] py-1 px-2.5"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
