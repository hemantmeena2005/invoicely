'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  CheckIcon, 
  DocumentDuplicateIcon, 
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  PencilSquareIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'
import { buildUpiUri, generateUpiQrDataUrl } from '@/lib/upiHelper'

interface UPIPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPaid: () => void
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
  const [activeQrTab, setActiveQrTab] = useState<'dynamic' | 'custom'>(customQrUrl ? 'custom' : 'dynamic')

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

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = async () => {
    setConfirming(true)
    await onConfirmPaid()
    setConfirming(false)
    onClose()
  }

  const activeDisplayQr = (activeQrTab === 'custom' && customQrUrl) ? customQrUrl : qrDataUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-indigo-900 via-primary-900 to-slate-900 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-400/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Instant NPCI UPI
            </span>
            <span className="text-white/60 text-xs font-semibold">Zero Fees</span>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">Pay via UPI</h2>
          <p className="text-xs text-indigo-200/80 mt-0.5">
            Paying <strong className="text-white">{payeeName}</strong> for <strong className="text-white">{invoiceNumber}</strong>
          </p>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between">
            <span className="text-xs text-indigo-200 font-medium">Total Amount Due:</span>
            <span className="text-2xl font-black text-emerald-400">
              ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* QR Code & Action Body */}
        <div className="p-6 space-y-5">
          {/* Custom / Dynamic Tab Switcher if user has uploaded a custom QR */}
          {customQrUrl && (
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveQrTab('custom')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeQrTab === 'custom'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Uploaded Merchant QR
              </button>
              <button
                type="button"
                onClick={() => setActiveQrTab('dynamic')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeQrTab === 'dynamic'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Dynamic Amount QR
              </button>
            </div>
          )}

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-indigo-200 shadow-inner group">
              {activeDisplayQr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={activeDisplayQr} 
                  alt="UPI QR Code" 
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-xl">
                  <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Supported App Badges */}
            <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-slate-500">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">GPay</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">PhonePe</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">Paytm</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">BHIM</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">CRED</span>
            </div>
          </div>

          {/* UPI ID Info Pill */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
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

          {/* Mobile Direct Intent Link Button */}
          <a
            href={upiUri}
            className="btn-primary w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Open in UPI App (GPay / PhonePe)
          </a>

          {/* Confirm Payment Button */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="btn-secondary w-full py-2.5 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 flex items-center justify-center gap-1.5"
          >
            <CheckIcon className="h-4 w-4 text-emerald-600" />
            {confirming ? 'Confirming...' : "I've Sent Payment — Mark as Paid"}
          </button>
        </div>
      </div>
    </div>
  )
}
