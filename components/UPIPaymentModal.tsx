'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  CheckIcon, 
  DocumentDuplicateIcon, 
  QrCodeIcon,
  ClockIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'
import { buildUpiUri, generateUpiQrDataUrl } from '@/lib/upiHelper'

interface UPIPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPaid: (utr?: string) => Promise<void> | void
  invoiceId?: string
  invoiceNumber: string
  amount: number
  payeeName?: string
  initialUpiId?: string
  customQrUrl?: string
}

export default function UPIPaymentModal({
  isOpen,
  onClose,
  onConfirmPaid,
  invoiceId,
  invoiceNumber,
  amount,
  payeeName = 'John Doe',
  initialUpiId = 'demo@upi',
  customQrUrl,
}: UPIPaymentModalProps) {
  const [upiId, setUpiId] = useState(initialUpiId)
  const [isEditingUpi, setIsEditingUpi] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [paidSuccess, setPaidSuccess] = useState(false)
  const [activeQrTab, setActiveQrTab] = useState<'dynamic' | 'custom'>(customQrUrl ? 'custom' : 'dynamic')
  const [timeLeft, setTimeLeft] = useState(480) // 8 minutes session timer
  const [utrInput, setUtrInput] = useState('')
  const [utrError, setUtrError] = useState<string | null>(null)

  useEffect(() => {
    if (initialUpiId) {
      setUpiId(initialUpiId)
    }
  }, [initialUpiId])

  useEffect(() => {
    if (customQrUrl) {
      setActiveQrTab('custom')
    } else {
      setActiveQrTab('dynamic')
    }
  }, [customQrUrl])

  // Session timer countdown
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(480)
      setPaidSuccess(false)
      setUtrInput('')
      setUtrError(null)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const paymentParams = {
    upiId: upiId || 'demo@upi',
    payeeName,
    amount,
    invoiceNumber,
  }

  useEffect(() => {
    if (isOpen) {
      generateUpiQrDataUrl(paymentParams, 280).then(url => setQrDataUrl(url))
    }
  }, [isOpen, upiId, payeeName, amount, invoiceNumber])

  if (!isOpen) return null

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString())
    setCopiedAmount(true)
    setTimeout(() => setCopiedAmount(false), 2000)
  }

  const handleConfirm = async () => {
    const cleanUtr = utrInput.trim()
    if (cleanUtr && cleanUtr.length < 10) {
      setUtrError('Please enter a valid 12-digit UPI reference number (UTR).')
      return
    }

    try {
      setConfirming(true)
      setUtrError(null)

      if (invoiceId && cleanUtr) {
        // Call backend verification if invoiceId is available
        const res = await fetch(`/api/pay/${invoiceId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ utr: cleanUtr }),
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to verify UTR')
        }
      }

      await onConfirmPaid(cleanUtr || undefined)
      setPaidSuccess(true)
      setTimeout(() => {
        setConfirming(false)
        onClose()
      }, 1800)
    } catch (e: any) {
      console.error('Failed to confirm payment:', e)
      setUtrError(e.message || 'Verification failed. Please try again.')
      setConfirming(false)
    }
  }

  const activeDisplayQr = (activeQrTab === 'custom' && customQrUrl) ? customQrUrl : qrDataUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {paidSuccess ? (
          /* Payment Success Celebration State */
          <div className="p-10 text-center space-y-5 bg-gradient-to-b from-emerald-50 to-white animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckIcon className="h-10 w-10 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Recorded!</h2>
              <p className="text-sm font-semibold text-emerald-600">
                ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} marked as PAID
              </p>
              {utrInput && (
                <p className="text-xs font-mono text-slate-500 mt-1">
                  UTR: {utrInput}
                </p>
              )}
              <p className="text-xs text-slate-400">Updating your invoice records...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Checkout Header */}
            <div className="relative px-6 pt-5 pb-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-primary-950 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  UPI Direct QR
                </span>

                {/* Session Expiry Timer */}
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                  <ClockIcon className="h-3.5 w-3.5" />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </div>

              <h2 className="text-xl font-extrabold tracking-tight">Pay via UPI QR</h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Invoice <strong className="text-white">{invoiceNumber}</strong> • Payee <strong className="text-white">{payeeName}</strong>
              </p>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-baseline justify-between">
                <span className="text-xs text-indigo-200 font-medium">Exact Amount:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-400 tracking-tight">
                    ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={handleCopyAmount}
                    title="Copy Amount"
                    className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-xs text-emerald-200 transition-colors"
                  >
                    {copiedAmount ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <DocumentDuplicateIcon className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* 1. High-Res QR Code Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Scan QR to Pay
                  </span>
                  {customQrUrl && (
                    <div className="flex p-0.5 bg-slate-100 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setActiveQrTab('dynamic')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          activeQrTab === 'dynamic' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Dynamic ₹{amount}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveQrTab('custom')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          activeQrTab === 'custom' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Merchant QR
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-indigo-200 shadow-sm">
                    {activeDisplayQr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={activeDisplayQr} 
                        alt="UPI QR Code" 
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-xl">
                        <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Scan with any UPI app (GPay, PhonePe, Paytm, Navi, BHIM)</span>
                  </div>
                </div>
              </div>

              {/* 2. Beneficiary UPI ID Card */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Beneficiary UPI ID</span>
                  <button 
                    onClick={() => setIsEditingUpi(!isEditingUpi)}
                    className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    {isEditingUpi ? 'Done' : 'Change'}
                  </button>
                </div>

                {isEditingUpi ? (
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@okhdfcbank"
                    className="input-field text-xs py-1.5 px-3 bg-white"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-sm font-mono truncate">{upiId}</span>
                    <button
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 shadow-sm transition-all"
                    >
                      {copiedUpi ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <DocumentDuplicateIcon className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* 3. 12-Digit Bank UTR / Reference Number Input */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
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
                  placeholder="e.g. 426718902345 (optional for manual mark)"
                  className="input-field text-xs py-2 px-3 bg-white font-mono tracking-wider placeholder:tracking-normal placeholder:text-slate-400"
                />

                {utrError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                    {utrError}
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  Find the 12-digit UPI Ref / UTR No on your GPay, PhonePe, Paytm, or Navi receipt
                </p>
              </div>

              {/* 4. Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="btn-primary w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {confirming ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Verifying & Recording Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 stroke-[3]" />
                      <span>{utrInput.trim() ? 'Verify UTR & Mark Paid' : 'I Have Completed Payment — Mark Paid'}</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Direct bank settlement • 0% platform commission
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
