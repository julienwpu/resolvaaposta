// Cancela transações presas enviando txs vazias com mesmo nonce + gas alto
// Rode: node scripts/cancel-stuck-txs.mjs

import { ethers } from "ethers"
import { readFileSync } from "fs"

const envFile = readFileSync(".env.local", "utf-8")
envFile.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=")
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim()
})

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

async function waitForTx(provider, hash) {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    try {
      const receipt = await provider.getTransactionReceipt(hash)
      if (receipt) return receipt
    } catch {}
    process.stdout.write(".")
  }
  return null
}

async function main() {
  const provider = await connectRpc()
  const wallet = new ethers.Wallet(process.env.BUILDER_PRIVATE_KEY, provider)

  console.log("🔑 Wallet:", wallet.address)

  const confirmedNonce = await provider.getTransactionCount(wallet.address, "latest")
  const pendingNonce = await provider.getTransactionCount(wallet.address, "pending")

  console.log(`📊 Nonce confirmado: ${confirmedNonce}`)
  console.log(`📊 Nonce pendente:   ${pendingNonce}`)

  if (confirmedNonce === pendingNonce) {
    console.log("\n✅ Nenhuma transação presa encontrada!")
    return
  }

  const stuckCount = pendingNonce - confirmedNonce
  console.log(`\n⚠️  ${stuckCount} transação(ões) presa(s). Cancelando com 300 Gwei...\n`)

  for (let nonce = confirmedNonce; nonce < pendingNonce; nonce++) {
    console.log(`  📤 Cancelando nonce ${nonce}...`)
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0,
      nonce,
      gasPrice: ethers.utils.parseUnits("300", "gwei"),
      gasLimit: 21000,
    })
    console.log(`  🔗 https://polygonscan.com/tx/${tx.hash}`)
    const receipt = await waitForTx(provider, tx.hash)
    if (receipt) {
      console.log(`\n  ✅ Nonce ${nonce} cancelado! Bloco: ${receipt.blockNumber}`)
    } else {
      console.log(`\n  ⚠️  Timeout no nonce ${nonce}`)
    }
  }

  console.log("\n✅ Pronto! Rode agora: node scripts/approve-contracts.mjs\n")
}

main().catch((err) => {
  console.error("\n❌ Erro:", err.message)
  process.exit(1)
})
