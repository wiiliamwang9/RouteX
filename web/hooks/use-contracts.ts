"use client"

import { useState, useCallback } from 'react'
import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { formatUnits, parseUnits, type Hash } from 'viem'
import { CONTRACT_ADDRESSES, SUPPORTED_TOKENS } from '@/lib/config'
import { 
  TRADER_AGENT_ABI, 
  ROUTER_DEFENSE_ABI, 
  AI_STRATEGY_OPTIMIZER_ABI,
  QUANTGUARD_PRO_ABI,
  CROSSCHAIN_ROUTER_ABI,
  ERC20_ABI 
} from '@/lib/contract-abis'

// ============================================================================
// 工具函数
// ============================================================================

export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  precision: number = 6
): string {
  const formatted = formatUnits(amount, decimals)
  return parseFloat(formatted).toFixed(precision)
}

export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  if (!amount || isNaN(Number(amount))) return 0n
  return parseUnits(amount, decimals)
}

export function calculateAmountOutMin(
  expectedAmountOut: bigint,
  slippagePercent: number = 0.5
): bigint {
  const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100))
  return (expectedAmountOut * slippageMultiplier) / 10000n
}

// ============================================================================
// TraderAgent 合约 Hooks
// ============================================================================

/**
 * 执行市价单交易
 */
export function useExecuteOrder() {
  const { write: executeOrder, data: txData } = useContractWrite({
    address: CONTRACT_ADDRESSES.TRADER_AGENT,
    abi: TRADER_AGENT_ABI,
    functionName: 'executeOrder',
  })

  const handleExecuteOrder = useCallback(async (
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
  }, [executeOrder])

  return { 
    executeOrder: handleExecuteOrder, 
    txHash: txData?.hash 
  }
}

/**
 * 创建限价单
 */
export function usePlaceLimitOrder() {
  const { write: placeLimitOrder, data: txData } = useContractWrite({
    address: CONTRACT_ADDRESSES.TRADER_AGENT,
    abi: TRADER_AGENT_ABI,
    functionName: 'placeLimitOrder',
  })

  const handlePlaceLimitOrder = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    targetPrice: bigint,
    isLong: boolean = true
  ) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400) // 24小时后过期
    
    try {
      await placeLimitOrder({
        args: [tokenIn, tokenOut, amountIn, targetPrice, deadline, isLong]
      })
    } catch (error) {
      console.error('限价单创建失败:', error)
      throw error
    }
  }, [placeLimitOrder])

  return { 
    placeLimitOrder: handlePlaceLimitOrder, 
    txHash: txData?.hash 
  }
}

/**
 * 获取用户订单
 */
export function useUserOrders(userAddress?: string) {
  const { data: orders, isLoading, refetch } = useContractRead({
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
    refetch,
  }
}

// ============================================================================
// RouterDefense 合约 Hooks  
// ============================================================================

/**
 * 受保护的交易 (MEV防护)
 */
export function useProtectedSwap() {
  const { write: protectedSwap, data: txData } = useContractWrite({
    address: CONTRACT_ADDRESSES.ROUTER_DEFENSE,
    abi: ROUTER_DEFENSE_ABI,
    functionName: 'protectedSwap',
  })

  const handleProtectedSwap = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOutMin: bigint
  ) => {
    // 生成随机数和承诺 (简化版本)
    const nonce = BigInt(Math.floor(Math.random() * 1000000))
    const commitment = `0x${nonce.toString(16).padStart(64, '0')}` // 简化的承诺生成
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
    
    try {
      await protectedSwap({
        args: [tokenIn, tokenOut, amountIn, amountOutMin, commitment, deadline]
      })
    } catch (error) {
      console.error('受保护交易失败:', error)
      throw error
    }
  }, [protectedSwap])

  return { 
    protectedSwap: handleProtectedSwap, 
    txHash: txData?.hash 
  }
}

/**
 * 获取最优路径
 */
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

// ============================================================================
// AI Strategy Optimizer 合约 Hooks
// ============================================================================

/**
 * AI路径优化
 */
export function useAIRouteOptimization(
  tokenIn?: string,
  tokenOut?: string,
  amountIn?: bigint,
  riskTolerance: number = 1 // 0=低, 1=中, 2=高
) {
  const { data: aiRoute, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.AI_STRATEGY_OPTIMIZER,
    abi: AI_STRATEGY_OPTIMIZER_ABI,
    functionName: 'getOptimalRoute',
    args: [tokenIn, tokenOut, amountIn, riskTolerance],
    enabled: !!(tokenIn && tokenOut && amountIn),
  })

  return {
    optimizedPath: aiRoute?.[0] || [],
    expectedReturn: aiRoute?.[1] || 0n,
    confidenceScore: aiRoute?.[2] || 0,
    isLoading,
  }
}

/**
 * AI风险评估
 */
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

  const riskLevels = ['低', '中', '高']
  const riskLevel = riskData?.[0] !== undefined ? riskLevels[riskData[0]] : '未知'

  return {
    riskLevel,
    riskScore: Number(riskData?.[0] || 0),
    volatilityScore: riskData?.[1] || 0n,
    warnings: riskData?.[2] || [],
    isLoading,
  }
}

// ============================================================================
// QuantGuard Pro 合约 Hooks
// ============================================================================

/**
 * 创建量化策略
 */
export function useCreateStrategy() {
  const { write: createStrategy, data: txData } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'createStrategy',
  })

  const handleCreateStrategy = useCallback(async (
    strategyType: number, // 0=套利, 1=网格, 2=DCA, 3=动量
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
      // 简化的参数编码 (实际项目中应使用更复杂的编码)
      const strategyParams = `0x${strategyType.toString(16).padStart(64, '0')}`
      
      await createStrategy({
        args: [strategyType, strategyParams, initialCapital, maxRisk]
      })
    } catch (error) {
      console.error('策略创建失败:', error)
      throw error
    }
  }, [createStrategy])

  return { 
    createStrategy: handleCreateStrategy, 
    txHash: txData?.hash 
  }
}

/**
 * 执行策略
 */
export function useExecuteStrategy() {
  const { write: executeStrategy, data: txData } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'executeStrategy',
  })

  return { 
    executeStrategy, 
    txHash: txData?.hash 
  }
}

/**
 * 获取策略表现
 */
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

// ============================================================================
// 交易状态监控
// ============================================================================

/**
 * 监控交易状态
 */
export function useTransactionMonitor(hash?: Hash) {
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

// ============================================================================
// 组合Hook - 智能交易
// ============================================================================

/**
 * 智能交易 Hook (结合AI分析)
 */
export function useSmartTrading() {
  const [txHash, setTxHash] = useState<Hash>()
  const { executeOrder } = useExecuteOrder()
  const { protectedSwap } = useProtectedSwap()
  const { status } = useTransactionMonitor(txHash)

  const smartTrade = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    options: {
      slippage?: number
      useMEVProtection?: boolean
      riskTolerance?: number
    } = {}
  ) => {
    const { 
      slippage = 0.5, 
      useMEVProtection = false,
      riskTolerance = 1 
    } = options

    try {
      // 这里可以集成AI分析逻辑
      // const aiAnalysis = await getAIAnalysis(...)
      
      // 计算最小输出
      const mockExpectedOut = amountIn * 995n / 1000n // 模拟0.5%费用
      const amountOutMin = calculateAmountOutMin(mockExpectedOut, slippage)

      let hash: Hash
      
      if (useMEVProtection) {
        hash = await protectedSwap(tokenIn, tokenOut, amountIn, amountOutMin)
      } else {
        hash = await executeOrder(tokenIn, tokenOut, amountIn, amountOutMin, slippage)
      }
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('智能交易失败:', error)
      throw error
    }
  }, [executeOrder, protectedSwap])

  return {
    smartTrade,
    txHash,
    status,
    isLoading: status === '确认中',
    isSuccess: status === '成功',
    isError: status === '失败',
  }
}

// ============================================================================
// CrossChain Router 合约 Hooks
// ============================================================================

/**
 * 发起跨链交换
 */
export function useCrossChainSwap() {
  const { write: initiateCrossChainSwap, data: txData } = useContractWrite({
    address: CONTRACT_ADDRESSES.CROSSCHAIN_ROUTER,
    abi: CROSSCHAIN_ROUTER_ABI,
    functionName: 'initiateCrossChainSwap',
  })

  const handleCrossChainSwap = useCallback(async (
    targetChainId: number,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    recipient: string,
    bridgeData: string = '0x'
  ) => {
    try {
      await initiateCrossChainSwap({
        args: [BigInt(targetChainId), tokenIn, tokenOut, amountIn, recipient, bridgeData],
        value: parseUnits('0.01', 18), // 桥接费用
      })
    } catch (error) {
      console.error('跨链交易失败:', error)
      throw error
    }
  }, [initiateCrossChainSwap])

  return { 
    initiateCrossChainSwap: handleCrossChainSwap, 
    txHash: txData?.hash 
  }
}

/**
 * 获取最优桥接
 */
export function useOptimalBridge(
  targetChainId?: number,
  token?: string,
  amount?: bigint
) {
  const { data: bridgeData, isLoading } = useContractRead({
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
    isLoading,
  }
}

// ============================================================================
// ERC20 代币 Hooks
// ============================================================================

/**
 * 获取代币余额
 */
export function useTokenBalance(tokenAddress?: string, userAddress?: string) {
  const { data: balance, isLoading, refetch } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    enabled: !!(tokenAddress && userAddress),
    watch: true,
  })

  return {
    balance: balance || 0n,
    balanceFormatted: balance ? formatTokenAmount(balance, 18, 6) : '0',
    isLoading,
    refetch,
  }
}

/**
 * 代币授权
 */
export function useTokenApproval(tokenAddress?: string, spenderAddress?: string) {
  const { write: approve, data: txData } = useContractWrite({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'approve',
  })

  const { data: allowance } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [spenderAddress, spenderAddress], // [owner, spender]
    enabled: !!(tokenAddress && spenderAddress),
  })

  const handleApprove = useCallback(async (amount: bigint) => {
    try {
      await approve({
        args: [spenderAddress, amount]
      })
    } catch (error) {
      console.error('代币授权失败:', error)
      throw error
    }
  }, [approve, spenderAddress])

  return {
    approve: handleApprove,
    allowance: allowance || 0n,
    txHash: txData?.hash,
    isApproved: allowance && allowance > 0n,
  }
}

/**
 * 获取代币信息
 */
export function useTokenInfo(tokenAddress?: string) {
  const { data: name } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'name',
    enabled: !!tokenAddress,
  })

  const { data: symbol } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    enabled: !!tokenAddress,
  })

  const { data: decimals } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    enabled: !!tokenAddress,
  })

  return {
    name: name || '',
    symbol: symbol || '',
    decimals: decimals || 18,
  }
}

// ============================================================================
// 高级组合 Hooks
// ============================================================================

/**
 * 完整的交易准备Hook (包括授权检查)
 */
export function useTradePreparation(
  tokenInAddress?: string,
  tokenOutAddress?: string,
  amountIn?: bigint,
  userAddress?: string
) {
  const { balance: tokenInBalance } = useTokenBalance(tokenInAddress, userAddress)
  const { 
    allowance, 
    approve, 
    isApproved 
  } = useTokenApproval(tokenInAddress, CONTRACT_ADDRESSES.TRADER_AGENT)
  
  const { optimizedPath } = useAIRouteOptimization(
    tokenInAddress,
    tokenOutAddress, 
    amountIn
  )

  const { riskLevel } = useAIRiskAssessment(
    tokenInAddress,
    tokenOutAddress,
    amountIn
  )

  const isReady = !!(
    tokenInAddress &&
    tokenOutAddress && 
    amountIn &&
    userAddress &&
    tokenInBalance >= amountIn &&
    (isApproved || allowance >= amountIn) &&
    riskLevel !== '高'
  )

  return {
    isReady,
    needsApproval: !isApproved && allowance < (amountIn || 0n),
    insufficientBalance: tokenInBalance < (amountIn || 0n),
    highRisk: riskLevel === '高',
    optimizedPath,
    riskLevel,
    approve,
  }
}

/**
 * 多代币余额查询
 */
export function useMultiTokenBalances(userAddress?: string) {
  const tokenBalances = SUPPORTED_TOKENS.map(token => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { balance, balanceFormatted } = useTokenBalance(token.address, userAddress)
    return {
      ...token,
      balance,
      balanceFormatted,
    }
  })

  return { tokenBalances }
}

// ============================================================================
// 所有 Hooks 已通过单独的 export 语句导出
// ============================================================================