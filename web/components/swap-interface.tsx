"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TokenSelector } from "@/components/token-selector"
import { SlippageSettings } from "@/components/slippage-settings"
import { useSwap } from "@/hooks/use-swap"
import { useWallet } from "@/hooks/use-wallet"
import { ArrowUpDown, TrendingUp, AlertTriangle, Zap } from "lucide-react"

export function SwapInterface() {
  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    slippage,
    isLoading,
    route,
    priceImpact,
    estimatedGas,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setSlippage,
    swapTokens,
    executeSwap,
  } = useSwap()

  const { isConnected, isOnMonadChain } = useWallet()

  const canSwap = isConnected && isOnMonadChain && tokenIn && tokenOut && amountIn && amountOut

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Swap Tokens</h3>
          <SlippageSettings slippage={slippage} onSlippageChange={setSlippage} />
        </div>

        {/* Token Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">From</span>
            <span className="text-muted-foreground">Balance: 0.00</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="flex-1 text-lg h-12"
            />
            <TokenSelector selectedToken={tokenIn} onTokenSelect={setTokenIn} excludeToken={tokenOut} />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button variant="outline" size="icon" onClick={swapTokens} className="rounded-full bg-transparent">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Token Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">To</span>
            <span className="text-muted-foreground">Balance: 0.00</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amountOut}
              readOnly
              className="flex-1 text-lg h-12 bg-muted/50"
            />
            <TokenSelector selectedToken={tokenOut} onTokenSelect={setTokenOut} excludeToken={tokenIn} />
          </div>
        </div>

        {/* Route and Details */}
        {route.length > 0 && (
          <div className="space-y-3">
            <Separator />

            {/* Route Display */}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Route:</span>
              <div className="flex items-center gap-1">
                {route.map((token, index) => (
                  <div key={index} className="flex items-center">
                    <Badge variant="secondary" className="text-xs">
                      {token}
                    </Badge>
                    {index < route.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Impact Warning */}
            {priceImpact > 1 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">High price impact: {priceImpact.toFixed(2)}%</span>
              </div>
            )}

            {/* Transaction Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slippage Tolerance</span>
                <span>{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={priceImpact > 1 ? "text-destructive" : ""}>{priceImpact.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Gas</span>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{estimatedGas} MON</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <Button onClick={executeSwap} disabled={!canSwap || isLoading} className="w-full h-12 text-base font-semibold">
          {isLoading
            ? "Processing..."
            : !isConnected
              ? "Connect Wallet"
              : !isOnMonadChain
                ? "Switch to Monad"
                : !tokenIn || !tokenOut
                  ? "Select Tokens"
                  : !amountIn
                    ? "Enter Amount"
                    : "Swap Tokens"}
        </Button>
      </div>
    </Card>
  )
}
