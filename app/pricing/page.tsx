'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DocumentTextIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  StarIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import PricingSection from '@/components/PricingSection'

export default function PricingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const pricingFaqs = [
    {
      q: 'Does the Free plan expire after a trial period?',
      a: 'No. The Starter plan ($0) is free forever. You get up to 5 invoices per month, direct 0% commission UPI QR codes, up to 10 clients, and instant GST PDF downloads. You only upgrade if you need more volume, team seats, or automated Bank SMS sync.',
    },
    {
      q: 'How does the 14-day free trial on Professional work?',
      a: 'When you choose the Professional ($10/mo) plan, you get 14 days of full unrestricted access to automated Bank SMS sync, custom branding, and automated client reminders. No credit card is required to begin testing.',
    },
    {
      q: 'What is the 30-Day Money-Back Guarantee?',
      a: 'If you subscribe to either our Professional ($10) or Agency Scale ($20) plans and find that Invoicely doesn’t save you time and money, simply reach out to support within 30 days for a full, 100% unconditional refund.',
    },
    {
      q: 'Can I switch between monthly and annual billing later?',
      a: 'Yes! You can switch from monthly to annual billing at any time from your account settings to lock in the 20% discount ($8/mo for Pro, $16/mo for Agency).',
    },
    {
      q: 'How does Invoicely charge zero transaction fees on UPI?',
      a: 'Payment gateways like Razorpay, Stripe, or Cashfree charge 2% to 3% because funds pass through their accounts. Invoicely generates direct NPCI-compliant UPI payment intents and QR codes directly tied to your VPA. The funds go directly from your client’s bank into your bank account with zero middleman deductions.',
    },
    {
      q: 'What payment methods do you accept for Invoicely subscriptions?',
      a: 'We accept all major credit cards, debit cards, net banking, and UPI for our recurring SaaS subscriptions. Billed in USD with local currency conversion displayed transparently.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-tr from-primary-600/20 via-indigo-600/15 to-purple-600/0 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/10 via-indigo-500/15 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-[1800px] left-0 w-[700px] h-[700px] bg-gradient-to-tr from-primary-600/15 to-transparent blur-[170px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-30 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-glow-primary group-hover:scale-105 transition-transform">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Invoicely<span className="text-primary-400">.</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
              <Link href="/#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/#walkthrough" className="hover:text-white transition-colors">
                Interactive Tour
              </Link>
              <Link href="/#comparison" className="hover:text-white transition-colors">
                0% Fee Comparison
              </Link>
              <Link href="/pricing" className="text-primary-400 font-bold">
                Pricing
              </Link>
              <Link href="/#faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/auth/signin"
                className="text-slate-300 hover:text-white px-3 py-2 text-xs sm:text-sm font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signin"
                className="btn-primary shadow-glow-primary bg-primary-600 hover:bg-primary-500 border border-primary-400/30 text-xs sm:text-sm py-2.5 px-4 sm:px-5"
              >
                Start for Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-24">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Pricing Section with Switcher and Cards */}
        <PricingSection showTitle={true} />

        {/* Social Proof Strip */}
        <section className="mt-24 pt-12 border-t border-slate-800/80">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="h-5 w-5 fill-amber-400 stroke-amber-400" />
              ))}
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">
              &ldquo;Switching to Invoicely saved our studio over $450 every month in gateway cuts.&rdquo;
            </p>
            <p className="text-xs text-slate-400">
              — Aditi Rao, Founder at Studio Pixel Mumbai (Agency Plan User)
            </p>
          </div>
        </section>

        {/* Pricing FAQs */}
        <section className="mt-24 max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-extrabold border border-primary-500/30 uppercase tracking-wider">
              <QuestionMarkCircleIcon className="h-4 w-4" />
              Billing Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Clear answers regarding our Free, $10, and $20 subscription tiers.
            </p>
          </div>

          <div className="space-y-3">
            {pricingFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40"
                  >
                    <span className="font-bold text-white text-sm sm:text-base">{faq.q}</span>
                    <span className="p-1 rounded-lg bg-slate-800 text-slate-400 flex-shrink-0">
                      {isOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="mt-24 rounded-3xl p-8 sm:p-14 bg-gradient-to-br from-primary-950/40 via-slate-900 to-indigo-950/40 border border-primary-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to automate your client billing?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Start with our free forever plan or claim your 14-day free trial on Professional. No credit card required.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/auth/signin"
                className="btn-primary w-full sm:w-auto text-xs sm:text-sm py-3.5 px-8 shadow-glow-primary bg-primary-600 hover:bg-primary-500 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span>Get Started in 60 Seconds</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/#walkthrough"
                className="w-full sm:w-auto text-xs sm:text-sm py-3.5 px-6 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold"
              >
                View Live Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold">
              <DocumentTextIcon className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white">Invoicely</span>
              <p className="text-[11px] text-slate-400">Zero-Fee UPI Invoicing for India</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/#walkthrough" className="hover:text-white transition-colors">Tour</Link>
            <Link href="/pricing" className="text-primary-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Invoicely. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
