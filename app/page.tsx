'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DocumentTextIcon,
  QrCodeIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
  ClockIcon,
  BellAlertIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  BanknotesIcon,
  BoltIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import InteractiveWalkthroughDemo from '@/components/InteractiveWalkthroughDemo'
import ProductTourModal from '@/components/ProductTourModal'
import PricingSection from '@/components/PricingSection'

export default function HomePage() {
  const [isTourModalOpen, setIsTourModalOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: 'Do I need a business current account or payment gateway approval?',
      a: 'No! You can use your existing personal or current bank account UPI ID (e.g. yourname@oksbi, yourname@okhdfc, or mobile@paytm). Invoicely does not require payment gateway merchant verification, business registration documents, or long approval wait times.',
    },
    {
      q: 'Is it really 0% gateway commission? How does it work?',
      a: 'Yes, 100% zero fees forever. Standard gateways (Razorpay, Stripe, Cashfree) deduct 2% to 3% + GST because they sit between you and your customer. Invoicely generates direct NPCI UPI deep links and QR codes, meaning your client transfers funds directly into your bank account via UPI with zero intermediary commission.',
    },
    {
      q: 'How do I prevent clients from submitting fake payments?',
      a: 'With our native "In-Review" anti-fraud system! When a client completes their UPI transfer, they submit their 12-digit Bank UTR / UPI Ref ID. The invoice status changes to "In Review ⏳". You check your bank notification on your phone and click "[ ✓ Confirm & Mark Paid ]" to unlock their official receipt.',
    },
    {
      q: 'Which UPI apps can my clients use to pay?',
      a: 'Any Indian UPI application! The dynamic QR code conforms to standard NPCI specifications and works seamlessly with Google Pay, PhonePe, Paytm, BHIM, Cred, Amazon Pay, Navi, and all Indian mobile banking apps.',
    },
    {
      q: 'How do the automated reminders work?',
      a: 'You can choose between "Everyday (Daily)", "Every 3 Days", "Once a Week", or "On Due Date". Our automated cloud cron system emails friendly reminder follow-ups with the invoice PDF and direct pay link attached. The exact millisecond the invoice status transitions to Paid, all reminders automatically deactivate.',
    },
  ]

  const reviews = [
    {
      name: 'Vikram Malhotra',
      role: 'Fullstack Engineering Consultant',
      company: 'Self-Employed, Bangalore',
      rating: 5,
      savedAmount: 'Saved ₹38,400 in PG fees',
      comment:
        'Invoicely saved me over ₹38,000 in payment gateway commissions in just three months. Generating invoices with direct amount-locked UPI QR codes is a game changer for independent developers.',
      avatarBg: 'bg-indigo-600',
      initials: 'VM',
    },
    {
      name: 'Aditi Rao',
      role: 'Principal Brand & Product Designer',
      company: 'Studio Pixel, Mumbai',
      rating: 5,
      savedAmount: 'Gets paid 3x faster',
      comment:
        'Clients pay within 24 hours now because the QR code is right on their screen. No clumsy bank account numbers or IFSC codes to copy paste. The PDF generator looks ultra professional.',
      avatarBg: 'bg-emerald-600',
      initials: 'AR',
    },
    {
      name: 'Harsh Vardhan',
      role: 'Founder & Agency Director',
      company: 'Vardhan Digital Agency, Delhi',
      rating: 5,
      savedAmount: 'Zero fake payment issues',
      comment:
        'The In-Review UTR verification gives me 100% peace of mind against fake payment receipts. Plus, the automated reminder emails handle the awkward chasing so my team doesn’t have to.',
      avatarBg: 'bg-purple-600',
      initials: 'HV',
    },
    {
      name: 'Neha Gupta',
      role: 'Content Strategist & Copywriter',
      company: 'Freelance, Jaipur',
      rating: 5,
      savedAmount: 'Overdue dropped by 70%',
      comment:
        'The automated daily reminders do the awkward chasing for me. My clients get a polite email with the PDF attached and pay via GPay in 30 seconds. Overdue invoices dropped by 70%!',
      avatarBg: 'bg-rose-600',
      initials: 'NG',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-primary-600/25 via-indigo-600/15 to-purple-600/0 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/10 via-indigo-500/15 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-[2000px] left-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary-600/15 to-transparent blur-[150px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-30 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl sticky top-0">
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

            {/* Middle Nav Links */}
            <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#walkthrough" className="hover:text-white transition-colors flex items-center gap-1 text-primary-300">
                <SparklesIcon className="h-3.5 w-3.5" />
                Interactive Tour
              </a>
              <a href="#comparison" className="hover:text-white transition-colors">
                0% Fee Comparison
              </a>
              <a href="#pricing" className="hover:text-white transition-colors text-white font-bold">
                Pricing
              </a>
              <a href="#reviews" className="hover:text-white transition-colors">
                User Reviews
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setIsTourModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
              >
                <span>🧭 Quick Tour</span>
              </button>
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
                Create Free Invoice
                <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-950/80 border border-primary-700/60 text-primary-300 text-xs font-bold shadow-inner animate-fade-in">
              <SparklesIcon className="h-4 w-4 text-primary-400 animate-pulse" />
              <span>0% Commission Invoicing & Instant UPI Settlement</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] animate-slide-up">
              Stop Paying 3% Gateway Fees.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-indigo-300 to-emerald-400">
                Get Paid Instantly via Direct UPI.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300/90 max-w-3xl mx-auto font-normal leading-relaxed">
              Create GST-compliant PDF invoices in 30 seconds, collect direct bank transfers with amount-locked UPI QR codes, and automate friendly email reminders until you get paid.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5 justify-center items-center">
              <Link
                href="/auth/signin"
                className="btn-primary w-full sm:w-auto text-sm sm:text-base py-3.5 px-8 shadow-glow-primary bg-primary-600 hover:bg-primary-500 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                Start Creating Free Invoices
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsTourModalOpen(true)}
                className="btn-secondary w-full sm:w-auto text-sm sm:text-base py-3.5 px-7 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <span>🧭 Take Interactive Tour</span>
              </button>
            </div>

            {/* Key Trust Metrics */}
            <div className="pt-6 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-xs sm:text-sm font-bold text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                0% Gateway Deductions Forever
              </span>
              <span className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                Instant IMPS / UPI Bank Credit
              </span>
              <span className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                12-Digit Bank UTR Verification
              </span>
            </div>
          </div>

          {/* Hero Showcase Mockup */}
          <div className="mt-14 sm:mt-18 max-w-5xl mx-auto relative animate-slide-up">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary-600/30 via-emerald-500/20 to-purple-600/30 rounded-3xl blur-2xl opacity-60 pointer-events-none" />
            <div className="relative rounded-3xl overflow-hidden border-2 border-slate-800/90 bg-slate-950 shadow-2xl shadow-primary-900/20 group">
              <Image
                src="/hero-mockup.jpg"
                alt="Invoicely Dashboard & UPI Settlement Mockup"
                width={1600}
                height={900}
                priority
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.01]"
              />

              {/* Floating Overlay Pill 1 */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800/90 text-xs shadow-xl hidden sm:flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-extrabold text-white text-xs">Direct UPI Transfer</p>
                  <p className="text-[11px] text-emerald-400 font-mono">₹1,48,500.00 • 0% Fees Deducted</p>
                </div>
              </div>

              {/* Floating Overlay Pill 2 */}
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800/90 text-xs shadow-xl hidden sm:flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  ⏳
                </div>
                <div>
                  <p className="font-extrabold text-white text-xs">In-Review Verification</p>
                  <p className="text-[11px] text-slate-400 font-mono">Bank UTR: 426718902345</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Walkthrough Showcase Section */}
      <section id="walkthrough" className="relative z-10 py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-extrabold border border-primary-500/30 uppercase tracking-wider">
              Step-by-Step Guidance
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Where to Create What in Invoicely
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Explore our interactive click-through demo below to see where clients are added, how invoices are drafted, and where payments are verified.
            </p>
          </div>

          {/* Interactive Walkthrough Demo Component */}
          <InteractiveWalkthroughDemo />
        </div>
      </section>

      {/* Comparison: Invoicely vs Traditional Gateways */}
      <section id="comparison" className="relative z-10 py-20 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-extrabold border border-emerald-500/30 uppercase tracking-wider">
              Zero Commission Economics
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Invoicely vs Payment Gateways
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Why pay ₹3,000 in payment gateway commissions on every ₹1,00,000 project when direct UPI is completely free?
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300">
                    <th className="py-4 px-6 font-bold">Feature / Metric</th>
                    <th className="py-4 px-6 font-bold text-rose-400">Traditional Gateways (Razorpay/Stripe)</th>
                    <th className="py-4 px-6 font-black text-emerald-400 bg-emerald-950/20 border-l border-emerald-500/30">
                      Invoicely Direct UPI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-200">Transaction Fee</td>
                    <td className="py-4 px-6 text-slate-400">2% to 3% + 18% GST per payment</td>
                    <td className="py-4 px-6 font-black text-emerald-400 bg-emerald-950/20 border-l border-emerald-500/30">
                      ₹0 (0.0% Fee Forever)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-200">Settlement Speed</td>
                    <td className="py-4 px-6 text-slate-400">T+2 or T+3 Days hold period</td>
                    <td className="py-4 px-6 font-black text-emerald-400 bg-emerald-950/20 border-l border-emerald-500/30">
                      Instant (Immediate Bank Transfer)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-200">Bank Account Setup</td>
                    <td className="py-4 px-6 text-slate-400">Requires Merchant KYC & Business Registration</td>
                    <td className="py-4 px-6 font-black text-emerald-400 bg-emerald-950/20 border-l border-emerald-500/30">
                      Any Savings or Current UPI ID
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-200">Fee on ₹1,00,000 Invoice</td>
                    <td className="py-4 px-6 text-rose-400 font-bold">You lose ₹2,360 to ₹3,540</td>
                    <td className="py-4 px-6 font-black text-emerald-400 bg-emerald-950/20 border-l border-emerald-500/30">
                      You keep ₹1,00,300 (₹0 lost)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-200">Follow-up Automation</td>
                    <td className="py-4 px-6 text-slate-400">Manual messaging on WhatsApp</td>
                    <td className="py-4 px-6 font-black text-emerald-400 bg-emerald-950/20 border-l border-emerald-500/30">
                      Automated Cron Reminders (Daily/Weekly)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-slate-200">Fraud Protection</td>
                    <td className="py-4 px-6 text-slate-400">Risk of disputed chargebacks</td>
                    <td className="py-4 px-6 font-black text-emerald-400 bg-emerald-950/20 border-l border-emerald-500/30">
                      In-Review 12-Digit Bank UTR Check
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile UPI Product Showcase */}
      <section className="relative z-10 py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-extrabold border border-indigo-500/30 uppercase tracking-wider">
                Seamless Checkout
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Universal Compatibility with Every Indian UPI App
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Your client opens the invoice link on desktop or mobile. They simply scan the dynamic QR code or tap their favorite UPI application.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold flex-shrink-0">
                    <QrCodeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Exact Amount Locking</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      The QR code automatically pre-fills the exact invoice amount down to the rupee. No client typos.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                    <ShieldCheckIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">GPay, PhonePe, Paytm, BHIM & Cred</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fully compliant with NPCI standards. Works with personal UPI IDs or uploaded merchant QR codes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="relative max-w-md w-full">
                <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-600/30 to-emerald-500/30 rounded-3xl blur-xl opacity-70 pointer-events-none" />
                <div className="relative rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
                  <Image
                    src="/checkout-mockup.jpg"
                    alt="Mobile UPI Checkout Showcase"
                    width={800}
                    height={1000}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Reviews & Testimonials Section */}
      <section id="reviews" className="relative z-10 py-20 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-extrabold border border-amber-500/30 uppercase tracking-wider">
              Trusted by 500+ Freelancers & Studios
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Loved by Independent Creators Across India
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              See how agencies, designers, and software engineers collect 100% of their earnings with zero hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Star rating & savings badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 font-extrabold text-[11px] border border-emerald-800/60">
                      {rev.savedAmount}
                    </span>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-2xl ${rev.avatarBg} text-white font-extrabold flex items-center justify-center text-sm shadow-md`}>
                    {rev.initials}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">{rev.name}</h5>
                    <p className="text-xs text-slate-400">{rev.role} • {rev.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingSection />
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="relative z-10 py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-extrabold border border-primary-500/30 uppercase tracking-wider">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Everything you need to know about zero-fee UPI invoicing and settlement verification.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
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
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center mx-auto shadow-glow-primary text-white">
            <DocumentTextIcon className="h-8 w-8 stroke-[2.2]" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl mx-auto">
            Ready to Collect 100% of Your Earnings?
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Join hundreds of Indian freelancers and agencies keeping every rupee they earn. Setup takes less than 60 seconds.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/signin"
              className="btn-primary w-full sm:w-auto text-base py-3.5 px-8 shadow-glow-primary bg-primary-600 hover:bg-primary-500 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Get Started Free Now
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setIsTourModalOpen(true)}
              className="btn-secondary w-full sm:w-auto text-base py-3.5 px-7 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white cursor-pointer font-bold"
            >
              Take Product Tour
            </button>
          </div>
        </div>
      </section>

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
            <a href="#walkthrough" className="hover:text-white transition-colors">Interactive Tour</a>
            <a href="#comparison" className="hover:text-white transition-colors">0% Comparison</a>
            <Link href="/pricing" className="hover:text-white transition-colors text-primary-400">Pricing</Link>
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Invoicely. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Interactive Product Tour Modal */}
      <ProductTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
      />
    </div>
  )
}