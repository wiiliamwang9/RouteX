"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { Wallet, User, Copy, LogOut, CheckCircle, AlertTriangle } from "lucide-react"

export function WalletConnect() {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToMonadChain,
    isOnMonadChain,
  } = useWallet()
  const { toast } = useToast()

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Address Copied!",
        description: "The wallet address has been copied to your clipboard.",
      })
    }
  }

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${address}`}
                alt="User Avatar"
              />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">My Wallet</p>
              <p className="text-xs leading-none text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onSelect={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Address</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => disconnectWallet()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
