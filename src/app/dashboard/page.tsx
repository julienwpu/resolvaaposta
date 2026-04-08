import { Navbar } from "@/components/ui/Navbar"
import { DashboardClient } from "@/components/dashboard/DashboardClient"

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your positions and betting history</p>
        </div>
        <DashboardClient />
      </div>
    </main>
  )
}
