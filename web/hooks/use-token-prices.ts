"use client"

import { useState, useEffect, useCallback } from 'react'
import { useContractRead } from 'wagmi'
import { formatUnits } from 'viem'
import { SUPPORTED_TOKENS, CONTRACT_ADDRESSES } from '@/lib/config'

// Mock price oracle ABI (实际项目中应使用真实的价格预言机)
const PRICE_ORACLE_ABI = [
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getPrice",
    outputs: [{ name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" }
    ],
    name: "getExchangeRate",
    outputs: [{ name: "rate", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// 模拟价格数据 (测试网环境)
const MOCK_PRICES = {
  'WETH': 2500.00,
  'USDC': 1.00,
  'DAI': 0.999,
  'MON': 0.025, // Monad 原生代币价格
}

export interface TokenPrice {
  symbol: string
  address: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  lastUpdated: number
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
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockPrice = MOCK_PRICES[tokenSymbol as keyof typeof MOCK_PRICES] || 0
      const mockData: TokenPrice = {
        symbol: tokenSymbol,
        address: SUPPORTED_TOKENS.find(t => t.symbol === tokenSymbol)?.address || '',
        price: mockPrice,
        priceChange24h: (Math.random() - 0.5) * 10, // -5% to +5%
        volume24h: Math.random() * 1000000,
        marketCap: mockPrice * (Math.random() * 1000000 + 500000),
        lastUpdated: Date.now(),
      }
      
      setPrice(mockData)
    } catch (err) {
      setError('Failed to fetch price data')
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
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const allPrices: Record<string, TokenPrice> = {}
      
      // 获取所有支持代币的价格
      for (const token of SUPPORTED_TOKENS) {
        const mockPrice = MOCK_PRICES[token.symbol as keyof typeof MOCK_PRICES] || 0
        allPrices[token.symbol] = {
          symbol: token.symbol,
          address: token.address,
          price: mockPrice * (0.95 + Math.random() * 0.1), // 添加一些随机波动
          priceChange24h: (Math.random() - 0.5) * 10,
          volume24h: Math.random() * 1000000,
          marketCap: mockPrice * (Math.random() * 1000000 + 500000),
          lastUpdated: Date.now(),
        }
      }
      
      // 添加 MON (Monad 原生代币)
      allPrices['MON'] = {
        symbol: 'MON',
        address: '0x0000000000000000000000000000000000000000', // 原生代币
        price: MOCK_PRICES.MON * (0.95 + Math.random() * 0.1),
        priceChange24h: (Math.random() - 0.5) * 15, // 更高的波动性
        volume24h: Math.random() * 500000,
        marketCap: MOCK_PRICES.MON * (Math.random() * 10000000 + 5000000),
        lastUpdated: Date.now(),
      }
      
      setPrices(allPrices)
      setLastUpdated(Date.now())
    } catch (error) {
      console.error('Failed to fetch all prices:', error)
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