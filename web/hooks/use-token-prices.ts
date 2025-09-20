"use client"

import { useState, useEffect, useCallback } from 'react'
import { SUPPORTED_TOKENS } from '@/lib/config'
import { priceOracle, type TokenPrice as OracleTokenPrice } from '@/lib/price-oracle'

export interface TokenPrice {
  symbol: string
  address: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  lastUpdated: number
  source?: 'blockchain' | 'external' | 'calculated'
}

export interface ExchangeRate {
  from: string
  to: string
  rate: number
  inverseRate: number
}

/**
 * 获取单个代币价格
 */
export function useTokenPrice(tokenSymbol?: string) {
  const [price, setPrice] = useState<TokenPrice | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = useCallback(async () => {
    if (!tokenSymbol) return

    setIsLoading(true)
    setError(null)

    try {
      // 从配置中获取代币地址
      const tokenConfig = SUPPORTED_TOKENS.find(t => t.symbol === tokenSymbol)
      const tokenAddress = tokenConfig?.address || '0x0000000000000000000000000000000000000000'
      
      // 使用价格预言机获取真实价格
      const oraclePrice = await priceOracle.getTokenPrice(tokenAddress, tokenSymbol)
      
      // 转换为我们的 TokenPrice 格式，添加模拟的市场数据
      const tokenPrice: TokenPrice = {
        symbol: tokenSymbol,
        address: tokenAddress,
        price: oraclePrice.priceInUSD,
        priceChange24h: (Math.random() - 0.5) * 10, // -5% to +5% (模拟24h变化)
        volume24h: Math.random() * 1000000, // 模拟交易量
        marketCap: oraclePrice.priceInUSD * (Math.random() * 1000000 + 500000), // 模拟市值
        lastUpdated: oraclePrice.lastUpdated,
        source: oraclePrice.source,
      }
      
      setPrice(tokenPrice)
    } catch (err) {
      setError('Failed to fetch price data from blockchain')
      console.error('Price fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tokenSymbol])

  useEffect(() => {
    fetchPrice()
    
    // 每30秒更新价格
    const interval = setInterval(fetchPrice, 30000)
    return () => clearInterval(interval)
  }, [fetchPrice])

  return {
    price,
    isLoading,
    error,
    refetch: fetchPrice,
  }
}

/**
 * 获取所有支持代币的价格
 */
export function useAllTokenPrices() {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number>(0)

  const fetchAllPrices = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // 使用价格预言机获取所有代币的真实价格
      const oraclePrices = await priceOracle.getAllTokenPrices()
      
      const allPrices: Record<string, TokenPrice> = {}
      
      // 转换预言机价格为我们的格式
      Object.entries(oraclePrices).forEach(([symbol, oraclePrice]) => {
        allPrices[symbol] = {
          symbol: oraclePrice.symbol,
          address: oraclePrice.address,
          price: oraclePrice.priceInUSD,
          priceChange24h: (Math.random() - 0.5) * 10, // 模拟24h变化
          volume24h: Math.random() * 1000000, // 模拟交易量
          marketCap: oraclePrice.priceInUSD * (Math.random() * 1000000 + 500000), // 模拟市值
          lastUpdated: oraclePrice.lastUpdated,
          source: oraclePrice.source,
        }
      })
      
      setPrices(allPrices)
      setLastUpdated(Date.now())
      
      console.log('📊 Updated token prices from blockchain:', allPrices)
    } catch (error) {
      console.error('Failed to fetch prices from oracle:', error)
      
      // 如果预言机失败，使用默认价格
      const fallbackPrices: Record<string, TokenPrice> = {
        'WETH': {
          symbol: 'WETH',
          address: SUPPORTED_TOKENS.find(t => t.symbol === 'WETH')?.address || '',
          price: 2500,
          priceChange24h: (Math.random() - 0.5) * 10,
          volume24h: Math.random() * 1000000,
          marketCap: 2500 * 1000000,
          lastUpdated: Date.now(),
          source: 'external'
        },
        'USDC': {
          symbol: 'USDC',
          address: SUPPORTED_TOKENS.find(t => t.symbol === 'USDC')?.address || '',
          price: 1.0,
          priceChange24h: (Math.random() - 0.5) * 2,
          volume24h: Math.random() * 1000000,
          marketCap: 1.0 * 1000000,
          lastUpdated: Date.now(),
          source: 'external'
        },
        'DAI': {
          symbol: 'DAI',
          address: SUPPORTED_TOKENS.find(t => t.symbol === 'DAI')?.address || '',
          price: 0.999,
          priceChange24h: (Math.random() - 0.5) * 2,
          volume24h: Math.random() * 1000000,
          marketCap: 0.999 * 1000000,
          lastUpdated: Date.now(),
          source: 'external'
        },
        'MON': {
          symbol: 'MON',
          address: '0x0000000000000000000000000000000000000000',
          price: 0.025,
          priceChange24h: (Math.random() - 0.5) * 15,
          volume24h: Math.random() * 500000,
          marketCap: 0.025 * 5000000,
          lastUpdated: Date.now(),
          source: 'calculated'
        }
      }
      
      setPrices(fallbackPrices)
      setLastUpdated(Date.now())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllPrices()
    
    // 每60秒更新所有价格
    const interval = setInterval(fetchAllPrices, 60000)
    return () => clearInterval(interval)
  }, [fetchAllPrices])

  return {
    prices,
    isLoading,
    lastUpdated,
    refetch: fetchAllPrices,
  }
}

/**
 * 获取代币对汇率
 */
export function useExchangeRate(fromToken?: string, toToken?: string) {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const { prices } = useAllTokenPrices()

  useEffect(() => {
    if (!fromToken || !toToken || !prices[fromToken] || !prices[toToken]) {
      setExchangeRate(null)
      return
    }

    const fromPrice = prices[fromToken].price
    const toPrice = prices[toToken].price
    
    if (fromPrice > 0 && toPrice > 0) {
      const rate = fromPrice / toPrice
      setExchangeRate({
        from: fromToken,
        to: toToken,
        rate,
        inverseRate: 1 / rate,
      })
    }
  }, [fromToken, toToken, prices])

  return { exchangeRate }
}

/**
 * 计算投资组合总价值
 */
export function usePortfolioValue(balances: Record<string, string>) {
  const { prices } = useAllTokenPrices()
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [breakdown, setBreakdown] = useState<Record<string, number>>({})

  useEffect(() => {
    let totalValue = 0
    const valueBreakdown: Record<string, number> = {}

    Object.entries(balances).forEach(([symbol, balance]) => {
      const price = prices[symbol]?.price || 0
      const balanceNum = parseFloat(balance) || 0
      const value = balanceNum * price
      
      valueBreakdown[symbol] = value
      totalValue += value
    })

    setPortfolioValue(totalValue)
    setBreakdown(valueBreakdown)
  }, [balances, prices])

  return {
    totalValue: portfolioValue,
    breakdown,
    formattedValue: portfolioValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  }
}

/**
 * 价格变化指示器组件数据
 */
export function usePriceIndicator(symbol: string) {
  const { price } = useTokenPrice(symbol)
  
  if (!price) return null

  const isPositive = price.priceChange24h >= 0
  const percentage = Math.abs(price.priceChange24h)

  return {
    price: price.price,
    change: price.priceChange24h,
    changePercent: percentage,
    isPositive,
    formattedPrice: price.price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price.price < 1 ? 6 : 2,
      maximumFractionDigits: price.price < 1 ? 6 : 2,
    }),
    formattedChange: `${isPositive ? '+' : '-'}${percentage.toFixed(2)}%`,
  }
}

/**
 * 获取历史价格数据 (用于图表)
 */
export function usePriceHistory(symbol: string, timeframe: '1h' | '24h' | '7d' = '24h') {
  const [history, setHistory] = useState<Array<{ timestamp: number; price: number }>>([])
  const { price } = useTokenPrice(symbol)

  useEffect(() => {
    if (!price) return

    // 生成模拟历史数据
    const generateHistory = () => {
      const points = timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : 7
      const interval = timeframe === '1h' ? 60000 : timeframe === '24h' ? 3600000 : 86400000
      
      const data = []
      const currentPrice = price.price
      let lastPrice = currentPrice

      for (let i = points; i >= 0; i--) {
        const timestamp = Date.now() - (i * interval)
        // 添加一些随机波动
        const volatility = 0.02 // 2%的波动性
        const change = (Math.random() - 0.5) * volatility
        lastPrice = lastPrice * (1 + change)
        
        data.push({
          timestamp,
          price: Math.max(0, lastPrice),
        })
      }

      return data
    }

    setHistory(generateHistory())
  }, [symbol, timeframe, price])

  return { history }
}