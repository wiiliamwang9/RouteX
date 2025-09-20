"use client"

import { Card } from "@/components/ui/card"
import { useAllTokenPrices } from "@/hooks/use-token-prices"
import { formatDistanceToNow } from "date-fns"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import Image from "next/image"

// 格式化价格显示
const formatPrice = (price: number): string => {
  if (price < 1) {
    return price.toFixed(6)
  }
  return price.toFixed(2)
}

// 格式化交易量
const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`
  }
  return `$${volume.toFixed(2)}`
}

// 格式化百分比变化
const formatPercentage = (change: number): string => {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export function MarketOverview() {
  const { prices, isLoading, lastUpdated, refetch } = useAllTokenPrices()

  if (isLoading && Object.keys(prices).length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Market Overview</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                <div className="space-y-1">
                  <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-12 h-3 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
                <div className="w-16 h-3 bg-muted rounded animate-pulse"></div>
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
        <h3 className="text-lg font-semibold">Market Overview</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {lastUpdated ? `Updated ${formatDistanceToNow(lastUpdated)} ago` : ""}
          </span>
          <button onClick={refetch} className="p-1 hover:bg-muted rounded transition-colors" disabled={isLoading}>
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {Object.values(prices).map((token) => (
          <div key={token.symbol} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={`/placeholder-icon.png?height=32&width=32&text=${token.symbol}`}
                alt={token.symbol}
                width={32}
                height={32}
                className="rounded-full"
              />
              <div>
                <div className="font-semibold">{token.symbol}</div>
                <div className="text-xs text-muted-foreground">
                  {formatVolume(token.volume24h)} 24h vol
                  {token.source && (
                    <span className="ml-2 px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {token.source === 'external' ? 'API' : token.source === 'blockchain' ? '链上' : '计算'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono font-semibold">${formatPrice(token.price)}</div>
              <div className="flex items-center gap-1">
                {token.priceChange24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-mono ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatPercentage(token.priceChange24h)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(prices).length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No market data available</p>
          <p className="text-sm">Check your connection and try again</p>
        </div>
      )}
    </Card>
  )
}
