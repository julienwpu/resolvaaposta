import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
  )
}

export function MarketCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Skeleton className="flex-1 h-14 rounded-lg" />
        <Skeleton className="flex-1 h-14 rounded-lg" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function MarketsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  )
}
