export type ReminderSchedule = 'off' | 'daily' | 'every_3_days' | 'weekly' | 'on_due_date'

export interface ReminderConfig {
  schedule: ReminderSchedule
  nextReminderAt: string | null
  reminderCount: number
  lastEmailedAt?: string | null
}

/**
 * Calculates the next reminder ISO timestamp based on the schedule, due date, and base date
 */
export function computeNextReminderDate(
  schedule: ReminderSchedule,
  dueDate: string | Date,
  baseDate: Date = new Date()
): string | null {
  if (schedule === 'off') {
    return null
  }

  const now = new Date(baseDate)
  const targetDue = new Date(dueDate)

  if (schedule === 'daily') {
    // 24 hours from now
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    return next.toISOString()
  }

  if (schedule === 'every_3_days') {
    // 3 days from now
    const next = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    return next.toISOString()
  }

  if (schedule === 'weekly') {
    // 7 days from now
    const next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return next.toISOString()
  }

  if (schedule === 'on_due_date') {
    // If due date is in the future, set to due date at 09:00 AM
    if (targetDue.getTime() > now.getTime()) {
      const dueMorning = new Date(targetDue)
      dueMorning.setHours(9, 0, 0, 0)
      return dueMorning.toISOString()
    } else {
      // If already past due date, send 3 days after now
      const overdueNext = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      return overdueNext.toISOString()
    }
  }

  return null
}

/**
 * Human-friendly labels and descriptions for schedule options
 */
export const REMINDER_OPTIONS: Array<{
  value: ReminderSchedule
  label: string
  description: string
  badgeColor: string
}> = [
  {
    value: 'off',
    label: 'Manual (Off)',
    description: 'No automated reminders. Send manually when needed.',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    value: 'daily',
    label: 'Everyday (Daily)',
    description: 'Sends an email reminder every 24 hours until paid.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    value: 'every_3_days',
    label: 'Every 3 Days',
    description: 'Sends an email reminder every 3 days until paid.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    value: 'weekly',
    label: 'Once a Week (Weekly)',
    description: 'Sends an email reminder every 7 days until paid.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    value: 'on_due_date',
    label: 'On Due Date',
    description: 'Sends reminder on the due date and follow-up if overdue.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
]

export function getScheduleBadge(schedule?: string) {
  const opt = REMINDER_OPTIONS.find(o => o.value === schedule) || REMINDER_OPTIONS[0]
  return opt
}

/**
 * Extracts reminder configuration from direct columns or fallback storage in terms/email_logs
 */
export function extractReminderConfig(
  reminderScheduleCol?: string | null,
  nextReminderAtCol?: string | null,
  reminderCountCol?: number | null,
  terms?: string | null,
  emailLogs?: any
): { schedule: ReminderSchedule; nextReminderAt: string | null; reminderCount: number } {
  // 1. If column has an explicit value and is not 'off', use it
  if (reminderScheduleCol && reminderScheduleCol !== 'off') {
    return {
      schedule: reminderScheduleCol as ReminderSchedule,
      nextReminderAt: nextReminderAtCol || null,
      reminderCount: Number(reminderCountCol || 0),
    }
  }

  // 2. Check terms string for embedded tag: [REMINDER:schedule=daily|next=...|count=0]
  if (terms && typeof terms === 'string') {
    const match = terms.match(/\[REMINDER:schedule=([a-z_]+)(?:\|next=([^|\]]*))?(?:\|count=(\d+))?\]/i)
    if (match) {
      const schedule = match[1] as ReminderSchedule
      const nextReminderAt = match[2] && match[2] !== 'null' ? match[2] : null
      const reminderCount = match[3] ? parseInt(match[3], 10) : 0
      return { schedule, nextReminderAt, reminderCount }
    }
  }

  // 3. Check email_logs for config object
  if (Array.isArray(emailLogs)) {
    const configLog = emailLogs.find((l: any) => l && l._isReminderConfig)
    if (configLog && configLog.schedule) {
      return {
        schedule: configLog.schedule as ReminderSchedule,
        nextReminderAt: configLog.nextReminderAt || null,
        reminderCount: Number(configLog.reminderCount || 0),
      }
    }
  }

  // 4. Fallback default
  return {
    schedule: (reminderScheduleCol as ReminderSchedule) || 'off',
    nextReminderAt: nextReminderAtCol || null,
    reminderCount: Number(reminderCountCol || 0),
  }
}

/**
 * Embeds reminder config into terms without destroying existing terms
 */
export function embedReminderToTerms(
  terms: string | undefined | null,
  schedule: ReminderSchedule,
  nextReminderAt: string | null,
  reminderCount: number = 0
): string {
  const baseTerms = (terms || '').replace(/\[REMINDER:[^\]]+\]/gi, '').trim()
  if (schedule === 'off') {
    return baseTerms
  }
  const tag = `[REMINDER:schedule=${schedule}|next=${nextReminderAt || 'null'}|count=${reminderCount}]`
  return baseTerms ? `${baseTerms}\n${tag}` : tag
}

/**
 * Strips internal metadata tags for clean user-facing display on PDF and UI
 */
export function cleanDisplayTerms(terms?: string | null): string {
  if (!terms) return ''
  return terms
    .replace(/\[REMINDER:[^\]]+\]/gi, '')
    .replace(/\[UPI Settlement UTR:[^\]]+\]/gi, '')
    .trim()
}
