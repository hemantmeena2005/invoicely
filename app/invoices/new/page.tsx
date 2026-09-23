'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  SparklesIcon, 
  CalculatorIcon, 
  DocumentTextIcon,
  UserPlusIcon,
  ClockIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { REMINDER_OPTIONS, ReminderSchedule } from '@/lib/reminderHelper'

interface Client {
  _id: string
  name: string
  email: string
  company?: string
}

interface InvoiceItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export default function NewInvoicePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 0,
    notes: 'Thank you for your business! Please remit payment within the specified due date.',
    terms: 'Payment is due within 14 days of invoice date. Late payments are subject to a 1.5% monthly fee.',
    reminderSchedule: 'weekly' as ReminderSchedule,
    items: [
      { description: 'Design & Development Services', quantity: 1, rate: 1500, amount: 1500 }
    ] as InvoiceItem[]
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
        if (data.length > 0 && !formData.clientId) {
          setFormData(prev => ({ ...prev, clientId: data[0]._id }))
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one line item is required'
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item${index}Description`] = 'Description is required'
      }
      if (item.rate <= 0) {
        newErrors[`item${index}Rate`] = 'Rate must be greater than 0'
      }
      if (item.quantity <= 0) {
        newErrors[`item${index}Quantity`] = 'Quantity must be greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateItemAmount = (quantity: number, rate: number) => {
    return quantity * rate
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const taxAmount = (subtotal * (formData.taxRate || 0)) / 100
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items]
    const updatedValue = field === 'quantity' || field === 'rate' ? Number(value) : value
    newItems[index] = { ...newItems[index], [field]: updatedValue }
    
    if (field === 'quantity' || field === 'rate') {
      const qty = field === 'quantity' ? Number(value) : newItems[index].quantity
      const rate = field === 'rate' ? Number(value) : newItems[index].rate
      newItems[index].amount = calculateItemAmount(qty, rate)
    }
    
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/invoices')
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Failed to create invoice' })
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while creating the invoice' })
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/invoices"
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 mr-1" />
              Back to Invoices
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Create Invoice</h1>
            <p className="text-slate-500 text-sm mt-0.5">Generate a professional invoice with automatic calculations</p>
          </div>
        </div>

        {errors.submit && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client & Due Date Card */}
            <div className="card p-6 space-y-5">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>1. Invoice Information</span>
                <span className="text-xs font-semibold text-primary-600">Step 1 of 2</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="clientId" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Client *
                    </label>
                    <Link href="/clients/new" className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-0.5">
                      <UserPlusIcon className="h-3 w-3" /> New
                    </Link>
                  </div>
                  <select
                    id="clientId"
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className={`input-field ${errors.clientId ? 'border-rose-400 focus:ring-rose-200' : ''}`}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && <p className="mt-1 text-xs text-rose-600">{errors.clientId}</p>}
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`input-field ${errors.dueDate ? 'border-rose-400 focus:ring-rose-200' : ''}`}
                  />
                  {errors.dueDate && <p className="mt-1 text-xs text-rose-600">{errors.dueDate}</p>}
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">2. Line Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />
                  Add Line Item
                </button>
              </div>

              {errors.items && <p className="text-xs text-rose-600 font-medium">{errors.items}</p>}

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Item #{index + 1}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-6">
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                          Description *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Website Redesign & Development"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className={`input-field text-xs ${errors[`item${index}Description`] ? 'border-rose-400' : ''}`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                          Qty *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="input-field text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                          Rate (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          className={`input-field text-xs ${errors[`item${index}Rate`] ? 'border-rose-400' : ''}`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                          Amount
                        </label>
                        <div className="h-10 px-3 flex items-center justify-end rounded-xl bg-slate-100 font-extrabold text-xs text-slate-800">
                          ₹{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automated Reminder Schedule Card */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BellAlertIcon className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">3. Automated Payment Reminders</h2>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Auto-Stops on Payment
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose how often Invoicely should automatically email friendly payment reminders with UPI payment links & invoice PDFs to your client until paid.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {REMINDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, reminderSchedule: option.value }))}
                      className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        formData.reminderSchedule === option.value
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{option.label}</span>
                        {formData.reminderSchedule === option.value && (
                          <span className="h-2 w-2 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes & Terms Card */}
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                4. Additional Notes & Terms
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Notes to Client
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="input-field text-xs resize-none"
                    placeholder="Thank you for your business..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Payment Terms
                  </label>
                  <textarea
                    rows={3}
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    className="input-field text-xs resize-none"
                    placeholder="Payment is due within 14 days..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Summary (1 col) */}
          <div className="space-y-6">
            <div className="card p-6 space-y-5 sticky top-24">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalculatorIcon className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-bold text-slate-900">Summary</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">
                    ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-600 mb-1">
                    <span className="text-xs font-semibold">Tax Rate (%)</span>
                    <span className="text-xs font-bold text-slate-800">{formData.taxRate}%</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                    className="input-field text-xs"
                    placeholder="Tax %"
                  />
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tax Amount</span>
                    <span className="font-semibold text-slate-800">
                      ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Total Due</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full shadow-glow-primary py-3 text-sm font-bold disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'Generate & Save Invoice'
                  )}
                </button>
                <Link
                  href="/invoices"
                  className="btn-secondary w-full text-xs text-center py-2"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}