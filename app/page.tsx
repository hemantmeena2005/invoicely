import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  DocumentTextIcon,
  QrCodeIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-primary-600/30 via-indigo-600/20 to-purple-600/0 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/15 to-transparent blur-[140px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-glow-primary">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Invoicely<span className="text-primary-400">.</span>
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/auth/signin"
                className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signin"
                className="btn-primary shadow-glow-primary bg-primary-600 hover:bg-primary-500 border border-primary-400/30"
              >
                Get Started Free
                <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-950/80 border border-primary-800/60 text-primary-300 text-xs font-semibold shadow-inner animate-fade-in">
              <SparklesIcon className="h-4 w-4 text-primary-400 animate-pulse" />
              <span>Next-Gen Invoicing & Payment Automation</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] animate-slide-up">
              Effortless Invoicing.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-indigo-300 to-purple-400">
                Faster Payments.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
              Create and dispatch beautiful PDF invoices in seconds, collect instant bank payments via zero-fee UPI QR codes, and monitor real-time business health with seamless analytics.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signin"
                className="btn-primary w-full sm:w-auto text-base py-3.5 px-8 shadow-glow-primary bg-primary-600 hover:bg-primary-500 rounded-xl"
              >
                Start Creating Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/signin"
                className="btn-secondary w-full sm:w-auto text-base py-3.5 px-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-800"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Feature checklist */}
            <div className="pt-6 flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-xs sm:text-sm font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
                Automated PDF Generator
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
                Direct Email Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
                Instant 0% Fee UPI QR
              </span>
            </div>
          </div>

          {/* Interactive Invoice Card Preview */}
          <div className="mt-16 sm:mt-20 max-w-4xl mx-auto relative animate-slide-up">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-100 transition duration-1000" />
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">INV-2026-0042</h3>
                    <p className="text-xs text-slate-400">Acme Global Corporation • Due in 14 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Paid ₹48,500.00
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 text-sm border-b border-slate-800">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Client</p>
                  <p className="text-slate-200 font-medium">Acme Corp Ltd</p>
                  <p className="text-xs text-slate-400">billing@acmecorp.com</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Issue Date</p>
                  <p className="text-slate-200 font-medium">Sep 22, 2026</p>
                  <p className="text-xs text-slate-400">Net 30 terms</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Amount</p>
                  <p className="text-2xl font-black text-white">₹48,500.00</p>
                  <p className="text-xs text-emerald-400">Via Instant UPI QR</p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Items: UI/UX Architecture, API Microservices</span>
                <span className="text-primary-400 font-semibold">Ready to download & dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary-950 border border-primary-800/60 flex items-center justify-center text-primary-400 shadow-sm">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Instant Dynamic Invoices</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Build professional, branded PDF invoices with customized line items, tax rates, payment terms, and automated invoice numbers.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shadow-sm">
                <QrCodeIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Instant NPCI UPI Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Get paid straight into your bank account. Clients can settle invoices instantly with Google Pay, PhonePe, Paytm, or BHIM with zero gateway fees.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shadow-sm">
                <PaperAirplaneIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Automated Delivery & Tracking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Email invoices directly to your clients with PDF attachments. Track email delivery status and reminder timestamps in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-10 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <DocumentTextIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Invoicely</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Invoicely. All rights reserved. Built for speed and reliability.
          </p>
        </div>
      </footer>
    </div>
  )
}
 