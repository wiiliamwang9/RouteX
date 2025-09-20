"use client"

import { ethers } from 'ethers'
import { MONAD_CONFIG, SUPPORTED_TOKENS, CONTRACT_ADDRESSES } from './config'

// ERC20 ABI for basic token operations
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)"
]

// Uniswap V2 Pair ABI for price fetching
const UNISWAP_V2_PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)"
]

// 模拟的流动性池地址 (在实际项目中应该从工厂合约或DEX聚合器获取)
const MOCK_PAIRS = {
  'WETH/USDC': '0x1234567890123456789012345678901234567890',
  'DAI/USDC': '0x2345678901234567890123456789012345678901',
  'WETH/DAI': '0x3456789012345678901234567890123456789012',
}

interface TokenPrice {
  symbol: string
  address: string
  price: number
  priceInUSD: number
  lastUpdated: number
  source: 'blockchain' | 'external' | 'calculated'
}

class MonadPriceOracle {
  private provider: ethers.JsonRpcProvider
  private cache: Map<string, TokenPrice> = new Map()
  private cacheExpiry: number = 30000 // 30 seconds cache

  constructor() {
    this.provider = new ethers.JsonRpcProvider(MONAD_CONFIG.rpcUrl)
  }

  /**
   * 从区块链获取代币价格
   */
  async getTokenPrice(tokenAddress: string, symbol: string): Promise<TokenPrice> {
    const cacheKey = `${tokenAddress}_${symbol}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.lastUpdated < this.cacheExpiry) {
      return cached
    }

    try {
      let price: number
      let source: 'blockchain' | 'external' | 'calculated' = 'calculated'

      // 根据代币类型使用不同的价格获取策略
      switch (symbol) {
        case 'USDC':
          // USDC 稳定币价格固定为 1 USD
          price = 1.0
          source = 'external'
          break
        
        case 'DAI':
          // DAI 稳定币价格接近 1 USD，可能有轻微波动
          price = await this.getStablecoinPrice('DAI') || 0.999
          source = 'calculated'
          break
        
        case 'WETH':
          // 从外部 API 获取 ETH 价格，或使用链上 DEX 价格
          price = await this.getETHPrice()
          source = 'external'
          break
        
        case 'MON':
          // Monad 原生代币价格 (可以从 DEX 计算或使用固定值)
          price = await this.getMonadPrice()
          source = 'calculated'
          break
        
        default:
          // 其他代币尝试从 DEX 获取价格
          price = await this.getDEXPrice(tokenAddress, symbol)
          source = 'blockchain'
      }

      const tokenPrice: TokenPrice = {
        symbol,
        address: tokenAddress,
        price,
        priceInUSD: price,
        lastUpdated: Date.now(),
        source
      }

      this.cache.set(cacheKey, tokenPrice)
      return tokenPrice
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error)
      
      // 返回缓存价格或默认价格
      if (cached) {
        return cached
      }
      
      return this.getDefaultPrice(symbol, tokenAddress)
    }
  }

  /**
   * 从外部 API 获取 ETH 价格
   */
  private async getETHPrice(): Promise<number> {
    try {
      // 使用免费的 CoinGecko API
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()
      return data.ethereum?.usd || 2500 // 默认值
    } catch (error) {
      console.warn('Failed to fetch ETH price from external API, using default:', error)
      return 2500 // 默认 ETH 价格
    }
  }

  /**
   * 获取稳定币价格
   */
  private async getStablecoinPrice(symbol: string): Promise<number> {
    try {
      const coinIds = {
        'DAI': 'dai',
        'USDC': 'usd-coin'
      }
      
      const coinId = coinIds[symbol as keyof typeof coinIds]
      if (!coinId) return 1.0

      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`)
      const data = await response.json()
      return data[coinId]?.usd || 1.0
    } catch (error) {
      console.warn(`Failed to fetch ${symbol} price, using default 1.0:`, error)
      return 1.0
    }
  }

  /**
   * 获取 Monad 原生代币价格
   */
  private async getMonadPrice(): Promise<number> {
    try {
      // 由于 Monad 是测试网，我们可以设置一个合理的测试价格
      // 在实际项目中，这里应该从 DEX 或预言机获取真实价格
      return 0.025 + (Math.random() - 0.5) * 0.005 // 0.02-0.03 范围的价格
    } catch (error) {
      return 0.025
    }
  }

  /**
   * 从 DEX 获取代币价格
   */
  private async getDEXPrice(tokenAddress: string, symbol: string): Promise<number> {
    try {
      // 这里应该实现从 Uniswap V2/V3 或其他 DEX 获取价格的逻辑
      // 由于这是测试网，我们使用模拟数据
      
      // 尝试通过 USDC 对计算价格
      const usdcAddress = SUPPORTED_TOKENS.find(t => t.symbol === 'USDC')?.address
      if (usdcAddress) {
        // 模拟从流动性池获取价格
        const mockPrice = await this.calculatePriceFromReserves(tokenAddress, usdcAddress)
        if (mockPrice > 0) {
          return mockPrice
        }
      }

      // 如果无法从 DEX 获取，返回默认价格
      return this.getDefaultPrice(symbol, tokenAddress).price
    } catch (error) {
      console.error(`Error fetching DEX price for ${symbol}:`, error)
      return this.getDefaultPrice(symbol, tokenAddress).price
    }
  }

  /**
   * 从流动性池储备计算价格
   */
  private async calculatePriceFromReserves(token0: string, token1: string): Promise<number> {
    try {
      // 在实际实现中，这里应该：
      // 1. 找到对应的流动性池地址
      // 2. 调用 getReserves() 获取储备
      // 3. 根据储备比例计算价格
      
      // 模拟价格计算
      const mockReserve0 = Math.random() * 1000000
      const mockReserve1 = Math.random() * 1000000
      
      return mockReserve1 / mockReserve0
    } catch (error) {
      return 0
    }
  }

  /**
   * 获取默认价格
   */
  private getDefaultPrice(symbol: string, address: string): TokenPrice {
    const defaultPrices: Record<string, number> = {
      'WETH': 2500,
      'USDC': 1.0,
      'DAI': 0.999,
      'MON': 0.025
    }

    return {
      symbol,
      address,
      price: defaultPrices[symbol] || 1.0,
      priceInUSD: defaultPrices[symbol] || 1.0,
      lastUpdated: Date.now(),
      source: 'external'
    }
  }

  /**
   * 获取所有支持代币的价格
   */
  async getAllTokenPrices(): Promise<Record<string, TokenPrice>> {
    const prices: Record<string, TokenPrice> = {}
    
    // 获取支持的代币价格
    for (const token of SUPPORTED_TOKENS) {
      try {
        prices[token.symbol] = await this.getTokenPrice(token.address, token.symbol)
      } catch (error) {
        console.error(`Failed to get price for ${token.symbol}:`, error)
        prices[token.symbol] = this.getDefaultPrice(token.symbol, token.address)
      }
    }

    // 添加 MON (原生代币)
    try {
      prices['MON'] = await this.getTokenPrice('0x0000000000000000000000000000000000000000', 'MON')
    } catch (error) {
      prices['MON'] = this.getDefaultPrice('MON', '0x0000000000000000000000000000000000000000')
    }

    return prices
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取代币的链上信息
   */
  async getTokenInfo(address: string): Promise<{
    symbol: string
    decimals: number
    totalSupply: string
  } | null> {
    try {
      const contract = new ethers.Contract(address, ERC20_ABI, this.provider)
      
      const [symbol, decimals, totalSupply] = await Promise.all([
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ])

      return {
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals)
      }
    } catch (error) {
      console.error(`Error fetching token info for ${address}:`, error)
      return null
    }
  }
}

// 导出单例实例
export const priceOracle = new MonadPriceOracle()

// 导出类型
export type { TokenPrice }