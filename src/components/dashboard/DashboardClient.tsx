"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useEffect, useState } from "react"
import { getUserPositions, getUserActivity, Position, Activity } from "@/lib/polymarket/data"
import { PositionCard } from "./PositionCard"
import { Wallet, TrendingUp, DollarSign, Activity as ActivityIcon } from "lucide-react"

export function DashboardClient() {
  const { authenticated, user, login } = usePrivy()
  const [positions, setPositions] = useState<Position[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"positions" | "activity">("positions")

  const address = user?.wallet?.address

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      getUserPositions(address),
      getUserActivity(address),
    ])
      .then(([pos, act]) => {
        setPositions(pos)
        setActivity(act)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  // Não autenticado
  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-lg mb-1">Connect your wallet</h2>
          <p className="text-muted-foreground text-sm">Connect to see your positions and bet history</p>
        </div>
        <button
          onClick={login}
          className="bg-primary text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  // Sem wallet on-chain (só email)
  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Wallet className="w-7 h-7 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-lg mb-1">No wallet found</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your account doesn&apos;t have a Polygon wallet yet. A wallet will be created automatically on your first bet.
          </p>
        </div>
      </div>
    )
  }

  // Stats gerais
  const totalValue = positions.reduce((acc, p) => acc + p.currentValue, 0)
  const totalInvested = positions.reduce((acc, p) => acc + p.initialValue, 0)
  const totalPnl = positions.reduce((acc, p) => acc + p.cashPnl, 0)
  const openPositions = positions.filter((p) => !p.closed)
  const closedPositions = positions.filter((p) => p.closed)

  const formatMoney = (v: number) => `$${Math.abs(v).toFixed(2)}`

  return (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Portfolio value", value: formatMoney(totalValue), icon: <DollarSign className="w-4 h-4" /> },
          { label: "Total invested", value: formatMoney(totalInvested), icon: <DollarSign className="w-4 h-4" /> },
          {
            label: "Total P&L",
            value: `${totalPnl >= 0 ? "+" : "-"}${formatMoney(totalPnl)}`,
            icon: <TrendingUp className="w-4 h-4" />,
            color: totalPnl >= 0 ? "text-green-500" : "text-red-500",
          },
          { label: "Open positions", value: String(openPositions.length), icon: <ActivityIcon className="w-4 h-4" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {stat.icon}
              <span className="text-xs">{stat.label}</span>
            </div>
            <div className={`text-xl font-bold ${stat.color ?? ""}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        {(["positions", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "positions" ? `Positions (${positions.length})` : `Activity (${activity.length})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-44 animate-pulse" />
          ))}
        </div>
      )}

      {/* Positions tab */}
      {!loading && tab === "positions" && (
        <>
          {positions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No positions found for this wallet.
            </div>
          ) : (
            <div className="space-y-6">
              {openPositions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Open ({openPositions.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {openPositions.map((p) => (
                      <PositionCard key={`${p.conditionId}-${p.outcomeIndex}`} position={p} />
                    ))}
                  </div>
                </div>
              )}
              {closedPositions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Closed ({closedPositions.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {closedPositions.map((p) => (
                      <PositionCard key={`${p.conditionId}-${p.outcomeIndex}`} position={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Activity tab */}
      {!loading && tab === "activity" && (
        <>
          {activity.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No activity found for this wallet.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {activity.map((act) => (
                <div key={act.id} className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors">
                  {act.icon && (
                    <img src={act.icon} alt={act.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {act.type} · {act.outcome} · {new Date(act.timestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">${act.usdcSize?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{(act.price * 100).toFixed(0)}¢</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
