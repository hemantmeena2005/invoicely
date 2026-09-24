'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  DocumentPlusIcon,
  QrCodeIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'

interface TourModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProductTourModal({ isOpen, onClose }: TourModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrentStep((prev) => Math.min(tourSteps.length - 1, prev + 1))
      if (e.key === 'ArrowLeft') setCurrentStep((prev) => Math.max(0, prev - 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const tourSteps = [
    {
      title: 'Welcome to Invoicely!',
      subtitle: 'Your 0% Fee Invoicing & UPI Settlement Hub',
      icon: SparklesIcon,
      accentColor: 'from-primary-600 to-indigo-600',
      badge: 'Getting Started',
      content:
        'Invoicely is designed to help freelancers, consultants, and agencies create professional invoices, collect instant bank settlements with 0% gateway commission, and automate overdue follow-ups.',
      whereToFind: 'Dashboard Overview (/dashboard)',
      actionText: 'Next: Managing Clients',
      directLink: '/dashboard',
      tip: 'Tip: You never pay payment gateway transaction fees again. Every rupee goes straight into your bank account.',
    },
    {
      title: '1. Store Clients in Directory',
      subtitle: 'Where to add your clients',
      icon: UserGroupIcon,
      accentColor: 'from-blue-600 to-cyan-600',
      badge: 'Step 1 of 5',
      content:
        'Add your client companies, billing contacts, GST numbers, and emails once in the Clients directory. When creating an invoice, simply choose their name and all billing fields autofill instantly.',
      whereToFind: 'Click "Clients" in the left sidebar → "+ Add Client"',
      actionText: 'Next: Creating Invoices',
      directLink: '/clients',
      tip: 'Tip: You can edit client details anytime, and all past invoices stay neatly linked.',
    },
    {
      title: '2. Create Itemized Invoices',
      subtitle: 'Where to build invoices & calculate taxes',
      icon: DocumentPlusIcon,
      accentColor: 'from-indigo-600 to-purple-600',
      badge: 'Step 2 of 5',
      content:
        'Click "+ Create Invoice". Add line items with hourly rates or fixed milestones. Invoicely automatically calculates subtotals, tax rates (e.g. 18% GST), and compiles an official branded PDF in seconds.',
      whereToFind: 'Click "+ Create Invoice" button in the top navigation or sidebar',
      actionText: 'Next: UPI Payments',
      directLink: '/invoices/new',
      tip: 'Tip: You can customize payment terms (e.g. Net 14 days) and personal notes directly in the editor.',
    },
    {
      title: '3. Set Up Your UPI ID (0% Fees)',
      subtitle: 'Where to configure your bank payment address',
      icon: QrCodeIcon,
      accentColor: 'from-emerald-600 to-teal-600',
      badge: 'Step 3 of 5',
      content:
        'Navigate to Settings & enter your Virtual Payment Address (e.g. yourname@oksbi) or upload your custom QR code. Invoicely generates an amount-locked QR code for your clients with zero gateway deductions.',
      whereToFind: 'Click "Settings & UPI" in the left sidebar or user profile avatar',
      actionText: 'Next: Automated Reminders',
      directLink: '/settings',
      tip: 'Tip: Universal support for Google Pay, PhonePe, Paytm, BHIM, Cred, and Navi.',
    },
    {
      title: '4. Automated Reminder Follow-ups',
      subtitle: 'Where to schedule automated reminder emails',
      icon: BellAlertIcon,
      accentColor: 'from-amber-600 to-orange-600',
      badge: 'Step 4 of 5',
      content:
        'Never feel awkward chasing clients again. On any invoice view, select "Everyday (Daily)", "Every 3 Days", or "Once a Week". Automated cron jobs email your client with the invoice PDF and UPI link until paid.',
      whereToFind: 'On any invoice page (/invoices/[id]) → "Scheduled Reminders" sidebar card',
      actionText: 'Next: Reviewing Payments',
      directLink: '/invoices',
      tip: 'Tip: Reminders automatically shut off the moment the invoice is marked as Paid!',
    },
    {
      title: '5. "In Review" Payment Approval',
      subtitle: 'Where to verify the 12-digit Bank UTR',
      icon: ShieldCheckIcon,
      accentColor: 'from-rose-600 to-pink-600',
      badge: 'Step 5 of 5',
      content:
        'When your client pays via UPI, they enter the 12-digit Bank UTR / UPI Ref ID. The invoice status updates to "In Review ⏳". Cross-check your bank notification on your phone and approve with 1 click!',
      whereToFind: 'Invoices list (/invoices) → "In Review ⏳" filter tab',
      actionText: 'Finish Tour',
      directLink: '/invoices',
      tip: 'Tip: You can reject invalid or fake UTRs with 1 tap, keeping your books 100% accurate.',
    },
  ]

  const step = tourSteps[currentStep]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden animate-slide-up text-slate-100">
        {/* Glow accent */}
        <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${step.accentColor}`} />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${step.accentColor} flex items-center justify-center shadow-lg text-white`}>
              <Icon className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-extrabold text-[10px] uppercase tracking-wider border border-slate-700">
                {step.badge}
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Tour"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {step.content}
          </p>

          {/* Where to click callout card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-primary-400 block tracking-wider">
              📍 Where to find / create this:
            </span>
            <p className="font-bold text-slate-100">
              {step.whereToFind}
            </p>
          </div>

          {/* Pro tip card */}
          <div className="p-3.5 rounded-xl bg-primary-950/40 border border-primary-800/40 text-xs text-primary-200 flex items-start gap-2">
            <SparklesIcon className="h-4 w-4 text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {step.tip}
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 sm:p-6 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep ? 'w-6 bg-primary-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="btn-secondary py-2 px-3 text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              >
                Back
              </button>
            )}

            {currentStep < tourSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(tourSteps.length - 1, prev + 1))}
                className="btn-primary py-2 px-4 text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white flex items-center gap-1.5 shadow-md shadow-primary-600/30"
              >
                Next
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn-primary py-2 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                Got It! Finish Tour
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
