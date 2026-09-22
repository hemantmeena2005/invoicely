'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  PlusIcon,
  Cog6ToothIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
  { name: 'Clients', href: '/clients', icon: UserGroupIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
  { name: 'Settings & UPI', href: '/settings', icon: Cog6ToothIcon },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Loading state placeholder if session is still pending
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center animate-pulse">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading session...</p>
        </div>
      </div>
    )
  }

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile sidebar backdrop & drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl border-r border-slate-200/80 animate-slide-up">
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-md shadow-primary-500/20">
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Invoicely<span className="text-primary-600">.</span>
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <Link
                href="/invoices/new"
                onClick={() => setSidebarOpen(false)}
                className="btn-primary w-full shadow-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1.5 stroke-[2.5]" />
                Create Invoice
              </Link>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Link
                href="/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-100/80 transition-colors group cursor-pointer"
                title="Manage Profile & UPI Settings"
              >
                {session?.user?.image ? (
                  <img
                    className="h-10 w-10 rounded-xl border border-slate-200 object-cover group-hover:ring-2 group-hover:ring-primary-500/30 transition-all"
                    src={session.user.image}
                    alt={session.user.name || ''}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    {userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 truncate transition-colors">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                </div>
                <Cog6ToothIcon className="h-4 w-4 text-slate-400 group-hover:text-primary-600 group-hover:rotate-45 transition-all" />
              </Link>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Link
                  href="/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm"
                >
                  <Cog6ToothIcon className="h-3.5 w-3.5 text-slate-500" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100"
                >
                  <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <div className="flex flex-col flex-grow bg-white border-r border-slate-200/80">
          {/* Logo Header */}
          <div className="flex h-16 items-center px-6 border-b border-slate-100">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Invoicely<span className="text-primary-600">.</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Workspace</span>
              </div>
            </Link>
          </div>

          {/* Quick Action Button */}
          <div className="px-4 pt-5 pb-2">
            <Link
              href="/invoices/new"
              className="btn-primary w-full py-2.5 shadow-sm hover:shadow-primary-500/25 transition-all text-xs uppercase tracking-wider"
            >
              <PlusIcon className="h-4 w-4 mr-1.5 stroke-[2.5]" />
              New Invoice
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 px-4 py-4">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Main Menu</p>
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100/80'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {item.name}
                  </div>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary-600" />}
                </Link>
              )
            })}
          </nav>

          {/* User Account Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/40">
            <Link
              href="/settings"
              className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-100/80 transition-colors group cursor-pointer"
              title="Manage Profile & UPI Settings"
            >
              {session?.user?.image ? (
                <img
                  className="h-10 w-10 rounded-xl border border-slate-200 object-cover group-hover:ring-2 group-hover:ring-primary-500/30 transition-all"
                  src={session.user.image}
                  alt={session.user.name || ''}
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  {userInitials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 truncate transition-colors">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
              </div>
              <Cog6ToothIcon className="h-4 w-4 text-slate-400 group-hover:text-primary-600 group-hover:rotate-45 transition-all" />
            </Link>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link
                href="/settings"
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm"
              >
                <Cog6ToothIcon className="h-3.5 w-3.5 text-slate-500" />
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100"
              >
                <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Modern Sticky Topbar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-700 capitalize">
                {pathname === '/dashboard' ? 'Overview' : pathname.replace('/', '').replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices/new"
              className="btn-primary py-2 px-3 text-xs sm:text-sm flex items-center gap-1.5"
            >
              <PlusIcon className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Create</span> Invoice
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <Link
              href="/settings"
              className="flex items-center gap-2 p-1.5 -mr-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
              title="Profile & Payment Settings"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-primary-50 group-hover:text-primary-700 flex items-center justify-center text-xs font-bold text-slate-700 border border-slate-200 transition-colors">
                {userInitials}
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-primary-700 hidden md:block transition-colors">
                {session?.user?.name?.split(' ')[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
 