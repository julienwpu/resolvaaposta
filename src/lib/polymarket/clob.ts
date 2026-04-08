// CLOB Client — server-side only
// NUNCA importar este arquivo em componentes "use client"

import { ClobClient } from "@polymarket/clob-client"
import { ethers } from "ethers"

const CLOB_URL = "https://clob.polymarket.com"
const CHAIN_ID = 137 // Polygon Mainnet

let _client: ClobClient | null = null

export function getClobClient(): ClobClient {
  if (_client) return _client

  if (!process.env.BUILDER_PRIVATE_KEY) {
    throw new Error("BUILDER_PRIVATE_KEY não definida no .env.local")
  }

  const signer = new ethers.Wallet(process.env.BUILDER_PRIVATE_KEY)

  const creds = process.env.BUILDER_API_KEY
    ? {
        key: process.env.BUILDER_API_KEY,
        secret: process.env.BUILDER_SECRET!,
        passphrase: process.env.BUILDER_PASSPHRASE!,
      }
    : undefined

  _client = new ClobClient(CLOB_URL, CHAIN_ID, signer, creds)
  return _client
}

export async function getOrderBook(tokenId: string) {
  const client = getClobClient()
  return client.getOrderBook(tokenId)
}

export async function submitOrder({
  tokenId,
  price,
  size,
  side,
}: {
  tokenId: string
  price: number
  size: number
  side: "BUY" | "SELL"
}) {
  const client = getClobClient()

  const order = await client.createOrder({
    tokenID: tokenId,
    price,
    size,
    side,
  })

  const result = await client.postOrder(order)
  return result
}
