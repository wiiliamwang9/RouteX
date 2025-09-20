"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/hooks/use-wallet"
import { Wallet, AlertTriangle, CheckCircle } from "lucide-react"

export function WalletConnect() {
  const {
    address,
    isConnected,
    isConnecting,
    balance,
    connectWallet,
    disconnectWallet,
    switchToMonadChain,
    isOnMonadChain,
  } = useWallet()

  if (!isConnected) {
    return (
      <Card className="p-6 border-border/50">
        <div className="flex flex-col items-center gap-4">
          <Wallet className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground">Connect your wallet to start trading on Monad</p>
          </div>
          <Button onClick={connectWallet} disabled={isConnecting} className="w-full">
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="font-mono text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <Badge variant="secondary">{balance} MON</Badge>
        </div>

        <div className="flex items-center gap-2">
          {!isOnMonadChain ? (
            <Button variant="destructive" size="sm" onClick={switchToMonadChain} className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Switch to Monad
            </Button>
          ) : (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Monad
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={disconnectWallet}>
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  )
}
