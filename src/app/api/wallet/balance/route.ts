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
