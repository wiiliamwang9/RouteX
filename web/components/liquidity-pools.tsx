"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { monadDataProvider, type LiquidityPool, formatPrice } from "@/lib/data-providers"
import { SUPPORTED_TOKENS } from "@/lib/config"
import { ethers } from "ethers"
import { Droplets, ExternalLink } from "lucide-react"

export function LiquidityPools() {
  const [pools, setPools] = useState<LiquidityPool[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPools = async () => {
      try {
        setIsLoading(true)
        const poolData = await monadDataProvider.getLiquidityPools()
        setPools(poolData)
      } catch (error) {
        console.error("Failed to fetch liquidity pools:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPools()
  }, [])

  const getTokenSymbol = (address: string) => {
    const token = SUPPORTED_TOKENS.find((t) => t.address === address)
    return token?.symbol || "Unknown"
  }

  const calculateTVL = (pool: LiquidityPool) => {
    // Mock TVL calculation - in production, this would use actual token prices
    const reserve0Value = Number.parseFloat(ethers.formatEther(pool.reserve0)) * 2000 // Assume ETH price
    const reserve1Value = Number.parseFloat(ethers.formatUnits(pool.reserve1, 6)) // Assume USDC
    return reserve0Value + reserve1Value
  }

  const calculateAPR = (pool: LiquidityPool) => {
    // Mock APR calculation based on fees and volume
    const baseFee = pool.fee * 100 // Convert to percentage
    const volumeMultiplier = Math.random() * 2 + 1 // Mock volume factor
    return baseFee * volumeMultiplier * 365 // Annualized
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Liquidity Pools</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 border border-border/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-24 h-4 bg-muted rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="w-12 h-3 bg-muted rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-12 h-3 bg-muted rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-3 bg-muted rounded animate-pulse"></div>
                  <div className="w-12 h-4 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Liquidity Pools</h3>
        </div>
        <Badge variant="outline">{pools.length} pools</Badge>
      </div>

      <div className="space-y-3">
        {pools.map((pool) => (
          <div
            key={pool.address}
            className="p-4 border border-border/50 rounded-lg hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {getTokenSymbol(pool.token0)}/{getTokenSymbol(pool.token1)}
                </span>
                <Badge variant="secondary">{(pool.fee * 100).toFixed(1)}%</Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-auto p-1">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">TVL</div>
                <div className="font-mono font-semibold">${formatPrice(calculateTVL(pool), 0)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">APR</div>
                <div className="font-mono font-semibold text-green-500">{calculateAPR(pool).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Volume 24h</div>
                <div className="font-mono font-semibold">${formatPrice(Math.random() * 1000000, 0)}</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">{getTokenSymbol(pool.token0)}:</span>{" "}
                  {Number.parseFloat(ethers.formatEther(pool.reserve0)).toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">{getTokenSymbol(pool.token1)}:</span>{" "}
                  {Number.parseFloat(ethers.formatUnits(pool.reserve1, 6)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pools.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No liquidity pools found</p>
          <p className="text-sm">Pools will appear here once contracts are deployed</p>
        </div>
      )}
    </Card>
  )
}
