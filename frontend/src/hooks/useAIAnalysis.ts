'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// AI Analysis Hook for route optimization
export function useAIRouteOptimization() {
  const [isEnabled, setIsEnabled] = useState(false)

  const mutation = useMutation({
    mutationFn: async (params: {
      tokenIn: string
      tokenOut: string
      amountIn: string
      marketData: {
        price: number
        volume24h: number
        liquidity: number
        volatility: number
      }
      userPreferences?: {
        riskTolerance: 'low' | 'medium' | 'high'
        maxSlippage: number
        prioritizeSpeed: boolean
      }
    }) => {
      const response = await axios.post(`${API_BASE_URL}/ai/route-optimization`, params, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    },
    onError: (error) => {
      console.error('AI route optimization failed:', error)
    }
  })

  return {
    optimizeRoute: mutation.mutate,
    data: mutation.data?.data,
    isLoading: mutation.isPending,
    error: mutation.error,
    isEnabled,
    setIsEnabled
  }
}

// Market Timing Analysis Hook
export function useMarketTimingAnalysis() {
  const mutation = useMutation({
    mutationFn: async (params: {
      tokenIn: string
      tokenOut: string
      marketConditions: any
    }) => {
      const response = await axios.post(`${API_BASE_URL}/ai/market-timing`, params, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    }
  })

  return {
    analyzeMarketTiming: mutation.mutate,
    data: mutation.data?.data,
    isLoading: mutation.isPending,
    error: mutation.error
  }
}

// Risk Assessment Hook
export function useRiskAssessment() {
  const mutation = useMutation({
    mutationFn: async (params: {
      tokenIn: string
      tokenOut: string
      amountIn: string
      marketData: {
        price: number
        volume24h: number
        liquidity: number
        volatility: number
      }
    }) => {
      const response = await axios.post(`${API_BASE_URL}/ai/risk-assessment`, params, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    }
  })

  return {
    assessRisk: mutation.mutate,
    data: mutation.data?.data,
    isLoading: mutation.isPending,
    error: mutation.error
  }
}

// Market Insights Hook
export function useMarketInsights(tokens?: string, timeframe = '24h') {
  return useQuery({
    queryKey: ['marketInsights', tokens, timeframe],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (tokens) params.append('tokens', tokens)
      params.append('timeframe', timeframe)
      
      const response = await axios.get(`${API_BASE_URL}/ai/market-insights?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      return response.data
    },
    refetchInterval: 60000, // Refetch every minute
    enabled: !!localStorage.getItem('authToken')
  })
}

// Personalized Strategy Hook
export function usePersonalizedStrategy() {
  const mutation = useMutation({
    mutationFn: async (params: {
      tradingHistory: any[]
      preferences: {
        riskTolerance: 'low' | 'medium' | 'high'
        investmentHorizon: 'short' | 'medium' | 'long'
      }
    }) => {
      const response = await axios.post(`${API_BASE_URL}/ai/personalized-strategy`, params, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    }
  })

  return {
    generateStrategy: mutation.mutate,
    data: mutation.data?.data,
    isLoading: mutation.isPending,
    error: mutation.error
  }
}

// Portfolio Optimization Hook
export function usePortfolioOptimization() {
  const mutation = useMutation({
    mutationFn: async (params: {
      currentHoldings: Array<{
        token: string
        amount: string
        value: number
      }>
      targetAllocation: Record<string, number>
      constraints?: {
        maxTradeSize?: number
        minHoldingPeriod?: number
      }
    }) => {
      const response = await axios.post(`${API_BASE_URL}/ai/portfolio-optimization`, params, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    }
  })

  return {
    optimizePortfolio: mutation.mutate,
    data: mutation.data?.data,
    isLoading: mutation.isPending,
    error: mutation.error
  }
}

// AI Health Check Hook
export function useAIHealth() {
  return useQuery({
    queryKey: ['aiHealth'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/ai/health`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      return response.data
    },
    refetchInterval: 30000, // Check every 30 seconds
    enabled: !!localStorage.getItem('authToken')
  })
}

// Combined AI Analysis Hook (for convenience)
export function useAIAnalysis() {
  const routeOptimization = useAIRouteOptimization()
  const riskAssessment = useRiskAssessment()
  const marketTiming = useMarketTimingAnalysis()
  const marketInsights = useMarketInsights()
  const aiHealth = useAIHealth()

  const analyzeComplete = async (params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    marketData: {
      price: number
      volume24h: number
      liquidity: number
      volatility: number
    }
    userPreferences?: {
      riskTolerance: 'low' | 'medium' | 'high'
      maxSlippage: number
      prioritizeSpeed: boolean
    }
  }) => {
    try {
      // Run all analyses in parallel
      const [routeResult, riskResult, timingResult] = await Promise.allSettled([
        new Promise((resolve, reject) => {
          routeOptimization.optimizeRoute(params, {
            onSuccess: resolve,
            onError: reject
          })
        }),
        new Promise((resolve, reject) => {
          riskAssessment.assessRisk({
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
            marketData: params.marketData
          }, {
            onSuccess: resolve,
            onError: reject
          })
        }),
        new Promise((resolve, reject) => {
          marketTiming.analyzeMarketTiming({
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            marketConditions: params.marketData
          }, {
            onSuccess: resolve,
            onError: reject
          })
        })
      ])

      return {
        route: routeResult.status === 'fulfilled' ? routeResult.value : null,
        risk: riskResult.status === 'fulfilled' ? riskResult.value : null,
        timing: timingResult.status === 'fulfilled' ? timingResult.value : null
      }
    } catch (error) {
      console.error('Complete AI analysis failed:', error)
      throw error
    }
  }

  return {
    // Individual hooks
    routeOptimization,
    riskAssessment,
    marketTiming,
    marketInsights,
    aiHealth,
    
    // Combined analysis
    analyzeComplete,
    
    // Status checks
    isAIAvailable: aiHealth.data?.data?.status === 'healthy',
    aiCapabilities: aiHealth.data?.data?.capabilities || {},
    aiPerformance: aiHealth.data?.data?.performance || {}
  }
}