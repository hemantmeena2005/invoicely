'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton'

interface Invoice {
  _id: string
  invoiceNumber: string
  clientId: {
    _id?: string
    name: string
    email: string
    company?: string
  }
  total: number
  status: string
  issueDate: string
  dueDate: string
  emailStatus?: string
  lastEmailedAt?: string
  createdAt: string
}

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvoices()
    }
  }, [status])

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setInvoices(invoices.filter(invoice => invoice._id !== invoiceId))
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    setDownloadingId(invoiceId)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const clientName = invoice.clientId?.name || ''
    const clientEmail = invoice.clientId?.email || ''
    const invNum = invoice.invoiceNumber || ''

    const matchesSearch = 
      invNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Quick counts
  const counts = {
    all: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    overdue: invoices.filter(i => i.status === 'overdue' || (i.status === 'sent' && new Date(i.dueDate) < new Date())).length,
    draft: invoices.filter(i => i.status === 'draft').length,
  }

  if (loading || status === 'loading') {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl" />
            ))}
          </div>
          <TableSkeleton rows={5} columns={6} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Invoices</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage, track, and dispatch your client billings</p>
          </div>
          <Link
            href="/invoices/new"
            className="btn-primary shadow-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Create Invoice
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Invoices', count: counts.all },
            { id: 'paid', label: 'Paid', count: counts.paid },
            { id: 'sent', label: 'Sent / Pending', count: counts.sent },
            { id: 'overdue', label: 'Overdue', count: counts.overdue },
            { id: 'draft', label: 'Drafts', count: counts.draft },
          ].map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <MagnifyingGlassIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by invoice number, client name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Invoices List / Table */}
        <div className="card overflow-hidden">
          {filteredInvoices.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead>
                    <tr>
                      <th className="table-th">Invoice #</th>
                      <th className="table-th">Client</th>
                      <th className="table-th">Issue / Due</th>
                      <th className="table-th">Total Amount</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Email Status</th>
                      <th className="table-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="table-td">
                          <Link
                            href={`/invoices/${invoice._id}`}
                            className="font-bold text-slate-900 hover:text-primary-600 transition-colors"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td className="table-td">
                          <div>
                            <p className="font-semibold text-slate-800">{invoice.clientId?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{invoice.clientId?.email}</p>
                          </div>
                        </td>
                        <td className="table-td text-xs text-slate-500">
                          <div>
                            <span>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</span>
                            <div className="text-slate-400">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="table-td">
                          <span className="font-extrabold text-slate-900 text-base">
                            ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="table-td">
                          <StatusBadge status={invoice.status} pulse={invoice.status === 'sent'} />
                        </td>
                        <td className="table-td">
                          <StatusBadge status={invoice.emailStatus || 'not_sent'} />
                        </td>
                        <td className="table-td text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadPDF(invoice._id)}
                              disabled={downloadingId === invoice._id}
                              title="Download PDF"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                              {downloadingId === invoice._id ? (
                                <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              )}
                            </button>
                            <Link
                              href={`/invoices/${invoice._id}`}
                              title="View Invoice"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/invoices/${invoice._id}/edit`}
                              title="Edit Invoice"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(invoice._id)}
                              title="Delete Invoice"
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/invoices/${invoice._id}`}
                        className="font-bold text-slate-900 hover:text-primary-600"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      <StatusBadge status={invoice.status} />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">{invoice.clientId?.name || 'Unknown'}</span>
                      <span className="font-extrabold text-slate-900 text-base">
                        ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex justify-between">
                      <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      <span>Email: {invoice.emailStatus || 'not_sent'}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      <button
                        onClick={() => handleDownloadPDF(invoice._id)}
                        className="btn-secondary text-xs py-1.5 px-2.5"
                      >
                        <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </button>
                      <Link
                        href={`/invoices/${invoice._id}`}
                        className="btn-secondary text-xs py-1.5 px-2.5"
                      >
                        <EyeIcon className="h-3.5 w-3.5 mr-1" />
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(invoice._id)}
                        className="btn-danger text-xs py-1.5 px-2.5"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center space-y-3">
              <DocumentTextIcon className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Invoices Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Start by creating your first client invoice.'}
              </p>
              <div className="pt-2">
                <Link href="/invoices/new" className="btn-primary text-xs py-2 px-4">
                  <PlusIcon className="h-4 w-4 mr-1 stroke-[2.5]" />
                  Create Invoice
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}