import { ethers, JsonRpcProvider, Contract } from "ethers"
import { MONAD_CONFIG, CONTRACT_ADDRESSES, SUPPORTED_TOKENS } from "./config"
import { ROUTER_DEFENSE_ABI, TRADER_AGENT_ABI } from "./contract-abis"

export interface PriceData {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  lastUpdated: number
}

export interface LiquidityPool {
  address: string
  token0: string
  token1: string
  reserve0: string
  reserve1: string
  totalSupply: string
  fee: number
}

export interface OnChainOrder {
  id: string
  user: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut?: string
  status: number
  blockNumber: number
  timestamp: number
  txHash: string
}

class MonadDataProvider {
  private provider: JsonRpcProvider
  private routerContract: Contract | null = null
  private traderAgentContract: Contract | null = null

  constructor() {
    // TODO: Replace with actual Monad RPC URL
    this.provider = new JsonRpcProvider(MONAD_CONFIG.rpcUrl)
    this.initializeContracts()
  }

  private initializeContracts() {
    try {
      if (CONTRACT_ADDRESSES.ROUTER_DEFENSE !== "0x0000000000000000000000000000000000000000") {
        this.routerContract = new Contract(CONTRACT_ADDRESSES.ROUTER_DEFENSE, ROUTER_DEFENSE_ABI, this.provider)
      }

      if (CONTRACT_ADDRESSES.TRADER_AGENT !== "0x0000000000000000000000000000000000000000") {
        this.traderAgentContract = new Contract(CONTRACT_ADDRESSES.TRADER_AGENT, TRADER_AGENT_ABI, this.provider)
      }
    } catch (error) {
      console.error("Failed to initialize contracts:", error)
    }
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      // TODO: Replace with actual price oracle or DEX price calculation
      if (!this.routerContract) {
        // Mock prices for demonstration
        const mockPrices: Record<string, number> = {
          ETH: 2000 + Math.random() * 200 - 100,
          USDC: 1 + Math.random() * 0.02 - 0.01,
          DAI: 1 + Math.random() * 0.02 - 0.01,
        }

        const token = SUPPORTED_TOKENS.find((t) => t.address === tokenAddress)
        return mockPrices[token?.symbol || "ETH"] || 1
      }

      // Example: Get price from DEX reserves
      // const amountOut = await this.routerContract.getAmountsOut(
      //   ethers.parseEther("1"),
      //   [tokenAddress, USDC_ADDRESS]
      // );
      // return parseFloat(ethers.formatUnits(amountOut[1], 6));

      return 1 // Placeholder
    } catch (error) {
      console.error("Failed to get token price:", error)
      return 0
    }
  }

  async getOptimalRoute(tokenIn: string, tokenOut: string, amountIn: string): Promise<string[]> {
    try {
      // TODO: Implement actual routing algorithm
      // This would typically:
      // 1. Query all available liquidity pools
      // 2. Calculate optimal path using algorithms like Dijkstra
      // 3. Consider gas costs and price impact
      // 4. Return the most efficient route

      // Mock routing logic
      if (tokenIn === tokenOut) return [tokenIn]

      const tokenInSymbol = SUPPORTED_TOKENS.find((t) => t.address === tokenIn)?.symbol
      const tokenOutSymbol = SUPPORTED_TOKENS.find((t) => t.address === tokenOut)?.symbol

      // Direct route if both tokens are major
      if (
        (tokenInSymbol === "ETH" && tokenOutSymbol === "USDC") ||
        (tokenInSymbol === "USDC" && tokenOutSymbol === "ETH")
      ) {
        return [tokenInSymbol!, tokenOutSymbol!]
      }

      // Route through ETH for other pairs
      if (tokenInSymbol !== "ETH" && tokenOutSymbol !== "ETH") {
        return [tokenInSymbol!, "ETH", tokenOutSymbol!]
      }

      return [tokenInSymbol!, tokenOutSymbol!]
    } catch (error) {
      console.error("Failed to get optimal route:", error)
      return [tokenIn, tokenOut]
    }
  }

  async getLiquidityPools(): Promise<LiquidityPool[]> {
    try {
      // TODO: Query actual liquidity pools from Monad chain
      // This would typically call factory contracts to get all pairs

      // Mock liquidity pools
      return [
        {
          address: "0x1111111111111111111111111111111111111111",
          token0: SUPPORTED_TOKENS[0].address,
          token1: SUPPORTED_TOKENS[1].address,
          reserve0: ethers.parseEther("1000").toString(),
          reserve1: ethers.parseUnits("2000000", 6).toString(),
          totalSupply: ethers.parseEther("44721").toString(),
          fee: 0.003,
        },
        {
          address: "0x2222222222222222222222222222222222222222",
          token0: SUPPORTED_TOKENS[1].address,
          token1: SUPPORTED_TOKENS[2].address,
          reserve0: ethers.parseUnits("1000000", 6).toString(),
          reserve1: ethers.parseEther("1000").toString(),
          totalSupply: ethers.parseEther("31622").toString(),
          fee: 0.003,
        },
      ]
    } catch (error) {
      console.error("Failed to get liquidity pools:", error)
      return []
    }
  }

  async getUserOrders(userAddress: string): Promise<OnChainOrder[]> {
    try {
      if (!this.traderAgentContract) {
        // Mock order history
        return [
          {
            id: "1",
            user: userAddress,
            tokenIn: SUPPORTED_TOKENS[0].address,
            tokenOut: SUPPORTED_TOKENS[1].address,
            amountIn: ethers.parseEther("1").toString(),
            amountOut: ethers.parseUnits("2000", 6).toString(),
            status: 1, // Filled
            blockNumber: 12345678,
            timestamp: Date.now() - 3600000,
            txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          },
        ]
      }

      // TODO: Query actual user orders from contract
      // const orders = await this.traderAgentContract.getUserOrders(userAddress);
      // return orders.map(order => ({
      //   id: order.id.toString(),
      //   user: order.user,
      //   tokenIn: order.tokenIn,
      //   tokenOut: order.tokenOut,
      //   amountIn: order.amountIn.toString(),
      //   amountOut: order.amountOut?.toString(),
      //   status: order.status,
      //   blockNumber: order.blockNumber,
      //   timestamp: order.timestamp * 1000,
      //   txHash: order.txHash
      // }));

      return []
    } catch (error) {
      console.error("Failed to get user orders:", error)
      return []
    }
  }

  async estimateGas(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    route: string[],
  ): Promise<{ gasLimit: string; gasPrice: string; totalCost: string }> {
    try {
      // TODO: Estimate actual gas costs
      const gasPrice = await this.provider.getFeeData()
      const estimatedGasLimit = route.length > 2 ? "150000" : "100000" // More gas for multi-hop

      const gasPriceBigInt = gasPrice.gasPrice || ethers.parseUnits("20", "gwei")
      const totalCost = gasPriceBigInt * BigInt(estimatedGasLimit)

      return {
        gasLimit: estimatedGasLimit,
        gasPrice: ethers.formatUnits(gasPriceBigInt, "gwei"),
        totalCost: ethers.formatEther(totalCost),
      }
    } catch (error) {
      console.error("Failed to estimate gas:", error)
      return {
        gasLimit: "100000",
        gasPrice: "20",
        totalCost: "0.002",
      }
    }
  }

  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber()
    } catch (error) {
      console.error("Failed to get block number:", error)
      return 0
    }
  }
}

// External price data provider (for additional price feeds)
class ExternalPriceProvider {
  private baseUrl: string

  constructor() {
    // TODO: Replace with actual price API endpoint
    this.baseUrl = "https://api.coingecko.com/api/v3"
  }

  async getTokenPrices(tokenIds: string[]): Promise<Record<string, PriceData>> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(
      //   `${this.baseUrl}/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
      // );
      // const data = await response.json();

      // Mock price data
      const mockData: Record<string, PriceData> = {
        ethereum: {
          symbol: "ETH",
          price: 2000 + Math.random() * 200 - 100,
          change24h: Math.random() * 10 - 5,
          volume24h: 1000000000 + Math.random() * 500000000,
          lastUpdated: Date.now(),
        },
        "usd-coin": {
          symbol: "USDC",
          price: 1 + Math.random() * 0.02 - 0.01,
          change24h: Math.random() * 0.5 - 0.25,
          volume24h: 500000000 + Math.random() * 200000000,
          lastUpdated: Date.now(),
        },
        dai: {
          symbol: "DAI",
          price: 1 + Math.random() * 0.02 - 0.01,
          change24h: Math.random() * 0.5 - 0.25,
          volume24h: 300000000 + Math.random() * 100000000,
          lastUpdated: Date.now(),
        },
      }

      return mockData
    } catch (error) {
      console.error("Failed to fetch external prices:", error)
      return {}
    }
  }

  async getHistoricalPrices(tokenId: string, days: number): Promise<Array<[number, number]>> {
    try {
      // TODO: Implement actual historical price fetching
      // Mock historical data
      const now = Date.now()
      const dayMs = 24 * 60 * 60 * 1000
      const basePrice = 2000

      return Array.from({ length: days }, (_, i) => [
        now - (days - i) * dayMs,
        basePrice + Math.sin(i * 0.1) * 100 + Math.random() * 50 - 25,
      ])
    } catch (error) {
      console.error("Failed to fetch historical prices:", error)
      return []
    }
  }
}

// Singleton instances
export const monadDataProvider = new MonadDataProvider()
export const externalPriceProvider = new ExternalPriceProvider()

// Utility functions
export const formatPrice = (price: number, decimals = 2): string => {
  if (price < 0.01) {
    return price.toFixed(6)
  } else if (price < 1) {
    return price.toFixed(4)
  } else {
    return price.toFixed(decimals)
  }
}

export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`
  } else if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`
  } else if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`
  } else {
    return `$${volume.toFixed(2)}`
  }
}

export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? "+" : ""
  return `${sign}${percentage.toFixed(2)}%`
}
