'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentPlusIcon,
  XMarkIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton'

interface Client {
  _id: string
  name: string
  email: string
  company?: string
  phone?: string
  createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? Invoices associated with this client may be affected.')) return

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setClients(clients.filter(client => client._id !== clientId))
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
          <TableSkeleton rows={5} columns={4} />
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Clients</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage contacts, companies, and billing accounts</p>
          </div>
          <Link
            href="/clients/new"
            className="btn-primary shadow-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Add Client
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <MagnifyingGlassIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name, email, or company..."
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

        {/* Clients Table / Cards */}
        <div className="card overflow-hidden">
          {filteredClients.length > 0 ? (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead>
                    <tr>
                      <th className="table-th">Client</th>
                      <th className="table-th">Company</th>
                      <th className="table-th">Contact Info</th>
                      <th className="table-th">Member Since</th>
                      <th className="table-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((client) => (
                      <tr key={client._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="table-td">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 font-bold text-sm text-white flex items-center justify-center shadow-sm flex-shrink-0">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/clients/${client._id}`}
                                className="font-bold text-slate-900 hover:text-primary-600 transition-colors"
                              >
                                {client.name}
                              </Link>
                              <p className="text-xs text-slate-400">{client.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-td">
                          {client.company ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                              <BuildingOffice2Icon className="h-3.5 w-3.5 text-slate-400" />
                              {client.company}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="table-td text-xs text-slate-600">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400" />
                              <span>{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-td text-xs text-slate-500">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </td>
                        <td className="table-td text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/invoices/new?clientId=${client._id}`}
                              title="Create Invoice for Client"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                            >
                              <DocumentPlusIcon className="h-3.5 w-3.5" />
                              Invoice
                            </Link>
                            <Link
                              href={`/clients/${client._id}`}
                              title="View & Edit"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(client._id)}
                              title="Delete Client"
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

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <div key={client._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-primary-600 font-bold text-xs text-white flex items-center justify-center">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/clients/${client._id}`} className="font-bold text-slate-900 hover:text-primary-600">
                            {client.name}
                          </Link>
                          {client.company && <p className="text-xs text-slate-400">{client.company}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p>{client.email}</p>
                      {client.phone && <p>{client.phone}</p>}
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      <Link
                        href={`/invoices/new?clientId=${client._id}`}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <DocumentPlusIcon className="h-3.5 w-3.5 mr-1" />
                        Invoice
                      </Link>
                      <Link
                        href={`/clients/${client._id}`}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <PencilIcon className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(client._id)}
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
              <UserGroupIcon className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Clients Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? 'No clients match your search filter.'
                  : 'Add your clients to start sending invoices and tracking revenue.'}
              </p>
              <div className="pt-2">
                <Link href="/clients/new" className="btn-primary text-xs py-2 px-4">
                  <PlusIcon className="h-4 w-4 mr-1 stroke-[2.5]" />
                  Add First Client
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}