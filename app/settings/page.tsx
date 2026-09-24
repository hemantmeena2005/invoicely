'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import {
  QrCodeIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  SparklesIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { buildUpiUri, generateUpiQrDataUrl } from '@/lib/upiHelper'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState('')
  const [upiId, setUpiId] = useState('')
  const [upiName, setUpiName] = useState('')
  const [upiQrCode, setUpiQrCode] = useState<string>('')
  const [businessName, setBusinessName] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')

  // Live Preview State
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  // Bank SMS Webhook State
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [simSms, setSimSms] = useState('Dear SBI User, your A/c ending 1234 has been credited by Rs 5000.00 on 23Sep26 by UPI/426718902345/Client (Ref no 426718902345).')
  const [simLoading, setSimLoading] = useState(false)
  const [simResult, setSimResult] = useState<any>(null)

  const handleCopyWebhookUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://invoicely-gold.vercel.app'
    const url = `${origin}/api/webhooks/upi`
    navigator.clipboard.writeText(url)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2500)
  }

  const handleTestSmsWebhook = async () => {
    try {
      setSimLoading(true)
      setSimResult(null)
      const res = await fetch('/api/webhooks/upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sms: simSms }),
      })
      const data = await res.json()
      setSimResult(data)
    } catch (e: any) {
      setSimResult({ error: e.message || 'Simulation failed' })
    } finally {
      setSimLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Regenerate dynamic QR code preview whenever UPI ID or Name changes
  useEffect(() => {
    if (upiId) {
      generateUpiQrDataUrl({
        upiId: upiId || 'demo@upi',
        payeeName: upiName || name || 'Business Payee',
        amount: 500,
        invoiceNumber: 'INV-DEMO-01',
      }, 260).then((url) => setPreviewQrDataUrl(url))
    }
  }, [upiId, upiName, name])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        const u = data.user
        setName(u.name || session?.user?.name || '')
        setEmail(u.email || session?.user?.email || '')
        setImage(u.image || session?.user?.image || '')
        setUpiId(u.upi_id || '')
        setUpiName(u.upi_name || u.name || session?.user?.name || '')
        setUpiQrCode(u.upi_qr_code || '')
        setBusinessName(u.business_name || '')
        setBusinessPhone(u.business_phone || '')
        setBusinessAddress(u.business_address || '')
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Profile image size should be less than 3MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result)
        setErrorMessage(null)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setImage('')
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUpiQrCode(reader.result)
        setErrorMessage(null)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCustomQr = () => {
    setUpiQrCode('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    setSavedSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          image,
          upi_id: upiId,
          upi_name: upiName,
          upi_qr_code: upiQrCode,
          business_name: businessName,
          business_phone: businessPhone,
          business_address: businessAddress,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update profile settings')
      }

      const resData = await res.json()
      if (resData?.user) {
        setName(resData.user.name || name)
        setUpiId(resData.user.upi_id || upiId)
        setUpiName(resData.user.upi_name || upiName)
        setUpiQrCode(resData.user.upi_qr_code || '')
        setBusinessName(resData.user.business_name || '')
        setBusinessPhone(resData.user.business_phone || '')
        setBusinessAddress(resData.user.business_address || '')
      }

      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while saving')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const popularUpiHandles = ['@oksbi', '@okhdfcbank', '@okicici', '@okaxis', '@paytm', '@ybl', '@ibl', '@axl']

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <QrCodeIcon className="h-8 w-8 text-primary-600 stroke-[2.2]" />
              Payment & Profile Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure your Indian Rupee (₹) UPI payment handles, upload custom QR codes, and customize recipient receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-fade-in shadow-sm">
                <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                Settings Saved!
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="btn-primary py-2.5 px-5 text-sm font-bold shadow-md shadow-primary-500/20 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 stroke-[2.5]" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5 text-rose-500 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Settings Form (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* UPI Payment Configuration Card */}
            <div className="card p-6 sm:p-7 border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-100 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                      <QrCodeIcon className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">UPI Payment Details</h2>
                      <p className="text-xs text-slate-500">NPCI instant payment parameters for client invoices</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                    Zero Gateway Fees
                  </span>
                </div>

                {/* UPI ID Field */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Your UPI ID / VPA <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@oksbi or business@paytm"
                      className="input-field text-sm font-mono font-medium pl-4 pr-10"
                      required
                    />
                  </div>
                  {/* Quick Handle Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick handle:</span>
                    {popularUpiHandles.map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => {
                          const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'username'
                          setUpiId(`${prefix}${handle}`)
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-[11px] font-mono text-slate-600 transition-colors border border-slate-200/60"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPI Payee Display Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Payee Name (Shown on Google Pay / PhonePe)
                  </label>
                  <input
                    type="text"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    placeholder="e.g. John Doe or Acme Corp"
                    className="input-field text-sm"
                  />
                  <p className="text-[11px] text-slate-400">
                    This is the recipient name your client will see in their UPI app when they initiate payment.
                  </p>
                </div>

                {/* Custom QR Code Image Upload Section */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <ArrowUpTrayIcon className="h-4 w-4 text-primary-600" />
                        Custom QR Code Image (Optional)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Upload your custom printed Google Pay, PhonePe, or Paytm standalone QR code
                      </p>
                    </div>
                    {upiQrCode && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomQr}
                        className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors border border-rose-200"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Remove Custom QR
                      </button>
                    )}
                  </div>

                  {upiQrCode ? (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={upiQrCode}
                        alt="Uploaded Custom QR Code"
                        className="w-24 h-24 object-contain rounded-xl border border-white shadow-md bg-white p-1"
                      />
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                          CUSTOM QR ACTIVE
                        </span>
                        <p className="text-xs font-semibold text-slate-800">
                          Custom QR Code successfully uploaded!
                        </p>
                        <p className="text-[11px] text-slate-500">
                          This QR code will be displayed in the payment modal and printed on invoice receipts.
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-bold text-primary-600 hover:underline inline-block mt-1"
                        >
                          Replace with another image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-primary-50/30 transition-all group"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:scale-110 transition-all">
                        <ArrowUpTrayIcon className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-3">
                        Click or drag image to upload custom QR
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, or WEBP up to 2MB (Auto-scaled for invoices)
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Profile & Business Details Card */}
            <div className="card p-6 sm:p-7 border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                  <UserCircleIcon className="h-6 w-6 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Personal & Business Profile</h2>
                  <p className="text-xs text-slate-500">Information displayed on your invoices and email notifications</p>
                </div>
              </div>

              {/* Profile Photo Uploader */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={name || 'Profile Picture'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    {(name || 'User')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Profile Picture / Avatar
                  </h3>
                  <p className="text-xs text-slate-500">
                    JPG, PNG, or WEBP up to 3MB. Displayed on your workspace navigation.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="btn-secondary py-1.5 px-3 text-xs font-semibold text-primary-700 border-primary-200 hover:bg-primary-50"
                    >
                      <ArrowUpTrayIcon className="h-3.5 w-3.5 mr-1" />
                      {image ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {image && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="py-1.5 px-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input-field text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="input-field text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Design Studio"
                    className="input-field text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-field text-sm"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Business Address / Tax Location
                  </label>
                  <textarea
                    rows={2}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Suite 404, Tech Park, Jaipur, Rajasthan 302001, India"
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Automated Bank SMS Forwarder Card */}
            <div className="card p-6 sm:p-7 border-slate-200/90 shadow-sm relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                    <DevicePhoneMobileIcon className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Automated Bank SMS Sync
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                        Zero Fees
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Auto-verify payments when your bank sends an SMS (SBI, HDFC, ICICI, Axis, Kotak, etc.)
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook URL Endpoint Box */}
              <div className="space-y-2 mb-5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Your Bank SMS Webhook URL
                </label>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-white font-mono text-xs">
                  <span className="truncate pr-3 text-indigo-300">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/upi` : 'https://invoicely-gold.vercel.app/api/webhooks/upi'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWebhookUrl}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {copiedWebhook ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-emerald-300" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3-Step Setup Instructions */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-inner space-y-3 mb-5 text-xs text-slate-700">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <BoltIcon className="h-4 w-4 text-amber-500" />
                  Quick 2-Minute Android Setup:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Install a free SMS webhook app like <strong className="text-slate-900">SMS Forwarder</strong> (F-Droid / GitHub) or <strong className="text-slate-900">MacroDroid</strong> from Google Play Store.
                  </li>
                  <li>
                    Set trigger: Incoming SMS from your Bank or containing <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">credited</code> or <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">UPI</code>.
                  </li>
                  <li>
                    Set action: HTTP POST to the Webhook URL above with payload: <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">{`{"sms": "[message]"}`}</code>.
                  </li>
                  <li>
                    Done! Whenever a client pays, Invoicely matches the 12-digit UTR or amount and marks the invoice as <strong>Paid</strong> in real time.
                  </li>
                </ol>
              </div>

              {/* Interactive SMS Simulator */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
                    Test Bank SMS Webhook
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSimSms('Dear SBI User, your A/c ending 1234 has been credited by Rs 5000.00 on 23Sep26 by UPI/426718902345/Client (Ref no 426718902345).')}
                      className="px-2 py-0.5 rounded bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
                    >
                      SBI
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimSms('Rs 5000.00 credited to a/c **1234 on 23-09-26 by UPI txn from sender@okhdfc. UPI Ref 426718902345.')}
                      className="px-2 py-0.5 rounded bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
                    >
                      HDFC
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimSms('Dear Customer, your ICICI Bank Account XX123 has been credited with INR 5,000.00 on 23-Sep-26. UPI:426718902345.')}
                      className="px-2 py-0.5 rounded bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
                    >
                      ICICI
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={simSms}
                  onChange={(e) => setSimSms(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-indigo-200 text-xs text-slate-800 font-mono shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    Tests automatic UTR, amount extraction & invoice matching
                  </span>
                  <button
                    type="button"
                    disabled={simLoading}
                    onClick={handleTestSmsWebhook}
                    className="btn-primary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    {simLoading ? (
                      <>
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Simulate Bank SMS Credit'
                    )}
                  </button>
                </div>

                {simResult && (
                  <div className={`p-3 rounded-xl border text-xs ${simResult.matched ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
                    <p className="font-bold flex items-center gap-1.5">
                      {simResult.matched ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                          {simResult.message}
                        </>
                      ) : (
                        simResult.message || 'Webhook response received'
                      )}
                    </p>
                    {simResult.utr && (
                      <p className="mt-1 font-mono text-[11px] text-slate-600">
                        Extracted UTR: <strong className="text-slate-900">{simResult.utr}</strong> | Bank: {simResult.bank || 'UPI'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Payment QR Preview Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card p-6 sm:p-7 border-slate-200/90 shadow-lg bg-gradient-to-b from-white to-slate-50/50 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Live Client Preview
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {upiQrCode ? 'Custom QR Active' : 'Dynamic NPCI QR'}
                </span>
              </div>

              {/* Preview Modal Simulation */}
              <div className="rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden bg-white">
                {/* Header preview */}
                <div className="p-5 bg-gradient-to-br from-indigo-900 via-primary-900 to-slate-900 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
                      NPCI UPI Instant
                    </span>
                    <span className="text-white/60 text-[10px] font-semibold">Demo Invoice</span>
                  </div>
                  <h4 className="text-base font-extrabold">Pay via UPI</h4>
                  <p className="text-[11px] text-indigo-200/80">
                    Paying <strong className="text-white">{upiName || name || 'Merchant'}</strong>
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-baseline justify-between">
                    <span className="text-[11px] text-indigo-200">Amount:</span>
                    <span className="text-xl font-black text-emerald-400">₹500.00</span>
                  </div>
                </div>

                {/* QR Display */}
                <div className="p-5 flex flex-col items-center justify-center space-y-4">
                  <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-indigo-200 shadow-inner">
                    {upiQrCode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={upiQrCode}
                        alt="Uploaded Custom QR"
                        className="w-44 h-44 object-contain rounded-xl"
                      />
                    ) : previewQrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewQrDataUrl}
                        alt="Dynamic NPCI QR"
                        className="w-44 h-44 rounded-xl"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center bg-slate-50 rounded-xl">
                        <ArrowPathIcon className="h-6 w-6 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* App support badges */}
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100">GPay</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100">PhonePe</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100">Paytm</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100">BHIM</span>
                  </div>

                  {/* UPI VPA Pill */}
                  <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 truncate pr-2">
                      {upiId || 'demo@upi'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(upiId)}
                      className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-100 shadow-sm"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-primary-50 border border-primary-100 text-primary-900 text-xs flex items-start gap-2">
                <SparklesIcon className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Auto-Applied Everywhere:</strong> These settings will automatically power the "Pay via UPI" modal on your invoices and the embedded QR code in downloadable PDFs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
