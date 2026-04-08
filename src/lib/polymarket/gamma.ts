// Gamma API — pública, sem autenticação
// Usada para listagem de mercados, odds e histórico

const GAMMA_API = "https://gamma-api.polymarket.com"

export interface Market {
  id: string
  question: string
  slug: string
  endDate: string
  image: string
  icon: string
  active: boolean
  closed: boolean
  volume: string
  liquidity: string
  outcomes: string[] | string        // ["Yes", "No"] ou string JSON
  outcomePrices: string[] | string   // ["0.65", "0.35"] ou string JSON
  conditionId: string
  clobTokenIds: string[] | string   // IDs dos tokens no CLOB (pode vir como string JSON)
}

export interface MarketsResponse {
  markets: Market[]
  nextCursor?: string
}

// Lista mercados ativos com paginação
export async function getMarkets(params?: {
  limit?: number
  offset?: number
  active?: boolean
  closed?: boolean
  tag?: string
}): Promise<Market[]> {
  const searchParams = new URLSearchParams()

  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.offset) searchParams.set("offset", String(params.offset))
  if (params?.active !== undefined) searchParams.set("active", String(params.active))
  if (params?.closed !== undefined) searchParams.set("closed", String(params.closed))
  if (params?.tag) searchParams.set("tag", params.tag)

  const url = `${GAMMA_API}/markets?${searchParams.toString()}`

  const res = await fetch(url, {
    next: { revalidate: 30 }, // cache de 30s no Next.js
  })

  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`)

  return res.json()
}

// Busca um mercado específico pelo slug
export async function getMarketBySlug(slug: string): Promise<Market> {
  const res = await fetch(`${GAMMA_API}/markets?slug=${slug}`, {
    next: { revalidate: 30 },
  })

  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`)

  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}
