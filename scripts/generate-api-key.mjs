// Script para gerar credenciais da Polymarket CLOB API
// Rode: node scripts/generate-api-key.mjs <PRIVATE_KEY>
//
// PRIVATE_KEY: chave privada da sua wallet Polygon (com ou sem 0x)
// Guarde as credenciais geradas no .env.local

import { ClobClient } from "@polymarket/clob-client"
import { ethers } from "ethers"

const privateKey = process.argv[2]

if (!privateKey) {
  console.error("\nUso: node scripts/generate-api-key.mjs <PRIVATE_KEY>\n")
  console.error("Exemplo: node scripts/generate-api-key.mjs 0xabc123...\n")
  process.exit(1)
}

async function main() {
  console.log("\n🔑 Gerando credenciais Polymarket CLOB...\n")

  const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
  const wallet = new ethers.Wallet(key)

  console.log(`Wallet address: ${wallet.address}`)
  console.log("Conectando ao CLOB...\n")

  const client = new ClobClient(
    "https://clob.polymarket.com",
    137,
    wallet
  )

  const creds = await client.createOrDeriveApiKey()

  console.log("✅ Credenciais geradas com sucesso!\n")
  console.log("Cole no seu .env.local:\n")
  console.log("─────────────────────────────────────")
  console.log(`BUILDER_PRIVATE_KEY=${key}`)
  console.log(`BUILDER_API_KEY=${creds.key}`)
  console.log(`BUILDER_SECRET=${creds.secret}`)
  console.log(`BUILDER_PASSPHRASE=${creds.passphrase}`)
  console.log("─────────────────────────────────────\n")
}

main().catch((err) => {
  console.error("\n❌ Erro:", err.message)
  process.exit(1)
})
