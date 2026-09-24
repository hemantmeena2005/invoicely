'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  UserGroupIcon,
  DocumentPlusIcon,
  QrCodeIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  SparklesIcon,
  ClockIcon,
  PaperAirplaneIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline'

interface TourStep {
  id: number
  title: string
  subtitle: string
  badge: string
  icon: any
  description: string
  actionUrl: string
  popupHeading: string
  popupBody: string
  previewType: 'clients' | 'create_invoice' | 'upi_checkout' | 'reminders' | 'in_review'
}

export default function InteractiveWalkthroughDemo() {
  const [activeStep, setActiveStep] = useState(0)

  const steps: TourStep[] = [
    {
      id: 1,
      title: 'Add Client Profile',
      subtitle: 'Where to store client billing details',
      badge: 'Step 1 of 5',
      icon: UserGroupIcon,
      description: 'Store client company details, tax GSTINs, and emails once. They autofill on every new invoice in 1 click.',
      actionUrl: '/clients/new',
      popupHeading: 'Where to create clients:',
      popupBody: 'Navigate to "Clients" in the sidebar and click "+ Add New Client". Once added, their name, company, and email are saved forever.',
      previewType: 'clients',
    },
    {
      id: 2,
      title: 'Build Invoice & Auto-Tax',
      subtitle: 'Where to add line items & terms',
      badge: 'Step 2 of 5',
      icon: DocumentPlusIcon,
      description: 'Select your client, enter billable items or hourly rates, and watch subtotal, GST, and total calculate instantly.',
      actionUrl: '/invoices/new',
      popupHeading: 'Where to create invoices:',
      popupBody: 'Click "+ Create Invoice" from the top bar or Invoices page. Add descriptions, rates, and due dates. A branded PDF is compiled in real time.',
      previewType: 'create_invoice',
    },
    {
      id: 3,
      title: 'Direct 0% UPI QR Checkout',
      subtitle: 'How clients pay directly to your bank',
      badge: 'Step 3 of 5',
      icon: QrCodeIcon,
      description: 'Clients receive a secure checkout link with an amount-locked UPI QR code compatible with GPay, PhonePe, Paytm, and BHIM.',
      actionUrl: '/settings',
      popupHeading: 'Where to configure your UPI:',
      popupBody: 'Enter your VPA (e.g. yourname@oksbi) in "Settings & UPI". Invoicely locks the exact invoice amount into the QR code with 0% gateway commission.',
      previewType: 'upi_checkout',
    },
    {
      id: 4,
      title: 'Automated Reminders',
      subtitle: 'Set daily or weekly cron follow-ups',
      badge: 'Step 4 of 5',
      icon: BellAlertIcon,
      description: 'Stop chasing overdue payments. Invoicely emails friendly reminder follow-ups on your chosen schedule until paid.',
      actionUrl: '/invoices',
      popupHeading: 'Where to schedule reminders:',
      popupBody: 'On any invoice page, pick your schedule: "Everyday (Daily)", "Every 3 Days", or "Once a Week". Reminders auto-stop the second payment is made.',
      previewType: 'reminders',
    },
    {
      id: 5,
      title: 'In-Review UTR Approval',
      subtitle: 'Where to verify credit and approve',
      badge: 'Step 5 of 5',
      icon: ShieldCheckIcon,
      description: 'When clients pay, they submit their 12-digit Bank UTR. You verify credit on your phone and approve with 1 single click.',
      actionUrl: '/invoices',
      popupHeading: 'Where to review payments:',
      popupBody: 'Invoices with submitted payments show an amber "In Review ⏳" banner. Click "[ ✓ Confirm & Mark Paid ]" to unlock the official paid receipt!',
      previewType: 'in_review',
    },
  ]

  const current = steps[activeStep]

  return (
    <div className="relative rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Walkthrough Navigation Header */}
      <div className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 font-extrabold text-[11px] border border-primary-500/30 uppercase tracking-wider">
              Interactive Tour
            </span>
            <span className="text-xs font-semibold text-slate-400">Click steps to test drive</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1">
            Where to Create What in Invoicely
          </h3>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isCurrent = idx === activeStep
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-glow-primary'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{s.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Interactive Explanation & Floating Tooltip (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-primary-400 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-primary-400 animate-ping" />
              {current.badge}
            </div>
            <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {current.title}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Floating Target Popup Callout */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500/50 shadow-xl space-y-3 animate-fade-in">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md">
              💡 Interactive Guide Popup
            </div>
            <h5 className="font-extrabold text-sm text-indigo-200 pt-1">
              {current.popupHeading}
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {current.popupBody}
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-indigo-900/60 text-xs">
              <span className="text-indigo-400 font-medium">Quick Navigation Tip</span>
              <Link
                href="/auth/signin"
                className="text-white hover:text-primary-300 font-bold flex items-center gap-1 transition-colors"
              >
                Try in Live App
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className="btn-secondary text-xs py-2 px-3.5 bg-slate-900 border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Previous
            </button>

            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === activeStep ? 'w-6 bg-primary-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="btn-primary text-xs py-2 px-4 bg-primary-600 hover:bg-primary-500 text-white flex items-center gap-1.5 font-bold shadow-md shadow-primary-600/30"
              >
                Next Step
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="btn-primary text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 font-bold shadow-md shadow-emerald-600/30"
              >
                Get Started Free
                <CheckCircleIcon className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: Live UI Preview Mockup (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 sm:p-6 shadow-inner space-y-4">
            {/* Mockup Browser/App Window Chrome */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] font-mono text-slate-500 ml-2">invoicely.app{current.previewType === 'clients' ? '/clients' : current.previewType === 'create_invoice' ? '/invoices/new' : current.previewType === 'upi_checkout' ? '/pay/demo-01' : '/invoices/INV-2026-0042'}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Interactive Preview
              </span>
            </div>

            {/* Dynamic Step Previews */}
            {current.previewType === 'clients' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-sm">Clients Directory</h5>
                  <span className="px-2.5 py-1 rounded-lg bg-primary-600/20 text-primary-300 font-bold border border-primary-500/30">
                    + Add New Client
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="font-bold text-white">Acme Corp International</p>
                    <p className="text-slate-400">billing@acmecorp.com</p>
                    <p className="text-[11px] text-slate-500">GST: 27AABCT3518Q1ZV</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-primary-500/50 relative shadow-sm">
                    <div className="absolute -top-2 right-2 px-1.5 py-0.5 rounded bg-primary-600 text-white text-[9px] font-bold">
                      Selected
                    </div>
                    <p className="font-bold text-white">Starlight Studio</p>
                    <p className="text-slate-400">payments@starlight.design</p>
                    <p className="text-[11px] text-slate-500">Bangalore, Karnataka</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-slate-400 text-center">
                  💡 Clients are reusable across unlimited invoices. No re-typing required.
                </div>
              </div>
            )}

            {current.previewType === 'create_invoice' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-sm">New Invoice Builder</h5>
                  <span className="text-emerald-400 font-mono font-bold">INV-2026-0042</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-400 font-bold border-b border-slate-800 pb-1.5">
                    <span>Service Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>Fullstack Web Architecture (40 hrs)</span>
                    <span className="font-mono">₹60,000.00</span>
                  </div>
                  <div className="flex justify-between text-slate-200">
                    <span>UI/UX Interface Design & Design Tokens</span>
                    <span className="font-mono">₹25,000.00</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1 text-right">
                    <p className="text-slate-400">Subtotal: <span className="font-mono text-slate-200">₹85,000.00</span></p>
                    <p className="text-slate-400">GST (18%): <span className="font-mono text-slate-200">₹15,300.00</span></p>
                    <p className="text-sm font-black text-emerald-400">Total: ₹1,00,300.00</p>
                  </div>
                </div>
              </div>
            )}

            {current.previewType === 'upi_checkout' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-sm">Hosted UPI Checkout Screen</h5>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                    0% Gateway Fee
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-28 w-28 rounded-xl bg-white p-2 flex items-center justify-center flex-shrink-0 shadow-md">
                    <QrCodeIcon className="h-full w-full text-slate-900" />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Scan via Any UPI App</span>
                    <p className="text-base font-black text-white">Amount: ₹1,00,300.00</p>
                    <p className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate">
                      VPA: yourname@oksbi
                    </p>
                    <div className="flex gap-1.5 pt-1 justify-center sm:justify-start">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">GPay</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">PhonePe</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">Paytm</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">BHIM</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {current.previewType === 'reminders' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-sm">Automated Reminders Schedule</h5>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                    Cron Active
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-semibold">Reminder Frequency:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px]">
                      Everyday (Daily)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Next Automated Dispatch:</span>
                    <span className="font-bold text-slate-200">Tomorrow, 09:00 AM UTC</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Total Sent So Far:</span>
                    <span className="font-bold text-emerald-400">2 Reminders</span>
                  </div>
                  <p className="text-[10px] text-emerald-400/90 pt-1 border-t border-slate-800">
                    ✓ Stops automatically the exact millisecond the invoice status transitions to Paid.
                  </p>
                </div>
              </div>
            )}

            {current.previewType === 'in_review' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-sm">In-Review Verification Screen</h5>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/30 uppercase">
                    In Review ⏳
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-amber-950/40 border-2 border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-200">Client Submitted Payment UTR:</span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-900 text-white font-bold rounded border border-amber-400/40">
                      426718902345
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Client Suyash transferred ₹1,00,300.00. Check your bank SMS notification or UPI app history.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Confirm & Mark Paid
                    </button>
                    <button
                      type="button"
                      className="py-1.5 px-3 rounded-lg bg-slate-900 text-rose-400 border border-rose-500/30 text-xs font-bold"
                    >
                      Reject UTR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
