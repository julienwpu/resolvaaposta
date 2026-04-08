"use client"

import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Market } from "@/lib/polymarket/gamma"

interface BetFormProps {
  market: Market
  defaultSide: "YES" | "NO"
  yesPrice: number
  noPrice: number
}

export function BetForm({ market, defaultSide, yesPrice, noPrice }: BetFormProps) {
  const { authenticated, login } = usePrivy()
  const [side, setSide] = useState<"YES" | "NO">(defaultSide)
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  // clobTokenIds pode vir como string JSON da Gamma API
  const parseTokenIds = (ids: string[] | string | undefined): string[] => {
    if (!ids) return []
    if (typeof ids === "string") {
      try { return JSON.parse(ids) } catch { return [] }
    }
    return ids
  }
  const tokenIds = parseTokenIds(market.clobTokenIds)

  const price = side === "YES" ? yesPrice : noPrice
  const shares = amount && price > 0 ? (parseFloat(amount) / price).toFixed(2) : "0"
  const payout = amount ? (parseFloat(shares) * 1).toFixed(2) : "0"

  const presets = ["10", "25", "50", "100"]

  const handleSubmit = async () => {
    if (!authenticated) {
      login()
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setMessage("Enter a valid amount.")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketSlug: market.slug,
          tokenId: tokenIds[side === "YES" ? 0 : 1],
          side,
          amount: parseFloat(amount),
          price,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? "Order failed")

      setStatus("success")
      setMessage(`Order placed! ${shares} shares at ${(price * 100).toFixed(0)}¢`)
      setAmount("")
    } catch (e: any) {
      setStatus("error")
      setMessage(e.message ?? "Something went wrong.")
    }
  }

  return (
    <div className="border border-border rounded-xl p-4">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">Place a bet</h2>

      {/* Side selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSide("YES")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
            side === "YES"
              ? "bg-green-500 text-white border-green-500"
              : "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
          }`}
        >
          Yes · {(yesPrice * 100).toFixed(0)}¢
        </button>
        <button
          onClick={() => setSide("NO")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
            side === "NO"
              ? "bg-red-500 text-white border-red-500"
              : "bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20"
          }`}
        >
          No · {(noPrice * 100).toFixed(0)}¢
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1.5 block">Amount (USDC)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-7 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2 mb-4">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className="flex-1 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
          >
            ${p}
          </button>
        ))}
      </div>

      {/* Summary */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-muted rounded-lg p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Shares</span>
            <span className="font-medium">{shares}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Max payout</span>
            <span className="font-medium text-green-600">${payout}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Potential profit</span>
            <span className="font-medium text-green-600">
              ${(parseFloat(payout) - parseFloat(amount)).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        className="w-full py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {!authenticated
          ? "Connect wallet to bet"
          : status === "loading"
          ? "Placing order..."
          : `Bet ${side === "YES" ? "Yes" : "No"} ${amount ? `· $${amount}` : ""}`}
      </button>

      {/* Feedback */}
      {message && (
        <p className={`text-xs mt-2 text-center ${status === "error" ? "text-destructive" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
