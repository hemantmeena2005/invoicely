'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOffice2Icon, 
  MapPinIcon,
  DocumentPlusIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'

interface Client {
  _id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  createdAt: string
}

export default function ClientViewPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    }
  })
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  useEffect(() => {
    fetchClient()
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          address: {
            street: data.address?.street || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            zipCode: data.address?.zipCode || '',
            country: data.address?.country || '',
          }
        })
      } else {
        router.push('/clients')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      router.push('/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        const updated = await response.json()
        setClient(updated)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error updating client:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <Skeleton className="h-6 w-32" />
          <div className="card p-6 space-y-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!client) return null

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/clients"
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 mr-1" />
              Back to Clients
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {client.name}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Client Profile & Contact Details</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/invoices/new?clientId=${client._id}`}
              className="btn-primary text-xs py-2 px-3.5"
            >
              <DocumentPlusIcon className="h-4 w-4 mr-1.5" />
              Create Invoice
            </Link>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary text-xs py-2 px-3.5"
            >
              <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="card p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Edit Client Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs py-2 px-5"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Profile Info (2 cols) */}
            <div className="md:col-span-2 card p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-primary-500/20">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
                  {client.company && (
                    <p className="text-sm font-medium text-slate-600">{client.company}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Member since {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Contact details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <EnvelopeIcon className="h-4 w-4 text-primary-600" />
                      Email Address
                    </div>
                    <p className="font-bold text-slate-800 text-sm break-all">{client.email}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <PhoneIcon className="h-4 w-4 text-primary-600" />
                      Phone Number
                    </div>
                    <p className="font-bold text-slate-800 text-sm">
                      {client.phone || <span className="text-slate-400 font-normal">Not provided</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Billing Address
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-700">
                    {client.address?.street ? (
                      <div className="space-y-0.5 font-medium">
                        <p>{client.address.street}</p>
                        <p>
                          {[client.address.city, client.address.state, client.address.zipCode].filter(Boolean).join(', ')}
                        </p>
                        {client.address.country && <p>{client.address.country}</p>}
                      </div>
                    ) : (
                      <span className="text-slate-400">No address on file</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Shortcut (1 col) */}
            <div className="space-y-6">
              <div className="card p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href={`/invoices/new?clientId=${client._id}`}
                    className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
                  >
                    <DocumentPlusIcon className="h-4 w-4" />
                    New Invoice for {client.name.split(' ')[0]}
                  </Link>
                  <Link
                    href="/invoices"
                    className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center"
                  >
                    View All Invoices
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}