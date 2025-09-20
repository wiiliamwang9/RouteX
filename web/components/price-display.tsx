"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'
import { useAllTokenPrices, useExchangeRate, usePriceHistory } from '@/hooks/use-token-prices'

// 价格变化指示器组件
function PriceChangeIndicator({ change, className = "" }: { change: number; className?: string }) {
  const isPositive = change >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Icon className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
      <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  )
}

// 单个代币价格卡片
function TokenPriceCard({ symbol, price, change, volume, marketCap }: {
  symbol: string
  price: number
  change: number
  volume: number
  marketCap: number
}) {
  const formattedPrice = price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price < 1 ? 6 : 2,
    maximumFractionDigits: price < 1 ? 6 : 2,
  })

  const formattedVolume = (volume / 1000000).toFixed(2) + 'M'
  const formattedMarketCap = (marketCap / 1000000).toFixed(1) + 'M'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{symbol}</CardTitle>
          <PriceChangeIndicator change={change} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{formattedPrice}</div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="block">24h Volume</span>
              <span className="font-medium">${formattedVolume}</span>
            </div>
            <div>
              <span className="block">Market Cap</span>
              <span className="font-medium">${formattedMarketCap}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 汇率展示组件
function ExchangeRateDisplay() {
  const [selectedPair, setSelectedPair] = useState<{ from: string; to: string }>({
    from: 'WETH',
    to: 'USDC'
  })
  
  const { exchangeRate } = useExchangeRate(selectedPair.from, selectedPair.to)
  const tokens = ['WETH', 'USDC', 'DAI', 'MON']

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          汇率转换
        </CardTitle>
        <CardDescription>实时代币汇率计算</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 代币对选择 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">从</label>
              <select
                value={selectedPair.from}
                onChange={(e) => setSelectedPair(prev => ({ ...prev, from: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                {tokens.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">到</label>
              <select
                value={selectedPair.to}
                onChange={(e) => setSelectedPair(prev => ({ ...prev, to: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                {tokens.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 汇率显示 */}
          {exchangeRate && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">1 {exchangeRate.from} =</div>
                  <div className="text-xl font-bold">
                    {exchangeRate.rate.toFixed(6)} {exchangeRate.to}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">1 {exchangeRate.to} =</div>
                  <div className="text-xl font-bold">
                    {exchangeRate.inverseRate.toFixed(6)} {exchangeRate.from}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 价格历史图表 (简化版)
function PriceChart({ symbol }: { symbol: string }) {
  const { history } = usePriceHistory(symbol, '24h')
  
  if (history.length === 0) return null

  const minPrice = Math.min(...history.map(p => p.price))
  const maxPrice = Math.max(...history.map(p => p.price))
  const priceRange = maxPrice - minPrice

  return (
    <div className="h-32 w-full relative">
      <svg className="w-full h-full">
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={history.map((point, index) => {
            const x = (index / (history.length - 1)) * 100
            const y = 100 - ((point.price - minPrice) / priceRange) * 100
            return `${x},${y}`
          }).join(' ')}
        />
      </svg>
    </div>
  )
}

// 主要价格展示组件
export function PriceDisplay() {
  const { prices, isLoading, lastUpdated, refetch } = useAllTokenPrices()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d'>('24h')

  const handleRefresh = () => {
    refetch()
  }

  const lastUpdatedText = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString()
    : '未更新'

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">市场价格</h2>
          <p className="text-gray-600">Monad 测试网代币实时价格</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            最后更新: {lastUpdatedText}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prices">价格总览</TabsTrigger>
          <TabsTrigger value="rates">汇率转换</TabsTrigger>
          <TabsTrigger value="charts">价格图表</TabsTrigger>
        </TabsList>

        {/* 价格总览 */}
        <TabsContent value="prices" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(prices).map((tokenPrice) => (
                <TokenPriceCard
                  key={tokenPrice.symbol}
                  symbol={tokenPrice.symbol}
                  price={tokenPrice.price}
                  change={tokenPrice.priceChange24h}
                  volume={tokenPrice.volume24h}
                  marketCap={tokenPrice.marketCap}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 汇率转换 */}
        <TabsContent value="rates">
          <ExchangeRateDisplay />
        </TabsContent>

        {/* 价格图表 */}
        <TabsContent value="charts" className="space-y-4">
          <div className="flex gap-2 mb-4">
            {(['1h', '24h', '7d'] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(prices).map((symbol) => (
              <Card key={symbol}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{symbol}</span>
                    <Badge variant="outline">
                      ${prices[symbol]?.price.toFixed(2)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PriceChart symbol={symbol} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}