import { Navbar } from "@/components/ui/Navbar"
import { Skeleton } from "@/components/ui/Skeleton"

export default function MarketLoading() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="flex items-start gap-4 mb-8">
          <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-40 mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    </main>
  )
}
