import { getMarkets } from "@/lib/polymarket/gamma"
import { MarketsClient } from "@/components/markets/MarketsClient"
import { Navbar } from "@/components/ui/Navbar"

export const revalidate = 30

export default async function MarketsPage() {
  let markets = []
  let error = null

  try {
    markets = await getMarkets({ limit: 100, active: true, closed: false })
  } catch (e) {
    error = "Failed to load markets. Please try again."
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Markets</h1>
          <p className="text-muted-foreground text-sm">Bet on real-world events powered by Polymarket</p>
        </div>

        {error ? (
          <div className="text-center py-16 text-destructive">{error}</div>
        ) : (
          <MarketsClient markets={markets} />
        )}
      </div>
    </main>
  )
}
