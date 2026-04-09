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
