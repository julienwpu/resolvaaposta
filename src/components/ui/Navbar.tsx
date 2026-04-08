import Link from "next/link"
import { ConnectWallet } from "@/components/wallet/ConnectWallet"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function Navbar() {
  return (
    <header className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/markets" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
            <span className="text-primary">●</span> Polybet
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/markets"
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              Markets
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectWallet />
        </div>
      </div>
    </header>
  )
}
