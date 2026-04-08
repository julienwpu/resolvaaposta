import { NextRequest, NextResponse } from "next/server"
import { submitOrder } from "@/lib/polymarket/clob"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tokenId, side, amount, price } = body

    // Validações
    if (!tokenId || !side || !amount || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!["YES", "NO"].includes(side)) {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 })
    }
    if (amount <= 0 || amount > 100_000) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }
    if (price <= 0 || price >= 1) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 })
    }

    // Calcula número de shares a partir do valor em USDC
    const size = parseFloat((amount / price).toFixed(4))

    const result = await submitOrder({
      tokenId,
      price,
      size,
      side: "BUY", // sempre BUY — YES ou NO são tokens diferentes
    })

    return NextResponse.json({ success: true, orderId: result?.orderID ?? null })
  } catch (error: unknown) {
    console.error("Order error:", error)
    const msg = error instanceof Error ? error.message : "Order failed. Try again."

    if (msg.includes("not approved")) {
      return NextResponse.json({
        error: "Wallet not approved. You need USDC.e on Polygon and contract approval.",
      }, { status: 403 })
    }

    if (msg.includes("insufficient")) {
      return NextResponse.json({ error: "Insufficient balance." }, { status: 400 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
