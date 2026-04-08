// Script de aprovação dos contratos Polymarket
// Rode: node scripts/approve-contracts.mjs

import { ethers } from "ethers"
import { readFileSync } from "fs"

// Carrega .env.local manualmente
const envFile = readFileSync(".env.local", "utf-8")
envFile.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=")
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim()
})

const CONTRACTS = {
  USDC_E:            "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  CTF_EXCHANGE:      "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
  NEG_RISK_EXCHANGE: "0xC5d563A36AE78145C45a50134d48A1215220f80a",
  NEG_RISK_ADAPTER:  "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296",
  CTF:               "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045",
}

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
]

const CTF_ABI = [
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
]

async function connectRpc() {
  const RPCS = [
    "https://rpc.ankr.com/polygon",
    "https://polygon.llamarpc.com",
    "https://polygon.drpc.org",
    "https://polygon-mainnet.public.blastapi.io",
  ]
  for (const rpc of RPCS) {
    try {
      const p = new ethers.providers.JsonRpcProvider(rpc)
      await p.getBlockNumber()
      console.log(`🌐 RPC: ${rpc}`)
      return p
    } catch {}
  }
  throw new Error("Nenhum RPC disponível")
}

async function waitForTx(provider, hash, label) {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 4000))
    try {
      const receipt = await provider.getTransactionReceipt(hash)
      if (receipt) {
        if (receipt.status === 1) {
          console.log(`\n  ✅ ${label} confirmado! Bloco: ${receipt.blockNumber}`)
          return true
        } else {
          console.log(`\n  ❌ ${label} falhou on-chain`)
          return false
        }
      }
    } catch {}
    process.stdout.write(".")
  }
  console.log(`\n  ⚠️  Timeout — verifica: https://polygonscan.com/tx/${hash}`)
  return false
}

async function sendApproval(provider, wallet, data, to, label) {
  // Pega nonce pendente para substituir txs presas
  const nonce = await provider.getTransactionCount(wallet.address, "pending")

  // Gas price alto o suficiente para substituir qualquer tx presa
  const gasPrice = ethers.utils.parseUnits("300", "gwei")

  const tx = await wallet.sendTransaction({
    to,
    data,
    nonce,
    gasPrice,
    gasLimit: 100000,
  })

  console.log(`  🔗 https://polygonscan.com/tx/${tx.hash}`)
  return waitForTx(provider, tx.hash, label)
}

async function main() {
  if (!process.env.BUILDER_PRIVATE_KEY) {
    console.error("❌ BUILDER_PRIVATE_KEY não encontrada")
    process.exit(1)
  }

  const provider = await connectRpc()
  const wallet = new ethers.Wallet(process.env.BUILDER_PRIVATE_KEY, provider)

  console.log("🔑 Wallet:", wallet.address)

  const maticBalance = await provider.getBalance(wallet.address)
  console.log(`💜 MATIC: ${parseFloat(ethers.utils.formatEther(maticBalance)).toFixed(4)}`)

  const usdc = new ethers.Contract(CONTRACTS.USDC_E, ERC20_ABI, provider)
  const usdcBalance = await usdc.balanceOf(wallet.address)
  console.log(`💵 USDC.e: $${parseFloat(ethers.utils.formatUnits(usdcBalance, 6)).toFixed(2)}`)

  const MAX = ethers.constants.MaxUint256
  const iface = new ethers.utils.Interface(ERC20_ABI)
  const ctfIface = new ethers.utils.Interface(CTF_ABI)

  console.log("\n📋 Iniciando aprovações...\n")

  // 1. USDC.e → CTF Exchange
  const allow1 = await usdc.allowance(wallet.address, CONTRACTS.CTF_EXCHANGE)
  if (allow1.gte(MAX.div(2))) {
    console.log("  ✓ USDC.e → CTF Exchange — já aprovado")
  } else {
    console.log("  📤 USDC.e → CTF Exchange...")
    const data = iface.encodeFunctionData("approve", [CONTRACTS.CTF_EXCHANGE, MAX])
    await sendApproval(provider, wallet, data, CONTRACTS.USDC_E, "USDC.e → CTF Exchange")
  }

  // 2. USDC.e → Neg Risk Exchange
  const allow2 = await usdc.allowance(wallet.address, CONTRACTS.NEG_RISK_EXCHANGE)
  if (allow2.gte(MAX.div(2))) {
    console.log("  ✓ USDC.e → Neg Risk Exchange — já aprovado")
  } else {
    console.log("  📤 USDC.e → Neg Risk Exchange...")
    const data = iface.encodeFunctionData("approve", [CONTRACTS.NEG_RISK_EXCHANGE, MAX])
    await sendApproval(provider, wallet, data, CONTRACTS.USDC_E, "USDC.e → Neg Risk Exchange")
  }

  // 3. CTF → Neg Risk Adapter
  const ctf = new ethers.Contract(CONTRACTS.CTF, CTF_ABI, provider)
  const approved3 = await ctf.isApprovedForAll(wallet.address, CONTRACTS.NEG_RISK_ADAPTER)
  if (approved3) {
    console.log("  ✓ CTF → Neg Risk Adapter — já aprovado")
  } else {
    console.log("  📤 CTF → Neg Risk Adapter...")
    const data = ctfIface.encodeFunctionData("setApprovalForAll", [CONTRACTS.NEG_RISK_ADAPTER, true])
    await sendApproval(provider, wallet, data, CONTRACTS.CTF, "CTF → Neg Risk Adapter")
  }

  console.log("\n✅ Processo concluído!\n")
}

main().catch((err) => {
  console.error("\n❌ Erro:", err.message)
  process.exit(1)
})
