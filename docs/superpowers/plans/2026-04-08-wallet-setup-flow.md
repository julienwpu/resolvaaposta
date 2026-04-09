# Wallet Setup Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the BetForm behind a wallet setup stepper that checks USDC.e balance and contract approvals, guiding the user to fund their wallet and approve contracts before their first bet.

**Architecture:** A server-side API route reads balance + allowances from Polygon via ethers. A client hook polls that endpoint and exposes `approve()` functions that use the user's Privy embedded wallet to sign the approval transactions. The BetForm renders either the setup stepper or the bet UI depending on setup completion.

**Tech Stack:** ethers v5, `@privy-io/react-auth` v3 (`useWallets`), Next.js App Router API routes, TailwindCSS, Zustand

---

## Contract Addresses (Polygon Mainnet)

| Contract | Address |
|---|---|
| USDC.e | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` |
| CTF Exchange | `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E` |
| Neg Risk Exchange | `0xC5d563A36AE78145C45a50134d48A1215220f80a` |

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/lib/contracts.ts` | **CREATE** | Contract addresses + shared ABIs |
| `src/app/api/wallet/balance/route.ts` | **CREATE** | GET: returns USDC balance + approval flags |
| `src/hooks/useWalletSetup.ts` | **CREATE** | Client hook: setup status + approve functions |
| `src/components/wallet/WalletSetup.tsx` | **CREATE** | Stepper UI — guides user through 3 steps |
| `src/components/wallet/FundWallet.tsx` | **CREATE** | Modal with funding instructions + copy address |
| `src/components/markets/BetForm.tsx` | **MODIFY** | Show balance, gate behind setup completion |

---

## Task 1: Contract constants

**Files:**
- Create: `src/lib/contracts.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/contracts.ts

export const CONTRACTS = {
  USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  CTF_EXCHANGE: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
  NEG_RISK_EXCHANGE: "0xC5d563A36AE78145C45a50134d48A1215220f80a",
} as const

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
] as const

// USDC.e has 6 decimals
export const USDC_DECIMALS = 6

// Unlimited approval amount (max uint256)
export const MAX_UINT256 =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/contracts.ts
git commit -m "feat: add contract addresses and ABIs"
```

---

## Task 2: Balance + approvals API endpoint

**Files:**
- Create: `src/app/api/wallet/balance/route.ts`

- [ ] **Step 1: Create the directory and file**

```ts
// src/app/api/wallet/balance/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { CONTRACTS, ERC20_ABI, USDC_DECIMALS } from "@/lib/contracts"

const RPC_URL =
  process.env.POLYGON_RPC_URL ?? "https://polygon-rpc.com"

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")

  if (!address || !ethers.utils.isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 })
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
    const usdc = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, provider)

    const [rawBalance, ctfAllowance, negRiskAllowance] = await Promise.all([
      usdc.balanceOf(address) as Promise<ethers.BigNumber>,
      usdc.allowance(address, CONTRACTS.CTF_EXCHANGE) as Promise<ethers.BigNumber>,
      usdc.allowance(address, CONTRACTS.NEG_RISK_EXCHANGE) as Promise<ethers.BigNumber>,
    ])

    const MIN_ALLOWANCE = ethers.utils.parseUnits("1000", USDC_DECIMALS)

    return NextResponse.json({
      balance: parseFloat(
        ethers.utils.formatUnits(rawBalance, USDC_DECIMALS)
      ),
      hasCtfApproval: ctfAllowance.gte(MIN_ALLOWANCE),
      hasNegRiskApproval: negRiskAllowance.gte(MIN_ALLOWANCE),
    })
  } catch (error) {
    console.error("Balance check error:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Test manually**

Acesse no browser após `pnpm dev`:
```
http://localhost:3000/api/wallet/balance?address=0xE13773a78681E5Ad2e26F186a96279D6556C6fa5
```

Resposta esperada:
```json
{
  "balance": 1.5,
  "hasCtfApproval": true,
  "hasNegRiskApproval": true
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/wallet/balance/route.ts
git commit -m "feat: add wallet balance and approvals check API"
```

---

## Task 3: useWalletSetup hook

**Files:**
- Create: `src/hooks/useWalletSetup.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/useWalletSetup.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { ethers } from "ethers"
import { CONTRACTS, ERC20_ABI, MAX_UINT256 } from "@/lib/contracts"

interface SetupStatus {
  balance: number
  hasCtfApproval: boolean
  hasNegRiskApproval: boolean
  isLoading: boolean
  error: string | null
}

interface UseWalletSetupReturn extends SetupStatus {
  isReady: boolean
  walletAddress: string | null
  approveCtf: () => Promise<void>
  approveNegRisk: () => Promise<void>
  refresh: () => void
}

export function useWalletSetup(): UseWalletSetupReturn {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()

  const [status, setStatus] = useState<SetupStatus>({
    balance: 0,
    hasCtfApproval: false,
    hasNegRiskApproval: false,
    isLoading: false,
    error: null,
  })
  const [refreshTick, setRefreshTick] = useState(0)

  // Prefer embedded wallet, fall back to external
  const activeWallet = wallets.find(w => w.walletClientType === "privy") ?? wallets[0]
  const walletAddress = activeWallet?.address ?? null

  // Fetch balance + approval status from API
  useEffect(() => {
    if (!authenticated || !walletAddress) return

    setStatus(s => ({ ...s, isLoading: true, error: null }))

    fetch(`/api/wallet/balance?address=${walletAddress}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setStatus({
          balance: data.balance,
          hasCtfApproval: data.hasCtfApproval,
          hasNegRiskApproval: data.hasNegRiskApproval,
          isLoading: false,
          error: null,
        })
      })
      .catch(err => {
        setStatus(s => ({ ...s, isLoading: false, error: err.message }))
      })
  }, [authenticated, walletAddress, refreshTick])

  const refresh = useCallback(() => setRefreshTick(t => t + 1), [])

  // Generic approve function using the user's wallet
  const sendApproval = useCallback(
    async (spender: string) => {
      if (!activeWallet) throw new Error("No wallet connected")

      await activeWallet.switchChain(137) // Polygon
      const provider = await activeWallet.getEthereumProvider()
      const ethersProvider = new ethers.providers.Web3Provider(provider)
      const signer = ethersProvider.getSigner()

      const usdc = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, signer)
      const tx = await usdc.approve(spender, MAX_UINT256)
      await tx.wait()

      refresh()
    },
    [activeWallet, refresh]
  )

  const approveCtf = useCallback(
    () => sendApproval(CONTRACTS.CTF_EXCHANGE),
    [sendApproval]
  )

  const approveNegRisk = useCallback(
    () => sendApproval(CONTRACTS.NEG_RISK_EXCHANGE),
    [sendApproval]
  )

  const isReady =
    authenticated &&
    status.balance > 0 &&
    status.hasCtfApproval &&
    status.hasNegRiskApproval

  return {
    ...status,
    isReady: !!isReady,
    walletAddress,
    approveCtf,
    approveNegRisk,
    refresh,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useWalletSetup.ts
git commit -m "feat: add useWalletSetup hook"
```

---

## Task 4: FundWallet modal

**Files:**
- Create: `src/components/wallet/FundWallet.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/wallet/FundWallet.tsx
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
              Buy <strong>USDC</strong> on Binance, Coinbase or OKX. When withdrawing, select <strong>Polygon (MATIC)</strong> as the network and paste your address above.
            </p>
          </div>

          <div className="border border-border rounded-xl p-4 space-y-1">
            <p className="text-sm font-medium">Option 2 — Bridge from another chain</p>
            <p className="text-xs text-muted-foreground">
              Use{" "}
              <a href="https://app.across.to" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Across Protocol
              </a>{" "}
              or{" "}
              <a href="https://portal.polygon.technology/bridge" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
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
          After funding, come back here and click <strong>Refresh</strong> to continue.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wallet/FundWallet.tsx
git commit -m "feat: add FundWallet modal with funding instructions"
```

---

## Task 5: WalletSetup stepper

**Files:**
- Create: `src/components/wallet/WalletSetup.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/wallet/WalletSetup.tsx
"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react"
import { useWalletSetup } from "@/hooks/useWalletSetup"
import { FundWallet } from "@/components/wallet/FundWallet"

type StepState = "done" | "active" | "pending" | "loading"

function Step({
  label,
  description,
  state,
  action,
}: {
  label: string
  description: string
  state: StepState
  action?: React.ReactNode
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
      state === "active" ? "bg-primary/5 border border-primary/20" : ""
    }`}>
      <div className="mt-0.5 shrink-0">
        {state === "done" && <CheckCircle2 size={18} className="text-green-500" />}
        {state === "loading" && <Loader2 size={18} className="text-primary animate-spin" />}
        {(state === "active" || state === "pending") && (
          <Circle size={18} className={state === "active" ? "text-primary" : "text-muted-foreground/40"} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          state === "pending" ? "text-muted-foreground/50" : "text-foreground"
        }`}>
          {label}
        </p>
        {state !== "pending" && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
        {action && state === "active" && (
          <div className="mt-2">{action}</div>
        )}
      </div>
    </div>
  )
}

export function WalletSetup() {
  const {
    balance,
    hasCtfApproval,
    hasNegRiskApproval,
    isLoading,
    walletAddress,
    approveCtf,
    approveNegRisk,
    refresh,
  } = useWalletSetup()

  const [showFundModal, setShowFundModal] = useState(false)
  const [approvingCtf, setApprovingCtf] = useState(false)
  const [approvingNegRisk, setApprovingNegRisk] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  const hasFunds = balance > 0

  // Determine step states
  const step1: StepState = "done"
  const step2: StepState = hasFunds ? "done" : "active"
  const step3: StepState = !hasFunds ? "pending" : hasCtfApproval ? "done" : approvingCtf ? "loading" : "active"
  const step4: StepState = !hasFunds || !hasCtfApproval ? "pending" : hasNegRiskApproval ? "done" : approvingNegRisk ? "loading" : "active"

  const handleApproveCtf = async () => {
    setApproveError(null)
    setApprovingCtf(true)
    try {
      await approveCtf()
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : "Approval failed")
    } finally {
      setApprovingCtf(false)
    }
  }

  const handleApproveNegRisk = async () => {
    setApproveError(null)
    setApprovingNegRisk(true)
    try {
      await approveNegRisk()
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : "Approval failed")
    } finally {
      setApprovingNegRisk(false)
    }
  }

  if (isLoading) {
    return (
      <div className="border border-border rounded-xl p-6 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Checking wallet...</span>
      </div>
    )
  }

  return (
    <>
      <div className="border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Wallet setup</h2>
          <button
            onClick={refresh}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh status"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="space-y-1">
          <Step
            label="Connected"
            description={`${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`}
            state={step1}
          />

          <Step
            label="Add USDC.e to your wallet"
            description={hasFunds ? `Balance: $${balance.toFixed(2)} USDC` : "You need USDC.e on Polygon to place bets"}
            state={step2}
            action={
              <button
                onClick={() => setShowFundModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                How to fund my wallet
              </button>
            }
          />

          <Step
            label="Approve trading contract"
            description="Allow Jules to submit orders on your behalf (one-time)"
            state={step3}
            action={
              <button
                onClick={handleApproveCtf}
                disabled={approvingCtf}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {approvingCtf ? "Approving..." : "Approve"}
              </button>
            }
          />

          <Step
            label="Approve neg-risk contract"
            description="Required for binary YES/NO markets (one-time)"
            state={step4}
            action={
              <button
                onClick={handleApproveNegRisk}
                disabled={approvingNegRisk}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {approvingNegRisk ? "Approving..." : "Approve"}
              </button>
            }
          />
        </div>

        {approveError && (
          <p className="text-xs text-destructive mt-3 text-center">{approveError}</p>
        )}
      </div>

      {showFundModal && walletAddress && (
        <FundWallet address={walletAddress} onClose={() => setShowFundModal(false)} />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/wallet/WalletSetup.tsx
git commit -m "feat: add WalletSetup stepper component"
```

---

## Task 6: Update BetForm

**Files:**
- Modify: `src/components/markets/BetForm.tsx`

- [ ] **Step 1: Add setup gate and balance display**

Substituir o conteúdo completo do arquivo:

```tsx
// src/components/markets/BetForm.tsx
"use client"

import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Market } from "@/lib/polymarket/gamma"
import { WalletSetup } from "@/components/wallet/WalletSetup"
import { useWalletSetup } from "@/hooks/useWalletSetup"

interface BetFormProps {
  market: Market
  defaultSide: "YES" | "NO"
  yesPrice: number
  noPrice: number
}

export function BetForm({ market, defaultSide, yesPrice, noPrice }: BetFormProps) {
  const { authenticated, login } = usePrivy()
  const { isReady, balance, isLoading } = useWalletSetup()

  const [side, setSide] = useState<"YES" | "NO">(defaultSide)
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

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
    if (!authenticated) { login(); return }
    if (!amount || parseFloat(amount) <= 0) { setMessage("Enter a valid amount."); return }
    if (parseFloat(amount) > balance) { setMessage("Insufficient USDC balance."); return }

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
    } catch (e: unknown) {
      setStatus("error")
      setMessage(e instanceof Error ? e.message : "Something went wrong.")
    }
  }

  // Not logged in
  if (!authenticated) {
    return (
      <div className="border border-border rounded-xl p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Place a bet</h2>
        <button
          onClick={login}
          className="w-full py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Connect wallet to bet
        </button>
      </div>
    )
  }

  // Logged in but setup incomplete
  if (!isLoading && !isReady) {
    return <WalletSetup />
  }

  // Ready to bet
  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">Place a bet</h2>
        <span className="text-xs text-muted-foreground">
          Balance: <span className="text-foreground font-medium">${balance.toFixed(2)}</span>
        </span>
      </div>

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
            max={balance}
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
            disabled={parseFloat(p) > balance}
            className="flex-1 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
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
        disabled={status === "loading" || !amount || parseFloat(amount) > balance}
        className="w-full py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "loading"
          ? "Placing order..."
          : `Bet ${side === "YES" ? "Yes" : "No"}${amount ? ` · $${amount}` : ""}`}
      </button>

      {message && (
        <p className={`text-xs mt-2 text-center ${status === "error" ? "text-destructive" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/markets/BetForm.tsx
git commit -m "feat: gate BetForm behind wallet setup, show live balance"
```

---

## Task 7: Push e verificar deploy

- [ ] **Step 1: Push tudo**

```bash
git push
```

- [ ] **Step 2: Verificar build no Vercel**

Confirmar que o deploy passou sem erros de TypeScript.

- [ ] **Step 3: Testar fluxo completo**

1. Acessar `https://jules.vercel.app/market/[qualquer-slug]`
2. Conectar com MetaMask (wallet que tem saldo e approvals)
3. Verificar que o BetForm aparece diretamente (pula setup porque já tem approvals)
4. Conectar com email (nova conta) → deve aparecer o WalletSetup
5. Clicar em "How to fund my wallet" → modal abre com o endereço correto
6. Verificar que preset buttons desabilitam corretamente quando `amount > balance`

---

## Self-Review

| Requisito | Coberto? |
|---|---|
| Check balance USDC.e on-chain | ✅ Task 2 |
| Check CTF Exchange approval | ✅ Task 2 |
| Check Neg Risk Exchange approval | ✅ Task 2 |
| Guide user to fund wallet | ✅ Task 4 |
| Send approval transactions via embedded wallet | ✅ Task 3 (hook) + Task 5 |
| Gate BetForm behind setup | ✅ Task 6 |
| Show balance in BetForm | ✅ Task 6 |
| Preset buttons respect balance | ✅ Task 6 |
| Works for both embedded and external wallets | ✅ Task 3 (`activeWallet` fallback) |
