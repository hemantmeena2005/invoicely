'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  DocumentTextIcon, 
  ArrowLeftIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  BoltIcon,
  UserIcon,
  EnvelopeIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

export default function SignIn() {
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)
  const [name, setName] = useState('Hemant Meena')
  const [email, setEmail] = useState('demo@invoicely.app')
  const [upiId, setUpiId] = useState('hemantmeena2005@oksbi')
  const [upiName, setUpiName] = useState('Hemant Meena')
  const [showOptionalUpi, setShowOptionalUpi] = useState(true)

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSigningIn(true)
    try {
      await signIn('demo-login', {
        name,
        email,
        upiId,
        upiName: upiName || name,
        callbackUrl: '/dashboard',
        redirect: true,
      })
    } catch (error) {
      console.error('Sign-in error:', error)
      setSigningIn(false)
    }
  }

  const handleGoogleSignIn = () => {
    setSigningIn(true)
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const popularUpiHandles = ['@oksbi', '@okhdfcbank', '@paytm', '@ybl']

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-primary-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[550px] bg-gradient-to-tr from-primary-600/30 to-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10 animate-slide-up">
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-glow-primary">
            <DocumentTextIcon className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome to Invoicely<span className="text-primary-400">.</span>
          </h2>
          <p className="text-xs text-slate-400">
            Professional invoicing, instant NPCI UPI & automated Brevo emails
          </p>
        </div>

        <div className="card bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Primary Profile Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <UserIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (!upiName || upiName === name) setUpiName(e.target.value)
                    }}
                    placeholder="e.g. Hemant Meena"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@invoicely.app"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional UPI ID Accordion */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3.5 space-y-3">
              <div
                onClick={() => setShowOptionalUpi(!showOptionalUpi)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <QrCodeIcon className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    UPI Payment Handle <span className="text-slate-500 font-normal">(Optional)</span>
                  </span>
                </div>
                {showOptionalUpi ? (
                  <ChevronUpIcon className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
                )}
              </div>

              {showOptionalUpi && (
                <div className="space-y-2.5 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="hemantmeena2005@oksbi"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  {/* Handle Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Quick handle:</span>
                    {popularUpiHandles.map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => {
                          const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'username'
                          setUpiId(`${prefix}${handle}`)
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Payee Display Name
                    </label>
                    <input
                      type="text"
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                      placeholder="e.g. Hemant Meena"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white text-sm font-bold shadow-glow-primary active:scale-[0.98] transition-all duration-200 disabled:opacity-60 cursor-pointer"
            >
              {signingIn ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <BoltIcon className="h-5 w-5 text-amber-300" />
              )}
              {signingIn ? 'Starting Workspace...' : 'Enter Workspace & Dashboard'}
            </button>
          </form>

          {/* Google Sign-in Alternative */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google Account
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 mr-1" />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}