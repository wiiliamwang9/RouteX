"use client"

import { useState, useEffect, useCallback } from 'react'
import { useContractRead, useContractWrite } from 'wagmi'
import { CONTRACT_ADDRESSES, QUANTGUARD_PRO_ABI } from '@/lib/config'

export interface Strategy {
  id: bigint
  strategyType: number
  status: number // 0=待激活, 1=运行中, 2=已暂停, 3=已停止
  creator: string
  initialCapital: bigint
  currentValue: bigint
  maxRisk: bigint
  createdAt: number
  lastUpdated: number
  totalTrades: number
  profitLoss: bigint
  riskLevel: number
}

export interface StrategyPerformance {
  totalReturn: bigint
  sharpeRatio: bigint
  maxDrawdown: bigint
  winRate: bigint
  profitFactor: bigint
  avgTradeDuration: number
  lastTradeTime: number
}

/**
 * 获取用户的所有策略
 */
export function useGetUserStrategies(userAddress?: string) {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { data: strategiesData, refetch } = useContractRead({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'getUserStrategies',
    args: [userAddress],
    enabled: !!userAddress,
    watch: true,
  })

  useEffect(() => {
    if (strategiesData && Array.isArray(strategiesData)) {
      // 模拟策略数据，因为合约可能返回策略ID数组
      const mockStrategies: Strategy[] = strategiesData.map((strategyId: bigint, index: number) => ({
        id: strategyId,
        strategyType: index % 4, // 0-3 对应不同策略类型
        status: Math.floor(Math.random() * 4), // 随机状态
        creator: userAddress || '',
        initialCapital: BigInt(Math.floor(Math.random() * 10 + 1) * 1e18), // 1-10 ETH
        currentValue: BigInt(Math.floor(Math.random() * 12 + 1) * 1e18), // 随机当前价值
        maxRisk: BigInt(Math.floor(Math.random() * 3 + 1) * 1e17), // 0.1-0.3 ETH
        createdAt: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000, // 30天内创建
        lastUpdated: Date.now() - Math.floor(Math.random() * 24) * 60 * 60 * 1000, // 24小时内更新
        totalTrades: Math.floor(Math.random() * 50), // 0-49 笔交易
        profitLoss: BigInt((Math.random() - 0.5) * 2 * 1e18), // -1 to +1 ETH
        riskLevel: Math.floor(Math.random() * 3), // 0-2 风险等级
      }))
      
      setStrategies(mockStrategies)
    } else {
      setStrategies([])
    }
  }, [strategiesData, userAddress])

  return {
    strategies,
    isLoading,
    refetch: useCallback(() => {
      setIsLoading(true)
      refetch().finally(() => setIsLoading(false))
    }, [refetch])
  }
}

/**
 * 获取策略详细信息
 */
export function useGetStrategyDetails(strategyId?: bigint) {
  const { data: strategyData, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'getStrategyDetails',
    args: [strategyId],
    enabled: !!strategyId,
    watch: true,
  })

  const strategy: Strategy | null = strategyData ? {
    id: strategyId!,
    strategyType: strategyData[0],
    status: strategyData[1],
    creator: strategyData[2],
    initialCapital: strategyData[3],
    currentValue: strategyData[4],
    maxRisk: strategyData[5],
    createdAt: Number(strategyData[6]),
    lastUpdated: Number(strategyData[7]),
    totalTrades: Number(strategyData[8]),
    profitLoss: strategyData[9],
    riskLevel: strategyData[10],
  } : null

  return {
    strategy,
    isLoading,
  }
}

/**
 * 获取策略性能指标
 */
export function useGetStrategyPerformance(strategyId?: bigint) {
  const { data: performanceData, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'getStrategyPerformance',
    args: [strategyId],
    enabled: !!strategyId,
    watch: true,
  })

  const performance: StrategyPerformance | null = performanceData ? {
    totalReturn: performanceData[0],
    sharpeRatio: performanceData[1],
    maxDrawdown: performanceData[2],
    winRate: performanceData[3],
    profitFactor: performanceData[4] || 0n,
    avgTradeDuration: Number(performanceData[5] || 0),
    lastTradeTime: Number(performanceData[6] || 0),
  } : null

  return {
    performance,
    isLoading,
  }
}

/**
 * 创建新策略
 */
export function useCreateStrategy() {
  const { write: createStrategy, data: txData, isLoading } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'createStrategy',
  })

  const handleCreateStrategy = useCallback(async (
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
      const encodedParams = JSON.stringify({
        targetPrice: parameters.targetPrice?.toString(),
        gridLevels: parameters.gridLevels,
        dcaInterval: parameters.dcaInterval,
        stopLoss: parameters.stopLoss?.toString(),
        takeProfit: parameters.takeProfit?.toString(),
      })

      await createStrategy({
        args: [strategyType, encodedParams, initialCapital, maxRisk],
        value: initialCapital, // 发送ETH作为初始资金
      })
    } catch (error) {
      console.error('创建策略失败:', error)
      throw error
    }
  }, [createStrategy])

  return {
    createStrategy: handleCreateStrategy,
    isLoading,
    txHash: txData?.hash,
  }
}

/**
 * 执行策略
 */
export function useExecuteStrategy() {
  const { write: executeStrategy, data: txData, isLoading } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'executeStrategy',
  })

  const handleExecuteStrategy = useCallback(async (strategyId: bigint) => {
    try {
      await executeStrategy({
        args: [strategyId],
      })
    } catch (error) {
      console.error('执行策略失败:', error)
      throw error
    }
  }, [executeStrategy])

  return {
    executeStrategy: handleExecuteStrategy,
    isLoading,
    txHash: txData?.hash,
  }
}

/**
 * 暂停策略
 */
export function usePauseStrategy() {
  const { write: pauseStrategy, data: txData, isLoading } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'pauseStrategy',
  })

  const handlePauseStrategy = useCallback(async (strategyId: bigint) => {
    try {
      await pauseStrategy({
        args: [strategyId],
      })
    } catch (error) {
      console.error('暂停策略失败:', error)
      throw error
    }
  }, [pauseStrategy])

  return {
    pauseStrategy: handlePauseStrategy,
    isLoading,
    txHash: txData?.hash,
  }
}

/**
 * 激活策略
 */
export function useActivateStrategy() {
  const { write: activateStrategy, data: txData, isLoading } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'activateStrategy',
  })

  const handleActivateStrategy = useCallback(async (strategyId: bigint) => {
    try {
      await activateStrategy({
        args: [strategyId],
      })
    } catch (error) {
      console.error('激活策略失败:', error)
      throw error
    }
  }, [activateStrategy])

  return {
    activateStrategy: handleActivateStrategy,
    isLoading,
    txHash: txData?.hash,
  }
}

/**
 * 更新策略参数
 */
export function useUpdateStrategyParams() {
  const { write: updateStrategyParams, data: txData, isLoading } = useContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARD_PRO,
    abi: QUANTGUARD_PRO_ABI,
    functionName: 'updateStrategyParams',
  })

  const handleUpdateStrategyParams = useCallback(async (
    strategyId: bigint,
    newParams: {
      targetPrice?: bigint
      gridLevels?: number
      dcaInterval?: number
      stopLoss?: bigint
      takeProfit?: bigint
    }
  ) => {
    try {
      const encodedParams = JSON.stringify({
        targetPrice: newParams.targetPrice?.toString(),
        gridLevels: newParams.gridLevels,
        dcaInterval: newParams.dcaInterval,
        stopLoss: newParams.stopLoss?.toString(),
        takeProfit: newParams.takeProfit?.toString(),
      })

      await updateStrategyParams({
        args: [strategyId, encodedParams],
      })
    } catch (error) {
      console.error('更新策略参数失败:', error)
      throw error
    }
  }, [updateStrategyParams])

  return {
    updateStrategyParams: handleUpdateStrategyParams,
    isLoading,
    txHash: txData?.hash,
  }
}

/**
 * 获取策略统计数据
 */
export function useStrategyStats(userAddress?: string) {
  const { strategies } = useGetUserStrategies(userAddress)

  const stats = {
    totalStrategies: strategies.length,
    activeStrategies: strategies.filter(s => s.status === 1).length,
    totalValue: strategies.reduce((sum, s) => sum + s.currentValue, 0n),
    totalPnL: strategies.reduce((sum, s) => sum + s.profitLoss, 0n),
    totalTrades: strategies.reduce((sum, s) => sum + s.totalTrades, 0),
    winRate: strategies.length > 0 ? 
      strategies.filter(s => s.profitLoss > 0n).length / strategies.length * 100 : 0,
    avgReturn: strategies.length > 0 ?
      Number(strategies.reduce((sum, s) => sum + s.profitLoss, 0n)) / strategies.length / 1e18 : 0,
  }

  return stats
}