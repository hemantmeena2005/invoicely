import DashboardLayout from '@/components/DashboardLayout'
import { DashboardLoadingSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <DashboardLoadingSkeleton />
    </DashboardLayout>
  )
}
