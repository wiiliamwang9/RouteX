"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { monadDataProvider } from "@/lib/data-providers"
import { formatDistanceToNow } from "date-fns"
import { Activity, Zap, Clock } from "lucide-react"

interface NetworkStats {
  blockNumber: number
  blockTime: number
  gasPrice: string
  tps: number
  lastUpdated: number
}

export function NetworkStatus() {
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        setIsLoading(true)
        const blockNumber = await monadDataProvider.getBlockNumber()
        const gasEstimate = await monadDataProvider.estimateGas(
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000001",
          "1000000000000000000",
          ["ETH", "USDC"],
        )

        setStats({
          blockNumber,
          blockTime: 2.5, // Mock Monad block time
          gasPrice: gasEstimate.gasPrice,
          tps: 10000 + Math.random() * 5000, // Mock TPS
          lastUpdated: Date.now(),
        })
      } catch (error) {
        console.error("Failed to fetch network stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNetworkStats()

    // Update every 30 seconds
    const interval = setInterval(fetchNetworkStats, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Network Status</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="w-16 h-3 bg-muted rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Network Status</h3>
        </div>
        <div className="text-center py-4 text-muted-foreground">
          <p>Unable to fetch network status</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Network Status</h3>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Online
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Activity className="h-3 w-3" />
            Block Height
          </div>
          <div className="font-mono font-semibold">{stats.blockNumber.toLocaleString()}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            Block Time
          </div>
          <div className="font-mono font-semibold">{stats.blockTime}s</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Zap className="h-3 w-3" />
            Gas Price
          </div>
          <div className="font-mono font-semibold">{Number.parseFloat(stats.gasPrice).toFixed(1)} gwei</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Activity className="h-3 w-3" />
            TPS
          </div>
          <div className="font-mono font-semibold">{stats.tps.toFixed(0)}</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground">Last updated {formatDistanceToNow(stats.lastUpdated)} ago</div>
      </div>
    </Card>
  )
}
