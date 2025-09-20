"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { WalletStatus } from "@/components/wallet-status"
import { Wallet, AlertTriangle, CheckCircle } from "lucide-react"

export function WalletConnect() {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const {
    isConnected,
    isConnecting,
    connectWallet,
    switchToMonadChain,
    isOnMonadChain,
  } = useWallet()

  if (!isMounted) {
    return <div className="h-10 w-36 rounded-md bg-muted/50 animate-pulse" />
  }

  if (!isConnected) {
    return (
      <Button onClick={connectWallet} disabled={isConnecting}>
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {!isOnMonadChain ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={switchToMonadChain}
          className="flex items-center gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          Switch Chain
        </Button>
      ) : (
        <div className="hidden items-center gap-1 text-xs text-green-500 sm:flex">
          <CheckCircle className="h-3 w-3" />
          Monad
        </div>
      )}
      <WalletStatus />
    </div>
  )
}
