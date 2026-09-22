import DashboardLayout from '@/components/DashboardLayout'
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton'

export default function InvoicesLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* Quick Filter Tabs Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['All Invoices', 'Paid', 'Sent', 'Overdue', 'Draft'].map((tab, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Table Skeleton */}
        <TableSkeleton rows={6} columns={6} />
      </div>
    </DashboardLayout>
  )
}
