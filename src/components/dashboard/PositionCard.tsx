"use client"

import { Position } from "@/lib/polymarket/data"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PositionCardProps {
  position: Position
}

export function PositionCard({ position }: PositionCardProps) {
  const router = useRouter()
  const isProfit = position.cashPnl >= 0
  const isYes = position.outcomeIndex === 0

  const formatMoney = (v: number) => `$${Math.abs(v).toFixed(2)}`
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div
      onClick={() => router.push(`/market/${position.slug}`)}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {position.icon && (
          <img
            src={position.icon}
            alt={position.title}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {position.title}
          </p>
          {position.endDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {position.closed ? "Ended" : "Ends"} {formatDate(position.endDate)}
            </p>
          )}
        </div>
      </div>

      {/* Outcome badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
          isYes
            ? "bg-green-500/10 text-green-500 border-green-500/30"
            : "bg-red-500/10 text-red-500 border-red-500/30"
        }`}>
          {position.outcome}
        </span>
        <span className="text-xs text-muted-foreground">
          {position.size.toFixed(2)} shares @ {(position.avgPrice * 100).toFixed(0)}¢
        </span>
      </div>

      {/* PnL */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-0.5">Value</div>
          <div className="text-sm font-semibold">{formatMoney(position.currentValue)}</div>
        </div>
        <div className="bg-muted rounded-lg p-2">
          <div className="text-xs text-muted-foreground mb-0.5">Invested</div>
          <div className="text-sm font-semibold">{formatMoney(position.initialValue)}</div>
        </div>
        <div className={`rounded-lg p-2 ${isProfit ? "bg-green-500/10" : "bg-red-500/10"}`}>
          <div className="text-xs text-muted-foreground mb-0.5">P&L</div>
          <div className={`text-sm font-semibold flex items-center justify-center gap-0.5 ${
            isProfit ? "text-green-500" : "text-red-500"
          }`}>
            {isProfit
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {isProfit ? "+" : "-"}{formatMoney(position.cashPnl)}
          </div>
        </div>
      </div>
    </div>
  )
}
