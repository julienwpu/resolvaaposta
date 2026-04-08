import { Navbar } from "@/components/ui/Navbar"
import { MarketsGridSkeleton } from "@/components/ui/Skeleton"

export default function MarketsLoading() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-7 w-32 bg-muted animate-pulse rounded-lg mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded-lg" />
        </div>
        {/* Search bar skeleton */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 h-11 bg-muted animate-pulse rounded-xl" />
          <div className="flex gap-2">
            <div className="w-24 h-11 bg-muted animate-pulse rounded-xl" />
            <div className="w-24 h-11 bg-muted animate-pulse rounded-xl" />
            <div className="w-28 h-11 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
        <MarketsGridSkeleton count={12} />
      </div>
    </main>
  )
}
