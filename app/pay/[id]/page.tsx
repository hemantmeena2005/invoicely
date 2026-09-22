'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowPathIcon,
  InformationCircleIcon
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
    email: string
    company?: string
    phone?: string
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

export default function PublicInvoicePayPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [activeQrType, setActiveQrType] = useState<'dynamic' | 'custom'>('dynamic')
  const [copied, setCopied] = useState(false)
  const [confirmingPaid, setConfirmingPaid] = useState(false)
  const [celebrateSuccess, setCelebrateSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(480) // 8 minute session timer

  useEffect(() => {
    if (invoiceId) {
      fetchPublicInvoice()
    }

    // Continuous Real-Time Payment Polling (every 3 seconds)
    const interval = setInterval(() => {
      if (invoice?.status !== 'paid') {
        fetchPublicInvoice(true)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [invoiceId, invoice?.status])

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setCelebrateSuccess(true)
      fetchPublicInvoice()
    }
  }, [searchParams])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const fetchPublicInvoice = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await fetch(`/api/pay/${invoiceId}`)
      if (!res.ok) {
        throw new Error('Invoice not found or expired')
      }
      const data = await res.json()
      
      setInvoice((prev) => {
        if (prev?.status !== 'paid' && data.invoice.status === 'paid') {
          setCelebrateSuccess(true)
        }
        return data.invoice
      })

      if (data.invoice.merchant.upiQrCode && !silent) {
        setActiveQrType('custom')
      }

      // Generate dynamic UPI QR
      if (!silent || !qrDataUrl) {
        generateUpiQrDataUrl({
          upiId: data.invoice.merchant.upiId || 'hemantmeena2005@oksbi',
          payeeName: data.invoice.merchant.upiName || data.invoice.merchant.name,
          amount: data.invoice.total,
          invoiceNumber: data.invoice.invoiceNumber,
        }, 280).then((url) => setQrDataUrl(url))
      }

      if (data.invoice.status === 'paid') {
        setCelebrateSuccess(true)
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load invoice')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const [utrInput, setUtrInput] = useState('')
  const [utrError, setUtrError] = useState<string | null>(null)
  const [verifiedUtr, setVerifiedUtr] = useState<string | null>(null)

  const handleVerifyUtr = async () => {
    if (!utrInput.trim()) {
      setUtrError('Please enter the 12-digit UPI reference (UTR) from your receipt.')
      return
    }

    try {
      setConfirmingPaid(true)
      setUtrError(null)

      const res = await fetch(`/api/pay/${invoiceId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utr: utrInput.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify UTR')
      }

      setVerifiedUtr(data.utr)
      setCelebrateSuccess(true)
      if (invoice) {
        setInvoice({ ...invoice, status: 'paid', paidAt: data.paidAt || new Date().toISOString() })
      }
    } catch (e: any) {
      setUtrError(e.message || 'Verification failed. Please check the UTR number.')
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center space-y-4 shadow-2xl bg-slate-900 border border-slate-800">
          <div className="h-14 w-14 rounded-2xl bg-rose-950/80 text-rose-400 mx-auto flex items-center justify-center border border-rose-800/60">
            <InformationCircleIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Invoice Unavailable</h2>
          <p className="text-sm text-slate-400">{error || 'This invoice does not exist or has been removed.'}</p>
        </div>
      </div>
    )
  }

  const isPaid = invoice.status === 'paid'
  const payeeDisplayName = invoice.merchant.businessName || invoice.merchant.upiName || invoice.merchant.name
  const currentQrImage = (activeQrType === 'custom' && invoice.merchant.upiQrCode) ? invoice.merchant.upiQrCode : qrDataUrl

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500 selection:text-white pb-20">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-primary-600/25 via-indigo-600/15 to-transparent blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 py-4 flex items-center justify-between">
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
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Payment Celebration Banner */}
        {celebrateSuccess && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-emerald-900/70 to-slate-900 border border-emerald-500/40 text-emerald-100 shadow-2xl animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-glow-primary">
                <SparklesIcon className="h-7 w-7 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Payment Successfully Verified!</h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Your settlement of <strong className="text-white font-black">₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> has been confirmed and recorded.
                </p>
              </div>
            </div>
            <a
              href={`/api/pay/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 transition-colors shadow-md flex items-center gap-1.5"
            >
              <ArrowDownTrayIcon className="h-4 w-4 stroke-[2.5]" />
              Official Receipt
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Official Invoice Details Sheet (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800/80 p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Header inside invoice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
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
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircleIcon className="h-10 w-10 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl font-black text-white">Invoice Already Paid</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Payment has been verified and settled directly into the merchant account.
                  </p>
                  <a
                    href={`/api/pay/${invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-sm font-bold flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download Official Receipt
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <QrCodeIcon className="h-5 w-5 text-emerald-400" />
                        Live UPI Checkout
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Scan or tap to pay directly via UPI
                      </p>
                    </div>

                    {/* Expiry Timer */}
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>{formatTimer(timeLeft)}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* 1. QR Code Display */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Scan QR Code to Pay
                        </span>
                        {invoice.merchant.upiQrCode && (
                          <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setActiveQrType('dynamic')}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                activeQrType === 'dynamic' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                              }`}
                            >
                              Dynamic ₹{invoice.total}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveQrType('custom')}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                activeQrType === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                              }`}
                            >
                              Merchant QR
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-indigo-300 shadow-xl">
                          {currentQrImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={currentQrImage}
                              alt="Scan to Pay UPI"
                              className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                            />
                          ) : (
                            <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl">
                              <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Scan with Google Pay, PhonePe, Paytm, Navi or any UPI app</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Beneficiary UPI ID Pill */}
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

                    {/* UPI Limits & Guidance Notice */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-indigo-900/50 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                        <InformationCircleIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                        <span>Payment Limit Guide</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[10px] pl-1">
                        <li><strong className="text-slate-300">Amounts &gt; ₹2,000:</strong> Tap the app button directly or scan with camera (PhonePe photo gallery upload has a ₹2,000 fraud cap).</li>
                        <li><strong className="text-slate-300">Bank Limit Warning:</strong> If GPay reports a bank limit, try PhonePe/Paytm or copy the UPI ID directly.</li>
                      </ul>
                    </div>

                    {/* 4. Bank UTR Verification Input & Confirm */}
                    <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheckIcon className="h-4 w-4" />
                            Enter 12-Digit Bank UTR / Ref No
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {utrInput.length}/12
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={16}
                          value={utrInput}
                          onChange={(e) => {
                            setUtrInput(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))
                            setUtrError(null)
                          }}
                          placeholder="e.g. 426718902345"
                          className="input-field bg-slate-900 border-slate-700 text-white font-mono text-sm tracking-widest placeholder:tracking-normal placeholder:text-slate-500 py-2.5"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Found in your Google Pay, PhonePe, or Paytm payment receipt
                        </p>
                      </div>

                      {utrError && (
                        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
                          {utrError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleVerifyUtr}
                        disabled={confirmingPaid || utrInput.length < 10}
                        className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer text-white"
                      >
                        {confirmingPaid ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            <span>Verifying Bank UTR...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="h-4 w-4 stroke-[2.5]" />
                            <span>Verify & Confirm Payment</span>
                          </>
                        )}
                      </button>

                      <p className="text-center text-[10px] text-slate-500">
                        Protected against duplicate submissions • Instant bank audit trail
                      </p>
                    </div>
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
