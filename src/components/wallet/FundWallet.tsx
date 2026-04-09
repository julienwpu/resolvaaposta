"use client"

import { useState } from "react"
import { Copy, Check, X } from "lucide-react"

interface FundWalletProps {
  address: string
  onClose: () => void
}

export function FundWallet({ address, onClose }: FundWalletProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl p-6 max-w-md w-full shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Add funds to your wallet</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Your address */}
        <div className="mb-5">
          <p className="text-xs text-muted-foreground mb-2">Your wallet address (Polygon network)</p>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5">
            <span className="text-xs font-mono flex-1 truncate">{address}</span>
            <button
              onClick={copy}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How to fund</p>

          <div className="border border-border rounded-xl p-4 space-y-1">
            <p className="text-sm font-medium">Option 1 — Buy on a CEX</p>
            <p className="text-xs text-muted-foreground">
              Buy <strong>USDC</strong> on Binance, Coinbase or OKX. When withdrawing,
              select <strong>Polygon (MATIC)</strong> as the network and paste your address above.
            </p>
          </div>

          <div className="border border-border rounded-xl p-4 space-y-1">
            <p className="text-sm font-medium">Option 2 — Bridge from another chain</p>
            <p className="text-xs text-muted-foreground">
              Use{" "}
              <a
                href="https://app.across.to"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Across Protocol
              </a>{" "}
              or{" "}
              <a
                href="https://portal.polygon.technology/bridge"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Polygon Bridge
              </a>{" "}
              to move USDC from Ethereum Mainnet to Polygon.
            </p>
          </div>

          <div className="border border-border rounded-xl p-4 space-y-1">
            <p className="text-sm font-medium">Option 3 — Buy with card (Transak)</p>
            <p className="text-xs text-muted-foreground">
              Use{" "}
              <a
                href={`https://global.transak.com/?cryptoCurrencyCode=USDC&network=polygon&walletAddress=${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Transak
              </a>{" "}
              to buy USDC directly on Polygon with credit/debit card. Minimum ~$10.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-5">
          After funding, come back and click <strong>Refresh</strong> to continue.
        </p>
      </div>
    </div>
  )
}
