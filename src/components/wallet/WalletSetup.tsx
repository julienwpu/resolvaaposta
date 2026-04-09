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

  const step1: StepState = "done"
  const step2: StepState = hasFunds ? "done" : "active"
  const step3: StepState = !hasFunds
    ? "pending"
    : hasCtfApproval
    ? "done"
    : approvingCtf
    ? "loading"
    : "active"
  const step4: StepState = !hasFunds || !hasCtfApproval
    ? "pending"
    : hasNegRiskApproval
    ? "done"
    : approvingNegRisk
    ? "loading"
    : "active"

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
