"use client"

import { useState, useMemo } from "react"
import { Market } from "@/lib/polymarket/gamma"
import { MarketCard } from "./MarketCard"
import { Search, TrendingUp, Clock, Droplets, X } from "lucide-react"

type SortOption = "volume" | "liquidity" | "ending"

interface MarketsClientProps {
  markets: Market[]
}

export function MarketsClient({ markets }: MarketsClientProps) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortOption>("volume")

  const filtered = useMemo(() => {
    let result = [...markets]

    // Filtro por texto
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((m) =>
        m.question?.toLowerCase().includes(q)
      )
    }

    // Ordenação
    result.sort((a, b) => {
      if (sort === "volume") return parseFloat(b.volume ?? "0") - parseFloat(a.volume ?? "0")
      if (sort === "liquidity") return parseFloat(b.liquidity ?? "0") - parseFloat(a.liquidity ?? "0")
      if (sort === "ending") return new Date(a.endDate ?? 0).getTime() - new Date(b.endDate ?? 0).getTime()
      return 0
    })

    return result
  }, [markets, query, sort])

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: "volume", label: "Volume", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { value: "liquidity", label: "Liquidity", icon: <Droplets className="w-3.5 h-3.5" /> },
    { value: "ending", label: "Ending soon", icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  return (
    <div>
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets..."
            className="w-full pl-9 pr-9 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                sort === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {filtered.length} market{filtered.length !== 1 ? "s" : ""}
        {query && ` for "${query}"`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No markets found for &quot;{query}&quot;</p>
          <button
            onClick={() => setQuery("")}
            className="mt-2 text-primary text-sm hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  )
}
