'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  DocumentTextIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  SparklesIcon,
  QrCodeIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  CheckIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { buildUpiUri, generateUpiQrDataUrl } from '@/lib/upiHelper'

interface PublicInvoice {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string
  paidAt?: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  terms?: string
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  client: {
    name: string
    email?: string
    company?: string
    address?: any
  }
  merchant: {
    name: string
    email: string
    businessName?: string
    businessPhone?: string
    businessAddress?: string
    upiId: string
    upiName: string
    upiQrCode?: string
  }
}

export default function PublicPayPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [activeQrType, setActiveQrType] = useState<'dynamic' | 'custom'>('dynamic')
  const [confirmingPaid, setConfirmingPaid] = useState(false)
  const [celebrateSuccess, setCelebrateSuccess] = useState(false)

  useEffect(() => {
    fetchPublicInvoice()
  }, [invoiceId])

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setCelebrateSuccess(true)
      handleMarkPaid()
    }
  }, [searchParams])

  const fetchPublicInvoice = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/pay/${invoiceId}`)
      if (!res.ok) {
        throw new Error('Invoice not found or expired')
      }
      const data = await res.json()
      setInvoice(data.invoice)

      if (data.invoice.merchant.upiQrCode) {
        setActiveQrType('custom')
      }

      // Generate dynamic UPI QR
      generateUpiQrDataUrl({
        upiId: data.invoice.merchant.upiId || 'hemantmeena2005@oksbi',
        payeeName: data.invoice.merchant.upiName || data.invoice.merchant.name,
        amount: data.invoice.total,
        invoiceNumber: data.invoice.invoiceNumber,
      }, 280).then((url) => setQrDataUrl(url))

      if (data.invoice.status === 'paid') {
        setCelebrateSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    try {
      setConfirmingPaid(true)
      const res = await fetch(`/api/pay/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      })

      if (res.ok) {
        setCelebrateSuccess(true)
        if (invoice) {
          setInvoice({ ...invoice, status: 'paid', paidAt: new Date().toISOString() })
        }
      }
    } catch (e) {
      console.error('Failed to confirm paid:', e)
    } finally {
      setConfirmingPaid(false)
    }
  }

  const handleCopyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 animate-pulse-glow flex items-center justify-center shadow-glow-primary">
            <DocumentTextIcon className="h-6 w-6 text-white animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-400">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <InformationCircleIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invoice Unavailable</h2>
          <p className="text-sm text-slate-500">{error || 'This invoice does not exist or has been removed.'}</p>
        </div>
      </div>
    )
  }

  const isPaid = invoice.status === 'paid'
  const payeeDisplayName = invoice.merchant.businessName || invoice.merchant.upiName || invoice.merchant.name
  const upiUri = buildUpiUri({
    upiId: invoice.merchant.upiId,
    payeeName: payeeDisplayName,
    amount: invoice.total,
    invoiceNumber: invoice.invoiceNumber,
  })

  const currentQrImage = (activeQrType === 'custom' && invoice.merchant.upiQrCode) ? invoice.merchant.upiQrCode : qrDataUrl

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500 selection:text-white pb-20">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-primary-600/25 via-indigo-600/15 to-transparent blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-glow-primary">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Invoicely<span className="text-primary-400">.</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/pay/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Payment Celebration Banner */}
        {celebrateSuccess && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-slate-900 border border-emerald-500/40 text-emerald-100 shadow-2xl animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 flex-shrink-0">
                <CheckCircleIcon className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Payment Completed!</h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Thank you! Payment for <strong className="text-white">{invoice.invoiceNumber}</strong> has been successfully processed.
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 whitespace-nowrap">
              ✓ Verified Paid
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Invoice Overview & Item Breakdown (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800/90 p-6 sm:p-7 shadow-xl space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                      isPaid
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight mt-1">{invoice.invoiceNumber}</h1>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Total Amount Due</span>
                  <span className="text-3xl font-black text-emerald-400 tracking-tight">
                    ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Billed By & Billed To Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 block">Billed By</span>
                  <p className="text-sm font-bold text-white">{payeeDisplayName}</p>
                  <p className="text-xs text-slate-400">{invoice.merchant.email}</p>
                  {invoice.merchant.businessPhone && (
                    <p className="text-xs text-slate-400">{invoice.merchant.businessPhone}</p>
                  )}
                  {invoice.merchant.businessAddress && (
                    <p className="text-xs text-slate-500">{invoice.merchant.businessAddress}</p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Billed To</span>
                  <p className="text-sm font-bold text-white">{invoice.client.name}</p>
                  {invoice.client.company && (
                    <p className="text-xs text-slate-300">{invoice.client.company}</p>
                  )}
                  {invoice.client.email && (
                    <p className="text-xs text-slate-400">{invoice.client.email}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-2">
                    Due Date: {new Date(invoice.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Services / Line Items</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/80">
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-3 text-center">Qty</th>
                        <th className="py-3 px-3 text-right">Rate</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="text-slate-300">
                          <td className="py-3 px-4 font-medium text-white">{item.description}</td>
                          <td className="py-3 px-3 text-center">{item.quantity}</td>
                          <td className="py-3 px-3 text-right">₹{Number(item.rate).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-white">₹{Number(item.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="pt-2 border-t border-slate-800 flex flex-col items-end space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between w-48">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-white">₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between w-48">
                    <span>Tax ({invoice.taxRate}%):</span>
                    <span className="font-semibold text-white">₹{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 pt-2 border-t border-slate-800 text-sm font-bold text-white">
                  <span>Total Due:</span>
                  <span className="text-emerald-400 font-black">₹{invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Payment Portal Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800/90 shadow-2xl p-6 sm:p-7 sticky top-6 space-y-6">
              {isPaid ? (
                <div className="text-center py-8 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center mx-auto">
                    <CheckCircleIcon className="h-10 w-10 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl font-black text-white">Invoice Already Paid</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    No further payment is required for this invoice. You can download the official receipt below.
                  </p>
                  <a
                    href={`/api/pay/${invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-sm font-bold flex items-center justify-center gap-2 mt-4"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download Payment Receipt
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <QrCodeIcon className="h-5 w-5 text-emerald-400" />
                        Pay via UPI
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Scan with Google Pay, PhonePe, Paytm, or BHIM
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-400/30">
                      0% Gateway Fees
                    </span>
                  </div>

                  <div className="space-y-5 pt-2">
                    {/* QR Switcher if user uploaded custom QR */}
                    {invoice.merchant.upiQrCode && (
                      <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setActiveQrType('custom')}
                          className={`flex-1 py-1 rounded-lg transition-colors ${
                            activeQrType === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Merchant Custom QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveQrType('dynamic')}
                          className={`flex-1 py-1 rounded-lg transition-colors ${
                            activeQrType === 'dynamic' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Dynamic ₹{invoice.total} QR
                        </button>
                      </div>
                    )}

                    {/* QR Display Container */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-indigo-300 shadow-xl">
                        {currentQrImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentQrImage}
                            alt="Scan to Pay UPI"
                            className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl">
                            <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Supported apps */}
                      <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Google Pay</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">PhonePe</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Paytm</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">BHIM</span>
                      </div>
                    </div>

                    {/* UPI ID Pill */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Beneficiary UPI ID
                        </span>
                        <span className="font-mono text-xs font-bold text-white truncate block">
                          {invoice.merchant.upiId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyUpi(invoice.merchant.upiId)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                      >
                        {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <DocumentDuplicateIcon className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* 1-Tap Mobile Intent Link */}
                    <a
                      href={upiUri}
                      className="btn-primary w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      Open in UPI App (GPay / PhonePe)
                    </a>

                    {/* Manual Confirmation Button */}
                    <button
                      type="button"
                      onClick={handleMarkPaid}
                      disabled={confirmingPaid}
                      className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CheckIcon className="h-4 w-4 text-emerald-400" />
                      {confirmingPaid ? 'Verifying...' : "I Have Transferred Payment — Confirm"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
