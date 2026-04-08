import { getMarketBySlug } from "@/lib/polymarket/gamma"
import { BetForm } from "@/components/markets/BetForm"
import { Navbar } from "@/components/ui/Navbar"
import Link from "next/link"
import { ArrowLeft, Calendar, BarChart2, Droplets } from "lucide-react"

export const revalidate = 30

interface Props {
  params: { slug: string }
  searchParams: { side?: string }
}

export default async function MarketPage({ params, searchParams }: Props) {
  let market = null
  let error = null

  try {
    market = await getMarketBySlug(params.slug)
  } catch {
    error = "Market not found."
  }

  if (error || !market) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{error ?? "Market not found."}</p>
            <Link href="/markets" className="text-primary underline text-sm">← Back to markets</Link>
          </div>
        </div>
      </main>
    )
  }

  const parsePrices = (prices: string[] | string | undefined): string[] => {
    if (!prices) return ["0", "0"]
    if (typeof prices === "string") {
      try { return JSON.parse(prices) } catch { return ["0", "0"] }
    }
    return prices
  }

  const prices = parsePrices(market.outcomePrices)
  const yesPrice = parseFloat(prices[0] ?? "0")
  const noPrice = parseFloat(prices[1] ?? "0")
  const volume = parseFloat(market.volume ?? "0")
  const liquidity = parseFloat(market.liquidity ?? "0")

  const formatMoney = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
    return `$${v.toFixed(0)}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  const defaultSide = searchParams.side === "NO" ? "NO" : "YES"

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to markets
        </Link>

        {/* Market header */}
        <div className="flex items-start gap-4 mb-8">
          {market.image && (
            <img
              src={market.image}
              alt={market.question}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-border"
            />
          )}
          <div>
            <h1 className="text-xl font-bold leading-snug mb-2">{market.question}</h1>
            {market.endDate && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Ends {formatDate(market.endDate)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — Stats */}
          <div className="space-y-4">
            {/* Odds */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Current odds</h2>
              <div className="flex gap-3">
                <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Yes</div>
                  <div className="text-3xl font-bold text-green-500">{(yesPrice * 100).toFixed(0)}¢</div>
                  <div className="text-xs text-green-600/70 mt-1">{(yesPrice * 100).toFixed(1)}% chance</div>
                </div>
                <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">No</div>
                  <div className="text-3xl font-bold text-red-500">{(noPrice * 100).toFixed(0)}¢</div>
                  <div className="text-xs text-red-600/70 mt-1">{(noPrice * 100).toFixed(1)}% chance</div>
                </div>
              </div>

              {/* Probability bar */}
              <div className="mt-4">
                <div className="w-full h-2 bg-red-500/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(yesPrice * 100).toFixed(0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Stats</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart2 className="w-4 h-4" />
                    <span>Volume</span>
                  </div>
                  <span className="text-sm font-semibold">{formatMoney(volume)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Droplets className="w-4 h-4" />
                    <span>Liquidity</span>
                  </div>
                  <span className="text-sm font-semibold">{formatMoney(liquidity)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Bet Form */}
          <BetForm
            market={market}
            defaultSide={defaultSide as "YES" | "NO"}
            yesPrice={yesPrice}
            noPrice={noPrice}
          />
        </div>
      </div>
    </main>
  )
}
