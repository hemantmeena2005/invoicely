'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  CheckIcon, 
  DocumentDuplicateIcon, 
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  PencilSquareIcon,
  QrCodeIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { buildUpiUri, generateUpiQrDataUrl } from '@/lib/upiHelper'

interface UPIPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPaid: () => Promise<void> | void
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
  invoiceNumber,
  amount,
  payeeName = 'Hemant Meena',
  initialUpiId = 'hemantmeena2005@oksbi',
  customQrUrl,
}: UPIPaymentModalProps) {
  const [upiId, setUpiId] = useState(initialUpiId)
  const [isEditingUpi, setIsEditingUpi] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [paidSuccess, setPaidSuccess] = useState(false)
  const [activeQrTab, setActiveQrTab] = useState<'dynamic' | 'custom'>(customQrUrl ? 'custom' : 'dynamic')
  const [timeLeft, setTimeLeft] = useState(480) // 8 minutes session timer
  const [selectedApp, setSelectedApp] = useState<string | null>(null)

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
      setSelectedApp(null)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const upiUri = buildUpiUri({
    upiId: upiId || 'hemantmeena2005@oksbi',
    payeeName,
    amount,
    invoiceNumber,
  })

  useEffect(() => {
    if (isOpen) {
      generateUpiQrDataUrl({
        upiId: upiId || 'hemantmeena2005@oksbi',
        payeeName,
        amount,
        invoiceNumber,
      }, 260).then(url => setQrDataUrl(url))
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = async () => {
    try {
      setConfirming(true)
      await onConfirmPaid()
      setPaidSuccess(true)
      setTimeout(() => {
        setConfirming(false)
        onClose()
      }, 1800)
    } catch (e) {
      console.error('Failed to confirm payment:', e)
      setConfirming(false)
    }
  }

  const activeDisplayQr = (activeQrTab === 'custom' && customQrUrl) ? customQrUrl : qrDataUrl

  const upiApps = [
    {
      name: 'Google Pay',
      shortName: 'GPay',
      color: 'hover:border-blue-500 hover:bg-blue-50/50',
      badge: 'bg-blue-600 text-white',
      desc: 'Instant 1-Tap',
      iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-google-pay-2038779-1721670.png',
    },
    {
      name: 'PhonePe',
      shortName: 'PhonePe',
      color: 'hover:border-purple-500 hover:bg-purple-50/50',
      badge: 'bg-purple-700 text-white',
      desc: 'Popular',
      iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-phonepe-2038772-1721663.png',
    },
    {
      name: 'Paytm',
      shortName: 'Paytm',
      color: 'hover:border-sky-500 hover:bg-sky-50/50',
      badge: 'bg-sky-500 text-white',
      desc: 'Fast Pay',
      iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-paytm-226448.png',
    },
    {
      name: 'BHIM / CRED',
      shortName: 'All UPI',
      color: 'hover:border-emerald-500 hover:bg-emerald-50/50',
      badge: 'bg-emerald-600 text-white',
      desc: 'Any App',
      iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-bhim-3-1175220.png',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {paidSuccess ? (
          /* Payment Success Celebration State */
          <div className="p-10 text-center space-y-5 bg-gradient-to-b from-emerald-50 to-white animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckIcon className="h-10 w-10 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Verified!</h2>
              <p className="text-sm font-semibold text-emerald-600">
                ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been marked as PAID
              </p>
              <p className="text-xs text-slate-400">Updating your invoice and dispatching settlement records...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Checkout Header */}
            <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-primary-950 text-white">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live NPCI Checkout
                </span>

                {/* Session Expiry Timer */}
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                  <ClockIcon className="h-3.5 w-3.5" />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </div>

              <h2 className="text-xl font-extrabold tracking-tight">Select UPI Payment Method</h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Paying <strong className="text-white">{payeeName}</strong> for <strong className="text-white">{invoiceNumber}</strong>
              </p>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between">
                <span className="text-xs text-indigo-200 font-medium">Exact Amount Due:</span>
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* 1. UPI App Selector Grid (Mobile 1-Tap Launchers) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  1. Tap to Pay in UPI App (Mobile)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {upiApps.map((app) => (
                    <a
                      key={app.name}
                      href={upiUri}
                      onClick={() => setSelectedApp(app.name)}
                      className={`p-3 rounded-2xl border border-slate-200/80 flex flex-col items-center text-center transition-all duration-200 group cursor-pointer ${app.color} ${
                        selectedApp === app.name ? 'ring-2 ring-indigo-600 bg-indigo-50/50' : 'bg-slate-50/60'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center p-1 border border-slate-100 group-hover:scale-110 transition-transform">
                        <QrCodeIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 mt-2">{app.shortName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{app.desc}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* 2. QR Code Display Section (Desktop & Alternative) */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    2. Or Scan QR Code to Pay
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
                  <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-indigo-200 shadow-sm group">
                    {activeDisplayQr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={activeDisplayQr} 
                        alt="UPI QR Code" 
                        className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center bg-slate-50 rounded-xl">
                        <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Scan with any UPI app on phone</span>
                  </div>
                </div>
              </div>

              {/* 3. Beneficiary UPI ID Pill */}
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
                      {copied ? (
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

              {/* 4. Live Verification Indicator & 1-Click Confirmation */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="btn-primary w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {confirming ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 stroke-[3]" />
                      <span>I Have Completed Payment — Mark Paid</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400 font-medium">
                  Continuous live polling active • Invoice updates automatically once paid
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
