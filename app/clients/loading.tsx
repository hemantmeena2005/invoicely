import DashboardLayout from '@/components/DashboardLayout'
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton'

export default function ClientsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Quick Search Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Clients Table Skeleton */}
        <TableSkeleton rows={5} columns={5} />
      </div>
    </DashboardLayout>
  )
}
