"use client"

import { usePrivy } from "@privy-io/react-auth"

export function ConnectWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy()

  // Ainda carregando
  if (!ready) {
    return (
      <button disabled className="bg-primary/50 text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-lg cursor-wait">
        Loading...
      </button>
    )
  }

  // Usuário autenticado
  if (authenticated && user) {
    const wallet = user.wallet?.address
    const email = user.email?.address

    const label = wallet
      ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
      : email ?? "Connected"

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
        <button
          onClick={logout}
          className="text-sm font-medium px-4 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  // Usuário não autenticado
  return (
    <button
      onClick={login}
      className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
    >
      Connect Wallet
    </button>
  )
}
