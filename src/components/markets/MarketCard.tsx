"use client"

import { Market } from "@/lib/polymarket/gamma"
import { useRouter } from "next/navigation"

interface MarketCardProps {
  market: Market
}

export function MarketCard({ market }: MarketCardProps) {
  const router = useRouter()

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

  const formatVolume = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
    return `$${v.toFixed(0)}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleBet = (e: React.MouseEvent, side: "YES" | "NO") => {
    e.stopPropagation()
    router.push(`/market/${market.slug}?side=${side}`)
  }

  return (
    <div
      onClick={() => router.push(`/market/${market.slug}`)}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {market.image && (
          <img
            src={market.image}
            alt={market.question}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {market.question}
        </p>
      </div>

      {/* Odds */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={(e) => handleBet(e, "YES")}
          className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg py-2 px-3 transition-colors"
        >
          <div className="text-xs text-muted-foreground mb-0.5">Yes</div>
          <div className="text-sm font-bold text-green-500">{(yesPrice * 100).toFixed(0)}¢</div>
        </button>
        <button
          onClick={(e) => handleBet(e, "NO")}
          className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg py-2 px-3 transition-colors"
        >
          <div className="text-xs text-muted-foreground mb-0.5">No</div>
          <div className="text-sm font-bold text-red-500">{(noPrice * 100).toFixed(0)}¢</div>
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Vol: {formatVolume(volume)}</span>
        {market.endDate && (
          <span>Ends {formatDate(market.endDate)}</span>
        )}
      </div>
    </div>
  )
}
