# 🔗 RouteX 智能合约接口文档

## 📋 概述

本文档提供了RouteX Web前端与智能合约交互的完整指南，包括合约地址、ABI接口、调用方法和代码示例。

## 🌐 网络配置

### Monad 测试网配置
```typescript
export const MONAD_TESTNET_CONFIG = {
  chainId: 10143,
  chainName: "Monad Testnet",
  rpcUrl: "https://testnet-rpc.monad.xyz/",
  nativeCurrency: {
    name: "MON",
    symbol: "MON", 
    decimals: 18,
  },
  blockExplorerUrl: "https://testnet.monadexplorer.com",
}
```

## 📍 合约地址

### 核心合约地址 (Monad Testnet)
```typescript
export const CONTRACT_ADDRESSES = {
  // 核心交易合约
  TRADER_AGENT: "0x7267749E1Fa24Cae44e1B76Ec90F3B2f98D2C290",
  ROUTER_DEFENSE: "0x458Ec2Bc6E645ccd8f98599D6E4d942ea480ca16", 
  CROSSCHAIN_ROUTER: "0x22A8C0BD01f88D3461c98E9bc3399A83dDBB9Cee",
  AI_STRATEGY_OPTIMIZER: "0xc6aF426FC11BFb6d46ffaB9A57c30ab5437AA09C",
  QUANTGUARD_PRO: "0xb10a0b0f6282024D5c3b5256CB312D06177cF4ab",
  
  // 外部合约
  UNISWAP_ROUTER: "0x4c4eABd5Fb1D1A7234A48692551eAECFF8194CA7",
  WETH: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
  USDC: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea", 
  DAI: "0xA3dbBD3887228aE84f08bE839f9e20485759a004"
} as const;
```

### 代币配置
```typescript
export const SUPPORTED_TOKENS = [
  {
    symbol: "WETH",
    name: "Wrapped Ethereum", 
    address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
    decimals: 18,
    logoUrl: "/ethereum-logo.png",
  },
  {
    symbol: "USDC", 
    name: "USD Coin",
    address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    decimals: 6,
    logoUrl: "/usdc-logo.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin", 
    address: "0xA3dbBD3887228aE84f08bE839f9e20485759a004",
    decimals: 18,
    logoUrl: "/dai-logo.png",
  },
] as const;
```

---

## 🤖 1. TraderAgent 合约接口

### 功能概述
TraderAgent是高频交易执行引擎，支持市价单、限价单和批量交易。

### 主要方法

#### 🔄 executeOrder - 执行市价单
```typescript
// 函数签名
function executeOrder(
  address tokenIn,      // 输入代币地址
  address tokenOut,     // 输出代币地址  
  uint256 amountIn,     // 输入数量
  uint256 amountOutMin, // 最小输出数量
  address[] path,       // 交易路径
  uint256 deadline      // 截止时间
) external returns (uint256[] amounts)

// 前端调用示例
import { useContractWrite } from 'wagmi'
import { TRADER_AGENT_ABI, CONTRACT_ADDRESSES } from '@/lib/contract-abis'

export function useExecuteOrder() {
  const { write: executeOrder } = useContractWrite({
    address: CONTRACT_ADDRESSES.TRADER_AGENT,
    abi: TRADER_AGENT_ABI,
    functionName: 'executeOrder',
  })

  const handleExecuteOrder = async (
    tokenIn: string,
    tokenOut: string, 
    amountIn: bigint,
    amountOutMin: bigint,
    slippage: number = 0.5
  ) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200) // 20分钟后过期
    const path = [tokenIn, tokenOut] // 直接路径
    
    try {
      await executeOrder({
        args: [tokenIn, tokenOut, amountIn, amountOutMin, path, deadline]
      })
    } catch (error) {
      console.error('交易执行失败:', error)
      throw error
    }
  }

  return { executeOrder: handleExecuteOrder }
}
```

#### 📋 placeLimitOrder - 创建限价单
```typescript
// 函数签名  
function placeLimitOrder(
  address tokenIn,
  address tokenOut,
  uint256 amountIn,
  uint256 targetPrice,
  uint256 deadline,
  bool isLong
) external returns (uint256 orderId)

// 前端调用示例
export function usePlaceLimitOrder() {
  const { write: placeLimitOrder } = useContractWrite({
    address: CONTRACT_ADDRESSES.TRADER_AGENT,
    abi: TRADER_AGENT_ABI,
    functionName: 'placeLimitOrder',
  })

  const handlePlaceLimitOrder = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    targetPrice: bigint,
    isLong: boolean = true
  ) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400) // 24小时后过期
    
    try {
      const result = await placeLimitOrder({
        args: [tokenIn, tokenOut, amountIn, targetPrice, deadline, isLong]
      })
      return result
    } catch (error) {
      console.error('限价单创建失败:', error)
      throw error
    }
  }

  return { placeLimitOrder: handlePlaceLimitOrder }
}
```

#### 📊 getUserOrders - 获取用户订单
```typescript
// 函数签名
function getUserOrders(address user) 
  external view returns (Order[] orders)

// 前端调用示例  
import { useContractRead } from 'wagmi'

export function useUserOrders(userAddress?: string) {
  const { data: orders, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.TRADER_AGENT,
    abi: TRADER_AGENT_ABI,
    functionName: 'getUserOrders',
    args: [userAddress],
    enabled: !!userAddress,
    watch: true, // 实时监听
  })

  return {
    orders: orders || [],
    isLoading,
  }
}
```

---

## 🛡️ 2. RouterDefense 合约接口

### 功能概述
RouterDefense提供MEV保护和智能路由功能，使用commit-reveal机制防止抢跑。

### 主要方法

#### 🔐 protectedSwap - 受保护的交易
```typescript
// 函数签名
function protectedSwap(
  address tokenIn,
  address tokenOut, 
  uint256 amountIn,
  uint256 amountOutMin,
  bytes32 commitment,
  uint256 deadline
) external returns (uint256 amountOut)

// 前端调用示例
import { keccak256, encodePacked } from 'viem'

export function useProtectedSwap() {
  const { write: protectedSwap } = useContractWrite({
    address: CONTRACT_ADDRESSES.ROUTER_DEFENSE,
    abi: ROUTER_DEFENSE_ABI,
    functionName: 'protectedSwap',
  })

  const handleProtectedSwap = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOutMin: bigint
  ) => {
    // 生成随机数和承诺
    const nonce = BigInt(Math.floor(Math.random() * 1000000))
    const commitment = keccak256(
      encodePacked(
        ['address', 'address', 'uint256', 'uint256', 'uint256'],
        [tokenIn, tokenOut, amountIn, amountOutMin, nonce]
      )
    )
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
    
    try {
      // 1. 提交承诺
      await protectedSwap({
        args: [tokenIn, tokenOut, amountIn, amountOutMin, commitment, deadline]
      })
      
      // 2. 等待一个区块后reveal (在实际实现中)
      // await revealAndExecute({ args: [tokenIn, tokenOut, amountIn, amountOutMin, nonce] })
      
    } catch (error) {
      console.error('受保护交易失败:', error)
      throw error
    }
  }

  return { protectedSwap: handleProtectedSwap }
}
```

#### 💰 getOptimalRoute - 获取最优路径
```typescript
// 函数签名
function getOptimalRoute(
  address tokenIn,
  address tokenOut,
  uint256 amountIn
) external view returns (
  address[] path,
  uint256 expectedAmountOut, 
  uint256 priceImpact
)

// 前端调用示例
export function useOptimalRoute(
  tokenIn?: string,
  tokenOut?: string, 
  amountIn?: bigint
) {
  const { data: routeData, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.ROUTER_DEFENSE,
    abi: ROUTER_DEFENSE_ABI,
    functionName: 'getOptimalRoute',
    args: [tokenIn, tokenOut, amountIn],
    enabled: !!(tokenIn && tokenOut && amountIn),
  })

  return {
    path: routeData?.[0] || [],
    expectedAmountOut: routeData?.[1] || 0n,
    priceImpact: routeData?.[2] || 0n,
    isLoading,
  }
}
```

---

## 🌉 3. CrossChainRouter 合约接口

### 功能概述
CrossChainRouter处理跨链交易，支持多种桥接协议。

### 主要方法

#### 🔄 initiateCrossChainSwap - 发起跨链交换
```typescript
// 函数签名
function initiateCrossChainSwap(
  uint256 targetChainId,
  address tokenIn,
  address tokenOut,
  uint256 amountIn,
  address recipient,
  bytes bridgeData
) external payable returns (bytes32 transferId)

// 前端调用示例
export function useCrossChainSwap() {
  const { write: initiateCrossChainSwap } = useContractWrite({
    address: CONTRACT_ADDRESSES.CROSSCHAIN_ROUTER,
    abi: CROSSCHAIN_ROUTER_ABI,
    functionName: 'initiateCrossChainSwap',
  })

  const handleCrossChainSwap = async (
    targetChainId: number,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    recipient: string
  ) => {
    try {
      // 获取桥接数据 (实际应用中从桥接API获取)
      const bridgeData = '0x' // LayerZero/Axelar 桥接参数
      
      const result = await initiateCrossChainSwap({
        args: [BigInt(targetChainId), tokenIn, tokenOut, amountIn, recipient, bridgeData],
        value: parseEther('0.01'), // 桥接费用
      })
      
      return result
    } catch (error) {
      console.error('跨链交易失败:', error)
      throw error
    }
  }

  return { initiateCrossChainSwap: handleCrossChainSwap }
}
```

#### 📊 getOptimalBridge - 获取最优桥接
```typescript
// 函数签名
function getOptimalBridge(
  uint256 targetChainId,
  address token,
  uint256 amount
) external view returns (
  uint8 bridgeType,
  uint256 estimatedTime,
  uint256 bridgeFee
)

// 前端调用示例
export function useOptimalBridge(
  targetChainId?: number,
  token?: string,
  amount?: bigint
) {
  const { data: bridgeData } = useContractRead({
    address: CONTRACT_ADDRESSES.CROSSCHAIN_ROUTER,
    abi: CROSSCHAIN_ROUTER_ABI,
    functionName: 'getOptimalBridge',
    args: [BigInt(targetChainId || 0), token, amount],
    enabled: !!(targetChainId && token && amount),
  })

  return {
    bridgeType: bridgeData?.[0] || 0,
    estimatedTime: bridgeData?.[1] || 0n,
    bridgeFee: bridgeData?.[2] || 0n,
  }
}
```

---

## 🤖 4. AIStrategyOptimizer 合约接口

### 功能概述
AI策略优化器提供链上AI推荐和风险评估。

### 主要方法

#### 🎯 getOptimalRoute - AI路径优化
```typescript
// 函数签名
function getOptimalRoute(
  address tokenIn,
  address tokenOut,
  uint256 amountIn,
  uint8 riskTolerance
) external view returns (
  address[] optimizedPath,
  uint256 expectedReturn,
  uint8 confidenceScore
)

// 前端调用示例
export function useAIRouteOptimization() {
  const [recommendation, setRecommendation] = useState<any>(null)
  
  const { data: aiRoute } = useContractRead({
    address: CONTRACT_ADDRESSES.AI_STRATEGY_OPTIMIZER,
    abi: AI_STRATEGY_OPTIMIZER_ABI,
    functionName: 'getOptimalRoute',
    args: [tokenIn, tokenOut, amountIn, riskTolerance],
    enabled: !!(tokenIn && tokenOut && amountIn),
  })

  useEffect(() => {
    if (aiRoute) {
      setRecommendation({
        path: aiRoute[0],
        expectedReturn: aiRoute[1], 
        confidence: aiRoute[2]
      })
    }
  }, [aiRoute])

  return { recommendation, isLoading: !aiRoute }
}
```

#### ⚠️ assessRisk - AI风险评估
```typescript
// 函数签名
function assessRisk(
  address tokenIn,
  address tokenOut,
  uint256 amountIn
) external view returns (
  uint8 riskLevel,      // 0=低, 1=中, 2=高
  uint256 volatilityScore,
  string[] warnings
)

// 前端调用示例
export function useAIRiskAssessment(
  tokenIn?: string,
  tokenOut?: string,
  amountIn?: bigint
) {
  const { data: riskData, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.AI_STRATEGY_OPTIMIZER,
    abi: AI_STRATEGY_OPTIMIZER_ABI,
    functionName: 'assessRisk',
    args: [tokenIn, tokenOut, amountIn],
    enabled: !!(tokenIn && tokenOut && amountIn),
  })

  const riskLevel = riskData?.[0] ? 
    ['低', '中', '高'][riskData[0]] : 
    '未知'

  return {
    riskLevel,
    volatilityScore: riskData?.[1] || 0n,
    warnings: riskData?.[2] || [],
    isLoading,
  }
}
```

---

## 💼 5. QuantGuardPro 合约接口

### 功能概述
QuantGuardPro提供完整的策略生命周期管理。

### 主要方法

#### 🎯 createStrategy - 创建策略
```typescript
// 函数签名
function createStrategy(
  uint8 strategyType,    // 0=套利, 1=网格, 2=DCA, 3=动量
  bytes strategyParams,  // 策略参数
  uint256 initialCapital,
  uint256 maxRisk
) external returns (uint256 strategyId)

// 前端调用示例
import { encodePacked } from 'viem'

export function useCreateStrategy() {
  const { write: createStrategy } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'createStrategy',
  })

  const handleCreateStrategy = async (
    strategyType: number,
    parameters: {
      targetPrice?: bigint
      gridLevels?: number
      dcaInterval?: number
      stopLoss?: bigint
      takeProfit?: bigint
    },
    initialCapital: bigint,
    maxRisk: bigint
  ) => {
    try {
      // 编码策略参数
      const strategyParams = encodePacked(
        ['uint256', 'uint8', 'uint256', 'uint256', 'uint256'],
        [
          parameters.targetPrice || 0n,
          parameters.gridLevels || 0,
          parameters.dcaInterval || 0,
          parameters.stopLoss || 0n,
          parameters.takeProfit || 0n
        ]
      )
      
      const result = await createStrategy({
        args: [strategyType, strategyParams, initialCapital, maxRisk]
      })
      
      return result
    } catch (error) {
      console.error('策略创建失败:', error)
      throw error
    }
  }

  return { createStrategy: handleCreateStrategy }
}
```

#### 🎮 executeStrategy - 执行策略
```typescript
// 函数签名
function executeStrategy(uint256 strategyId) external

// 前端调用示例
export function useExecuteStrategy() {
  const { write: executeStrategy } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'executeStrategy',
  })

  return { executeStrategy }
}
```

#### 📊 getStrategyPerformance - 获取策略表现
```typescript
// 函数签名
function getStrategyPerformance(uint256 strategyId)
  external view returns (
    uint256 totalReturn,
    uint256 sharpeRatio,
    uint256 maxDrawdown,
    uint256 winRate
  )

// 前端调用示例
export function useStrategyPerformance(strategyId?: bigint) {
  const { data: performance, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'getStrategyPerformance',
    args: [strategyId],
    enabled: !!strategyId,
    watch: true,
  })

  return {
    totalReturn: performance?.[0] || 0n,
    sharpeRatio: performance?.[1] || 0n,
    maxDrawdown: performance?.[2] || 0n,
    winRate: performance?.[3] || 0n,
    isLoading,
  }
}
```

---

## 🔧 实用工具函数

### 1. 金额格式化
```typescript
import { formatUnits, parseUnits } from 'viem'

// 格式化代币金额显示
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  precision: number = 6
): string {
  const formatted = formatUnits(amount, decimals)
  return parseFloat(formatted).toFixed(precision)
}

// 解析用户输入金额
export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  if (!amount || isNaN(Number(amount))) return 0n
  return parseUnits(amount, decimals)
}
```

### 2. 滑点计算
```typescript
// 计算最小输出金额 (考虑滑点)
export function calculateAmountOutMin(
  expectedAmountOut: bigint,
  slippagePercent: number = 0.5
): bigint {
  const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100))
  return (expectedAmountOut * slippageMultiplier) / 10000n
}

// 计算价格影响
export function calculatePriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  inputPrice: bigint,
  outputPrice: bigint
): number {
  // 价格影响计算逻辑
  const expectedOutput = (inputAmount * inputPrice) / outputPrice
  const actualOutput = outputAmount
  const impact = ((expectedOutput - actualOutput) * 10000n) / expectedOutput
  return Number(impact) / 100
}
```

### 3. 交易状态监控
```typescript
import { useWaitForTransaction } from 'wagmi'

export function useTransactionMonitor(hash?: `0x${string}`) {
  const { 
    data: receipt, 
    isLoading, 
    isSuccess, 
    isError 
  } = useWaitForTransaction({
    hash,
    enabled: !!hash,
  })

  return {
    receipt,
    isLoading,
    isSuccess,
    isError,
    status: isLoading ? '确认中' : 
            isSuccess ? '成功' : 
            isError ? '失败' : '待处理'
  }
}
```

---

## 📱 完整组件示例

### 智能交易组件
```tsx
// components/SmartTrading.tsx
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { 
  useExecuteOrder,
  useAIRouteOptimization,
  useAIRiskAssessment,
  useTransactionMonitor
} from '@/hooks/contracts'

export function SmartTrading() {
  const { address } = useAccount()
  const [tokenIn, setTokenIn] = useState(SUPPORTED_TOKENS[0])
  const [tokenOut, setTokenOut] = useState(SUPPORTED_TOKENS[1])
  const [amountIn, setAmountIn] = useState('')
  const [txHash, setTxHash] = useState<`0x${string}`>()

  const { executeOrder } = useExecuteOrder()
  const { recommendation } = useAIRouteOptimization(
    tokenIn.address,
    tokenOut.address,
    parseTokenAmount(amountIn, tokenIn.decimals)
  )
  const { riskLevel } = useAIRiskAssessment(
    tokenIn.address,
    tokenOut.address,
    parseTokenAmount(amountIn, tokenIn.decimals)
  )
  const { status } = useTransactionMonitor(txHash)

  const handleSmartTrade = async () => {
    if (!address || !amountIn) return

    try {
      const amountInWei = parseTokenAmount(amountIn, tokenIn.decimals)
      const amountOutMin = calculateAmountOutMin(
        recommendation?.expectedReturn || 0n,
        0.5 // 0.5% 滑点
      )

      const hash = await executeOrder(
        tokenIn.address,
        tokenOut.address,
        amountInWei,
        amountOutMin
      )
      
      setTxHash(hash)
    } catch (error) {
      console.error('智能交易失败:', error)
    }
  }

  return (
    <div className="smart-trading">
      <h2>🧠 AI智能交易</h2>
      
      {/* 代币选择和金额输入 */}
      <div className="trade-inputs">
        <TokenSelector 
          token={tokenIn} 
          onSelect={setTokenIn}
          label="卖出"
        />
        <TokenSelector 
          token={tokenOut} 
          onSelect={setTokenOut}
          label="买入"
        />
        <input
          type="number"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          placeholder="输入数量"
        />
      </div>

      {/* AI分析结果 */}
      {recommendation && (
        <div className="ai-analysis">
          <h3>🤖 AI分析</h3>
          <div className="metric">
            <span>预期收益:</span>
            <span>{formatTokenAmount(recommendation.expectedReturn, tokenOut.decimals)}</span>
          </div>
          <div className="metric">
            <span>置信度:</span>
            <span>{recommendation.confidence}%</span>
          </div>
          <div className="metric">
            <span>风险等级:</span>
            <span className={`risk-${riskLevel?.toLowerCase()}`}>
              {riskLevel}
            </span>
          </div>
        </div>
      )}

      {/* 交易按钮 */}
      <button 
        onClick={handleSmartTrade}
        disabled={!address || !amountIn || riskLevel === '高'}
        className="trade-button"
      >
        {riskLevel === '高' ? '⚠️ 风险过高' : '🚀 智能交易'}
      </button>

      {/* 交易状态 */}
      {txHash && (
        <div className="transaction-status">
          <p>交易状态: {status}</p>
          <a 
            href={`https://testnet.monadexplorer.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            查看交易详情 ↗
          </a>
        </div>
      )}
    </div>
  )
}
```

---

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install wagmi viem @tanstack/react-query
```

### 2. 配置Provider
```tsx
// providers/Web3Provider.tsx
import { WagmiConfig, createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  // Wagmi配置
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        {children}
      </WagmiConfig>
    </QueryClientProvider>
  )
}
```

### 3. 更新配置文件
```typescript
// lib/config.ts - 使用实际部署地址
export const CONTRACT_ADDRESSES = {
  TRADER_AGENT: "0x7267749E1Fa24Cae44e1B76Ec90F3B2f98D2C290",
  ROUTER_DEFENSE: "0x458Ec2Bc6E645ccd8f98599D6E4d942ea480ca16",
  // ... 其他地址
} as const
```

---

## 📞 技术支持

如有任何问题：
1. 查看浏览器控制台错误信息
2. 检查网络连接和MetaMask配置
3. 确认合约地址和ABI正确性
4. 验证交易参数格式

**合约部署网络**: Monad Testnet  
**区块浏览器**: https://testnet.monadexplorer.com  
**文档更新**: 2025-09-20