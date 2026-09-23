import React from 'react'

export type InvoiceStatus = 'paid' | 'sent' | 'draft' | 'overdue' | 'delivered' | 'failed' | 'not_sent' | string

interface BadgeProps {
  status: InvoiceStatus
  className?: string
  pulse?: boolean
}

export function StatusBadge({ status, className = '', pulse = false }: BadgeProps) {
  const normalized = status?.toLowerCase() || 'draft'

  let styles = {
    bg: 'bg-slate-100/90 text-slate-700 border-slate-200/80',
    dot: 'bg-slate-400',
    label: status || 'Draft'
  }

  switch (normalized) {
    case 'paid':
      styles = {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500',
        label: 'Paid'
      }
      break
    case 'sent':
      styles = {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        dot: 'bg-indigo-500',
        label: 'Sent'
      }
      break
    case 'overdue':
      styles = {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dot: 'bg-rose-500',
        label: 'Overdue'
      }
      break
    case 'draft':
      styles = {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dot: 'bg-amber-500',
        label: 'Draft'
      }
      break
    case 'under_review':
    case 'in_review':
      styles = {
        bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
        dot: 'bg-amber-500',
        label: 'In Review'
      }
      break
    case 'delivered':
      styles = {
        bg: 'bg-teal-50 text-teal-700 border-teal-200/80',
        dot: 'bg-teal-500',
        label: 'Delivered'
      }
      break
    case 'failed':
      styles = {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dot: 'bg-rose-500',
        label: 'Failed'
      }
      break
    case 'not_sent':
      styles = {
        bg: 'bg-slate-100 text-slate-600 border-slate-200/80',
        dot: 'bg-slate-400',
        label: 'Not Sent'
      }
      break
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${styles.bg} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`} />
      </span>
      {styles.label}
    </span>
  )
}
