import { Market } from "@/lib/polymarket/gamma"
import { MarketCard } from "./MarketCard"

interface MarketsListProps {
  markets: Market[]
}

export function MarketsList({ markets }: MarketsListProps) {
  if (markets.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No markets found.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  )
}
