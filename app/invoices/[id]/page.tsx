'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon, 
  CreditCardIcon, 
  PencilIcon, 
  EnvelopeIcon, 
  ClockIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  QrCodeIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import UPIPaymentModal from '@/components/UPIPaymentModal'
import { REMINDER_OPTIONS, ReminderSchedule, getScheduleBadge, cleanDisplayTerms } from '@/lib/reminderHelper'

interface Invoice {
  _id: string
  invoiceNumber: string
  clientId: {
    name: string
    email: string
    company?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }
  }
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: string
  issueDate: string
  dueDate: string
  notes?: string
  terms?: string
  paidAt?: string
  emailStatus?: string
  lastEmailedAt?: string
  reminderSchedule?: ReminderSchedule
  nextReminderAt?: string | null
  reminderCount?: number
  emailLogs?: Array<{
    sentAt: string
    emailType: string
    recipient: string
    status: string
    messageId?: string
    automatedCron?: boolean
    schedule?: string
  }>
}

export default function InvoiceViewPage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [paymentSuccessCelebration, setPaymentSuccessCelebration] = useState(false)
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{ upi_id?: string; upi_name?: string; upi_qr_code?: string; name?: string } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const invoiceId = params.id as string

  useEffect(() => {
    fetchInvoice()
    fetchEmailStatus()
    fetchProfile()

    // Real-time polling to detect client payment instantly
    const interval = setInterval(() => {
      if (invoice?.status !== 'paid') {
        fetchInvoice(true) // silent refresh
      }
    }, 4000)

    const handleFocus = () => {
      fetchInvoice(true)
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [invoiceId, invoice?.status])

  const handleCopyPaymentLink = () => {
    const origin = window.location.origin
    const payUrl = `${origin}/pay/${invoiceId}`
    navigator.clipboard.writeText(payUrl)
    setCopiedLink(true)
    setFeedbackMessage(`Copied payment link: ${payUrl}`)
    setTimeout(() => {
      setCopiedLink(false)
      setFeedbackMessage(null)
    }, 3000)
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data.user)
      }
    } catch (e) {
      console.error('Failed to load profile for UPI:', e)
    }
  }

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setPaymentSuccessCelebration(true)
      // Auto update status to paid in database
      fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      }).then(() => {
        fetchInvoice()
      })
    }
  }, [searchParams, invoiceId])

  const fetchInvoice = async (silent = false) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(prev => {
          if (prev?.status !== 'paid' && data.status === 'paid') {
            setPaymentSuccessCelebration(true)
          }
          return data
        })
      } else if (!silent) {
        router.push('/invoices')
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching invoice:', error)
        router.push('/invoices')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const fetchEmailStatus = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`)
      if (response.ok) {
        const data = await response.json()
        setEmailStatus(data)
      }
    } catch (error) {
      console.error('Error fetching email status:', error)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleToggleStatus = async (newStatus: 'paid' | 'draft' | 'sent', utr?: string) => {
    setFeedbackMessage(null)
    const updatedNotes = utr 
      ? `${invoice?.notes || ''}\n[UPI Settlement UTR: ${utr}]`.trim() 
      : invoice?.notes

    // Instant optimistic update
    setInvoice(prev => prev ? {
      ...prev,
      status: newStatus,
      notes: updatedNotes,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : undefined,
    } : prev)

    if (newStatus === 'paid') {
      setPaymentSuccessCelebration(true)
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          notes: updatedNotes
        }),
      })
      if (response.ok) {
        const updated = await response.json()
        setInvoice(updated)
        setFeedbackMessage(`Invoice status updated to ${newStatus.toUpperCase()}`)
      } else {
        setFeedbackMessage('Failed to update invoice status')
        fetchInvoice()
      }
    } catch (error) {
      setFeedbackMessage('An error occurred updating status')
      fetchInvoice()
    }
  }

  const handleSendEmail = async (emailType: 'invoice' | 'reminder') => {
    setEmailLoading(true)
    setFeedbackMessage(null)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailType }),
      })

      if (response.ok) {
        const result = await response.json()
        setFeedbackMessage(`Success: ${result.message || 'Email sent successfully'}`)
        fetchInvoice()
        fetchEmailStatus()
      } else {
        const error = await response.json()
        setFeedbackMessage(`Error: ${error.error || 'Failed to send email'}`)
      }
    } catch (error) {
      setFeedbackMessage('An error occurred while sending email.')
    } finally {
      setEmailLoading(false)
    }
  }

  const [scheduleUpdating, setScheduleUpdating] = useState(false)

  const handleUpdateReminderSchedule = async (newSchedule: ReminderSchedule) => {
    try {
      setScheduleUpdating(true)
      setFeedbackMessage(null)

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderSchedule: newSchedule }),
      })

      if (response.ok) {
        const updated = await response.json()
        setInvoice(prev => prev ? {
          ...prev,
          reminderSchedule: updated.reminderSchedule,
          nextReminderAt: updated.nextReminderAt,
        } : null)
        setFeedbackMessage(`Reminder schedule updated to ${REMINDER_OPTIONS.find(o => o.value === newSchedule)?.label}`)
      } else {
        setFeedbackMessage('Failed to update reminder schedule')
      }
    } catch (error) {
      setFeedbackMessage('Error updating reminder schedule')
    } finally {
      setScheduleUpdating(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <Skeleton className="h-6 w-32" />
          <div className="card p-8 space-y-6">
            <div className="flex justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) return null

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in w-full">
        {/* Navigation & Actions Topbar */}
        <div className="space-y-3">
          <div>
            <Link
              href="/invoices"
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Invoices
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
            <div className="flex items-center gap-3 shrink-0">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={invoice.status} pulse={invoice.status === 'sent'} />
            </div>

            {/* Action Buttons Toolbar - Guaranteed Single Line on Desktop */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
              <Link
                href={`/invoices/${invoice._id}/edit`}
                className="btn-secondary text-xs py-2 px-3 whitespace-nowrap shrink-0 inline-flex items-center"
              >
                <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Link>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="btn-secondary text-xs py-2 px-3 whitespace-nowrap shrink-0 inline-flex items-center disabled:opacity-50"
              >
                {downloading ? (
                  <div className="h-3.5 w-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin mr-1.5" />
                ) : (
                  <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1.5" />
                )}
                Download PDF
              </button>

              <button
                onClick={() => handleSendEmail(invoice.status === 'sent' ? 'reminder' : 'invoice')}
                disabled={emailLoading}
                className="btn-secondary text-xs py-2 px-3 whitespace-nowrap shrink-0 inline-flex items-center disabled:opacity-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                {emailLoading ? (
                  <div className="h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-1.5" />
                ) : (
                  <PaperAirplaneIcon className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                )}
                {invoice.status === 'sent' ? 'Send Reminder' : 'Email Invoice'}
              </button>

              <button
                onClick={handleCopyPaymentLink}
                className="btn-secondary text-xs py-2 px-3 whitespace-nowrap shrink-0 inline-flex items-center text-slate-700 border-slate-200 hover:bg-slate-50"
                title="Copy the public payment link to share with client"
              >
                <LinkIcon className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                {copiedLink ? 'Link Copied!' : 'Copy Payment Link'}
              </button>

              {invoice.status !== 'paid' ? (
                <>
                  <button
                    onClick={() => setIsUpiModalOpen(true)}
                    className="btn-primary text-xs py-2 px-3.5 whitespace-nowrap shrink-0 inline-flex items-center bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 text-white font-bold"
                    title="Pay with Google Pay, PhonePe, Paytm, BHIM, or CRED QR"
                  >
                    <QrCodeIcon className="h-3.5 w-3.5 mr-1.5" />
                    Pay via UPI
                  </button>

                  <button
                    onClick={() => handleToggleStatus('paid')}
                    className="btn-secondary text-xs py-2 px-3 whitespace-nowrap shrink-0 inline-flex items-center text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold"
                    title="Mark this invoice as Paid manually"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                    Mark as Paid
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleToggleStatus('sent')}
                  className="btn-secondary text-xs py-2 px-3 whitespace-nowrap shrink-0 inline-flex items-center text-slate-600 hover:bg-slate-50"
                  title="Mark invoice as Sent/Pending"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5" />
                  Unmark Paid
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Success Celebration Banner */}
        {paymentSuccessCelebration && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">🎉 Payment Successful!</h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Payment has been received and verified. This invoice is now officially marked as <strong>PAID</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPaymentSuccessCelebration(false)}
              className="px-4 py-1.5 rounded-lg bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Feedback alert */}
        {feedbackMessage && (
          <div className="p-3.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-800 text-xs font-semibold flex items-center justify-between">
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage(null)} className="text-primary-600 hover:underline text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Document Layout (Grid with document card & sidebar stats) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Official Invoice Sheet (2 cols) */}
          <div className="lg:col-span-2 card bg-white p-6 sm:p-10 shadow-lg border border-slate-200/80 space-y-8">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                    <DocumentTextIcon className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-black tracking-tight text-slate-900">Invoicely</span>
                </div>
                <p className="text-xs text-slate-400">Professional Billing & Financial Services</p>
              </div>

              <div className="sm:text-right space-y-1 shrink-0">
                <span className="text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">{invoice.invoiceNumber}</span>
                <p className="text-xs text-slate-500">
                  Issued: <span className="font-semibold text-slate-700">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Due: <span className="font-semibold text-rose-600">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            {/* Client & Bill-To info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100 text-sm">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Billed To</p>
                <p className="font-bold text-slate-800 text-base">{invoice.clientId?.name}</p>
                {invoice.clientId?.company && (
                  <p className="text-xs text-slate-600 font-medium">{invoice.clientId.company}</p>
                )}
                <p className="text-xs text-slate-500">{invoice.clientId?.email}</p>
              </div>

              <div className="space-y-1 sm:text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment Status</p>
                <div className="sm:inline-block">
                  <StatusBadge status={invoice.status} />
                </div>
                {invoice.paidAt && (
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                  </p>
                )}
                {invoice.terms && invoice.terms.includes('UTR:') && (
                  <div className="mt-1">
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1 shadow-sm">
                      <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                      UTR: {invoice.terms.split('UTR:')[1]?.split('|')[0]?.trim()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3">Description</th>
                    <th className="py-3 text-center">Qty</th>
                    <th className="py-3 text-right">Rate</th>
                    <th className="py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 font-semibold text-slate-800">{item.description}</td>
                      <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-600">
                        ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-right font-bold text-slate-900">
                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between pt-6 border-t border-slate-100 gap-6">
              <div className="text-xs text-slate-500 space-y-3 max-w-xs">
                {invoice.notes && (
                  <div>
                    <span className="font-bold uppercase text-[10px] text-slate-400">Notes</span>
                    <p className="mt-0.5">{invoice.notes}</p>
                  </div>
                )}
                {cleanDisplayTerms(invoice.terms) && (
                  <div>
                    <span className="font-bold uppercase text-[10px] text-slate-400">Terms</span>
                    <p className="mt-0.5">{cleanDisplayTerms(invoice.terms)}</p>
                  </div>
                )}
              </div>

              <div className="w-full sm:w-64 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    ₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({invoice.taxRate}%)</span>
                    <span className="font-semibold text-slate-800">
                      ₹{invoice.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Activity & Status Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Automated Payment Reminders Card */}
            <div className="card p-6 space-y-4 border border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BellAlertIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Scheduled Reminders</h3>
                </div>
                {invoice.status === 'paid' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Auto-Stopped
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScheduleBadge(invoice.reminderSchedule).badgeColor}`}>
                    {getScheduleBadge(invoice.reminderSchedule).label}
                  </span>
                )}
              </div>

              {invoice.status === 'paid' ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                    Invoice is Paid
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    All scheduled automated reminders have been automatically deactivated.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Reminder Frequency
                    </label>
                    <div className="relative">
                      <select
                        value={invoice.reminderSchedule || 'off'}
                        disabled={scheduleUpdating}
                        onChange={(e) => handleUpdateReminderSchedule(e.target.value as ReminderSchedule)}
                        className="input-field text-xs py-2 bg-white font-semibold text-slate-800 cursor-pointer disabled:opacity-50"
                      >
                        {REMINDER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} — {opt.description}
                          </option>
                        ))}
                      </select>
                      {scheduleUpdating && (
                        <div className="absolute right-3 top-2.5">
                          <ArrowPathIcon className="h-4 w-4 text-indigo-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {invoice.reminderSchedule && invoice.reminderSchedule !== 'off' && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Next Reminder:</span>
                        <span className="font-bold text-slate-900">
                          {invoice.nextReminderAt 
                            ? new Date(invoice.nextReminderAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Pending calculation'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Sent So Far:</span>
                        <span className="font-bold text-indigo-600">
                          {invoice.reminderCount || 0} reminder{(invoice.reminderCount || 0) === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => handleSendEmail('reminder')}
                      disabled={emailLoading}
                      className="btn-primary w-full text-xs py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      {emailLoading ? (
                        <>
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                          <span>Dispatching Email...</span>
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-3.5 w-3.5" />
                          <span>⚡ Send Instant Reminder Now</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                      Emails client with invoice PDF &amp; direct UPI pay link
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Email Tracking Card */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Email Tracking</h3>
                </div>
                <StatusBadge status={invoice.emailStatus || 'not_sent'} />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Recipient:</span>
                  <span className="font-semibold text-slate-800">{invoice.clientId?.email}</span>
                </div>
                {invoice.lastEmailedAt && (
                  <div className="flex justify-between text-slate-600">
                    <span>Last Sent:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(invoice.lastEmailedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSendEmail('reminder')}
                  disabled={emailLoading}
                  className="btn-secondary w-full text-xs py-2"
                >
                  <PaperAirplaneIcon className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Send Payment Reminder
                </button>
              </div>
            </div>

            {/* Email Logs History */}
            {invoice.emailLogs && invoice.emailLogs.length > 0 && (
              <div className="card p-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dispatch History ({invoice.emailLogs.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {invoice.emailLogs.map((log, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 capitalize">{log.emailType}</span>
                        <StatusBadge status={log.status} />
                      </div>
                      <p className="text-[11px] text-slate-400">{new Date(log.sentAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* UPI Payment Modal */}
        <UPIPaymentModal
          isOpen={isUpiModalOpen}
          onClose={() => setIsUpiModalOpen(false)}
          onConfirmPaid={(utr) => handleToggleStatus('paid', utr)}
          invoiceId={invoiceId}
          invoiceNumber={invoice.invoiceNumber}
          amount={invoice.total}
          payeeName={userProfile?.upi_name || userProfile?.name || 'Hemant Meena'}
          initialUpiId={userProfile?.upi_id || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'hemantmeena2005@oksbi'}
          customQrUrl={userProfile?.upi_qr_code || undefined}
        />
      </div>
    </DashboardLayout>
  )
}