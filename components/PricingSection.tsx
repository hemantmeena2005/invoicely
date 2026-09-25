'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import {
  CheckIcon,
  SparklesIcon,
  BoltIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  UserIcon,
  ArrowRightIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

interface PricingSectionProps {
  showTitle?: boolean
  className?: string
}

export default function PricingSection({ showTitle = true, className = '' }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      badge: 'Free Forever',
      icon: UserIcon,
      description: 'Ideal for new freelancers and creators getting started with professional billing.',
      priceMonthly: 0,
      priceAnnual: 0,
      period: 'forever',
      popular: false,
      ctaText: 'Start for Free',
      ctaHref: '/auth/signin',
      ctaVariant: 'secondary',
      highlightFeatures: [
        'Up to 5 active invoices / month',
        'Direct 0% commission UPI QR codes',
        'Up to 10 saved client profiles',
        'Instant GST-ready PDF generation',
        'Manual UTR payment review & audit',
        'Standard email invoice delivery',
        'Invoicely watermark on invoices',
      ],
      notIncluded: [
        'Automated Bank SMS webhook sync',
        'Automated scheduled reminders',
        'Custom logo & white-labeling',
        'Team workspace seats',
      ],
    },
    {
      id: 'pro',
      name: 'Professional',
      badge: 'Most Popular',
      icon: BoltIcon,
      description: 'For active freelancers and solo contractors who want full payment automation.',
      priceMonthly: 10,
      priceAnnual: 8, // $8/mo billed annually ($96/yr)
      period: 'per month',
      popular: true,
      ctaText: 'Start 14-Day Free Trial',
      ctaHref: '/auth/signin',
      ctaVariant: 'primary',
      highlightFeatures: [
        'Unlimited invoices & clients',
        'Automated Bank SMS Sync (MacroDroid zero-fee)',
        'Automated Reminders (Daily, Weekly, Due Date)',
        '5-Minute Anti-Fraud UTR timeout protection',
        'Remove Invoicely branding & add custom logo',
        'Custom merchant QR code image upload',
        'Multi-currency billing (USD, INR, EUR, GBP)',
        'Priority Email & Chat support',
      ],
      notIncluded: [
        'Team workspace seats',
        'Custom email sending domain',
      ],
    },
    {
      id: 'agency',
      name: 'Agency Scale',
      badge: 'For Agencies & Teams',
      icon: BuildingOfficeIcon,
      description: 'Built for design studios, dev agencies, and firms managing multiple team members.',
      priceMonthly: 20,
      priceAnnual: 16, // $16/mo billed annually ($192/yr)
      period: 'per month',
      popular: false,
      ctaText: 'Scale Your Agency',
      ctaHref: '/auth/signin',
      ctaVariant: 'secondary',
      highlightFeatures: [
        'Everything in Professional',
        'Up to 5 team member workspace seats',
        'Dedicated Bank SMS Webhook secret key',
        'Custom domain email delivery (from your domain)',
        'Advanced cashflow & tax forecasting analytics',
        'Bulk CSV client & invoice export/import',
        'Comprehensive audit trail & compliance logs',
        '24/7 Dedicated Account Manager & WhatsApp support',
      ],
      notIncluded: [],
    },
  ]

  const featureMatrix = [
    {
      category: 'Invoicing & Clients',
      features: [
        { name: 'Monthly Invoices', free: '5 invoices', pro: 'Unlimited', agency: 'Unlimited' },
        { name: 'Client Profiles', free: '10 clients', pro: 'Unlimited', agency: 'Unlimited' },
        { name: 'GST & Auto-Tax Calculator', free: true, pro: true, agency: true },
        { name: 'Multi-Currency (INR, USD, EUR)', free: false, pro: true, agency: true },
        { name: 'Bulk Invoice Generation & CSV', free: false, pro: false, agency: true },
      ],
    },
    {
      category: 'Payments & Reconciliation',
      features: [
        { name: 'Direct 0% UPI QR Code Generator', free: true, pro: true, agency: true },
        { name: 'Manual UTR Review System', free: true, pro: true, agency: true },
        { name: 'Automated Bank SMS Webhook Sync', free: false, pro: true, agency: true },
        { name: '5-Minute Auto-Timeout Anti-Fraud', free: false, pro: true, agency: true },
        { name: 'Dedicated Webhook Secret Token', free: false, pro: false, agency: true },
      ],
    },
    {
      category: 'Branding & Automation',
      features: [
        { name: 'White-Label (Remove Invoicely logo)', free: false, pro: true, agency: true },
        { name: 'Custom QR Code Upload', free: false, pro: true, agency: true },
        { name: 'Scheduled Reminders (Daily/Weekly)', free: false, pro: true, agency: true },
        { name: 'Custom Domain Email Sending', free: false, pro: false, agency: true },
        { name: 'Team Member Seats', free: '1 user', pro: '1 user', agency: '5 users' },
      ],
    },
  ]

  return (
    <div className={`space-y-16 ${className}`}>
      {/* Header & Toggle */}
      {showTitle && (
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider">
            <SparklesIcon className="h-4 w-4" />
            Simple, Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Invest in Zero-Commission Freedom
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Stop losing 2% to 3% on every client payment. Choose the plan that fits your invoicing volume.
          </p>
        </div>
      )}

      {/* Billing Switcher */}
      <div className="flex justify-center items-center gap-3">
        <span
          onClick={() => setBillingCycle('monthly')}
          className={`text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
            billingCycle === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Monthly Billing
        </span>

        <button
          type="button"
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-slate-700 bg-slate-900 transition-colors duration-200 ease-in-out focus:outline-none"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-primary-500 shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ${
              billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>

        <span
          onClick={() => setBillingCycle('annual')}
          className={`text-xs sm:text-sm font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
            billingCycle === 'annual' ? 'text-white' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span>Annual Billing</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
            Save 20%
          </span>
        </span>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
        {plans.map((plan) => {
          const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly
          const savings = plan.priceMonthly > 0 ? (plan.priceMonthly - plan.priceAnnual) * 12 : 0

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-primary-500 shadow-2xl shadow-primary-500/20 lg:-translate-y-2'
                  : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                  </div>
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      plan.popular
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <plan.icon className="h-6 w-6 stroke-[2]" />
                  </div>
                </div>

                {/* Price Display */}
                <div className="pt-2 pb-4 border-b border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {plan.priceMonthly === 0 ? 'forever' : '/ month'}
                    </span>
                  </div>

                  {plan.priceMonthly > 0 ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        ≈ ₹{billingCycle === 'annual' ? plan.priceAnnual * 84 : plan.priceMonthly * 84} / mo
                      </span>
                      {billingCycle === 'annual' && savings > 0 && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          Save ${savings}/yr
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">No credit card required</p>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    What&apos;s Included:
                  </span>
                  <ul className="space-y-2.5">
                    {plan.highlightFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <CheckIcon className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-500 line-through">
                        <span className="h-4 w-4 text-slate-600 shrink-0 flex items-center justify-center font-bold">✕</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Call to Action Button */}
              <div className="pt-8">
                <Link
                  href={plan.ctaHref}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    plan.popular
                      ? 'btn-primary bg-primary-600 hover:bg-primary-500 text-white shadow-glow-primary'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">30-Day Money-Back Guarantee</h4>
            <p className="text-[11px] text-slate-400">
              Not satisfied with your subscription? Cancel within 30 days for an unconditional 100% refund.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 shrink-0">
          <span>✓ Instant setup</span>
          <span>✓ Cancel anytime</span>
          <span>✓ 0% payment commission</span>
        </div>
      </div>

      {/* Full Feature Comparison Table */}
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-white">Compare Plan Features</h3>
          <p className="text-xs text-slate-400">Detailed side-by-side comparison of every capability</p>
        </div>

        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Features</th>
                  <th className="py-4 px-6 text-center">Starter ($0)</th>
                  <th className="py-4 px-6 text-center text-primary-400">Professional ($10)</th>
                  <th className="py-4 px-6 text-center">Agency ($20)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {featureMatrix.map((section, sIdx) => (
                  <Fragment key={sIdx}>
                    <tr className="bg-slate-950/80">
                      <td colSpan={4} className="py-2.5 px-6 font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                        {section.category}
                      </td>
                    </tr>
                    {section.features.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-6 font-medium text-white">{row.name}</td>
                        <td className="py-3.5 px-6 text-center">
                          {typeof row.free === 'boolean' ? (
                            row.free ? <CheckIcon className="h-4 w-4 text-emerald-400 mx-auto stroke-[2.5]" /> : <span className="text-slate-600">—</span>
                          ) : (
                            <span className="font-semibold text-slate-400">{row.free}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-center bg-primary-950/10">
                          {typeof row.pro === 'boolean' ? (
                            row.pro ? <CheckIcon className="h-4 w-4 text-emerald-400 mx-auto stroke-[2.5]" /> : <span className="text-slate-600">—</span>
                          ) : (
                            <span className="font-bold text-white">{row.pro}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          {typeof row.agency === 'boolean' ? (
                            row.agency ? <CheckIcon className="h-4 w-4 text-emerald-400 mx-auto stroke-[2.5]" /> : <span className="text-slate-600">—</span>
                          ) : (
                            <span className="font-bold text-white">{row.agency}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
