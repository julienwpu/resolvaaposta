// Data API — pública, sem autenticação
// Usada para posições e histórico de um endereço de carteira

const DATA_API = "https://data-api.polymarket.com"

export interface Position {
  proxyWallet: string
  asset: string
  conditionId: string
  size: number
  avgPrice: number
  initialValue: number
  currentValue: number
  cashPnl: number
  percentPnl: number
  totalBought: number
  realizedPnl: number
  percentRealizedPnl: number
  curPrice: number
  redeemable: boolean
  mergeable: boolean
  title: string
  slug: string
  icon: string
  endDate: string
  outcome: string
  outcomeIndex: number
  closed: boolean
  negative: boolean
}

export interface Activity {
  id: string
  type: string
  outcomeIndex: number
  outcome: string
  title: string
  slug: string
  icon: string
  conditionId: string
  size: number
  usdcSize: number
  price: number
  timestamp: number
  transactionHash: string
}

// Busca posições abertas de um endereço
export async function getUserPositions(address: string): Promise<Position[]> {
  const res = await fetch(
    `${DATA_API}/positions?user=${address}&sizeThreshold=.01`,
    { next: { revalidate: 30 } }
  )
  if (!res.ok) throw new Error(`Data API error: ${res.status}`)
  return res.json()
}

// Busca histórico de atividade de um endereço
export async function getUserActivity(address: string, limit = 20): Promise<Activity[]> {
  const res = await fetch(
    `${DATA_API}/activity?user=${address}&limit=${limit}`,
    { next: { revalidate: 30 } }
  )
  if (!res.ok) throw new Error(`Data API error: ${res.status}`)
  return res.json()
}
