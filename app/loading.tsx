import React from 'react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="card p-8 flex flex-col items-center gap-4 shadow-2xl animate-scale-in max-w-sm w-full mx-4">
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 animate-pulse-glow flex items-center justify-center shadow-glow-primary">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-bold text-slate-800 text-base">Invoicely</h3>
          <p className="text-xs text-slate-500 font-medium">Preparing your workspace...</p>
        </div>
      </div>
    </div>
  )
}
