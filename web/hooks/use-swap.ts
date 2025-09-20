"use client"

import { useState, useCallback, useEffect } from "react"
import { SUPPORTED_TOKENS } from "@/lib/config"
import { useAllTokenPrices } from "@/hooks/use-token-prices"

interface SwapState {
  tokenIn: (typeof SUPPORTED_TOKENS)[0] | null
  tokenOut: (typeof SUPPORTED_TOKENS)[0] | null
  amountIn: string
  amountOut: string
  slippage: number
  isLoading: boolean
  route: string[]
  priceImpact: number
  estimatedGas: string
}

export function useSwap() {
  const [swapState, setSwapState] = useState<SwapState>({
    tokenIn: SUPPORTED_TOKENS[0],
    tokenOut: SUPPORTED_TOKENS[1],
    amountIn: "",
    amountOut: "",
    slippage: 0.5,
    isLoading: false,
    route: [],
    priceImpact: 0,
    estimatedGas: "0",
  })

  // 获取实时价格数据
  const { prices } = useAllTokenPrices()

  const setTokenIn = useCallback((token: (typeof SUPPORTED_TOKENS)[0]) => {
    setSwapState((prev) => ({
      ...prev,
      tokenIn: token,
      amountOut: "",
    }))
  }, [])

  const setTokenOut = useCallback((token: (typeof SUPPORTED_TOKENS)[0]) => {
    setSwapState((prev) => ({
      ...prev,
      tokenOut: token,
      amountOut: "",
    }))
  }, [])

  const setAmountIn = useCallback((amount: string) => {
    setSwapState((prev) => ({
      ...prev,
      amountIn: amount,
    }))
  }, [])

  const setSlippage = useCallback((slippage: number) => {
    setSwapState((prev) => ({
      ...prev,
      slippage,
    }))
  }, [])

  const swapTokens = useCallback(() => {
    setSwapState((prev) => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: prev.amountOut,
      amountOut: prev.amountIn,
    }))
  }, [])

  // 基于真实价格计算汇率
  const calculateAmountOut = useCallback(async () => {
    if (!swapState.tokenIn || !swapState.tokenOut || !swapState.amountIn || !prices) {
      setSwapState((prev) => ({ ...prev, amountOut: "", route: [], priceImpact: 0 }))
      return
    }

    setSwapState((prev) => ({ ...prev, isLoading: true }))

    try {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 获取代币价格 (包括 MON 原生代币)
      const tokenInPrice = swapState.tokenIn.symbol === 'WETH' 
        ? prices['WETH']?.price 
        : swapState.tokenIn.symbol === 'USDC' 
        ? prices['USDC']?.price 
        : prices['DAI']?.price

      const tokenOutPrice = swapState.tokenOut.symbol === 'WETH' 
        ? prices['WETH']?.price 
        : swapState.tokenOut.symbol === 'USDC' 
        ? prices['USDC']?.price 
        : prices['DAI']?.price

      if (!tokenInPrice || !tokenOutPrice) {
        console.warn('Price data not available for selected tokens')
        setSwapState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      // 计算汇率和输出数量
      const exchangeRate = tokenInPrice / tokenOutPrice
      const inputAmount = parseFloat(swapState.amountIn)
      
      // 应用0.3%的交易费用 (典型DEX费用)
      const feeMultiplier = 0.997
      const amountOut = (inputAmount * exchangeRate * feeMultiplier).toFixed(6)

      // 计算价格影响 (基于交易大小)
      const priceImpact = Math.min(inputAmount * tokenInPrice / 100000, 5) // 假设流动性池大小

      // 估算 Gas 费用 (基于 Monad 的低 Gas 费)
      const estimatedGas = (0.001 + Math.random() * 0.001).toFixed(6)

      console.log('💱 Swap calculation:', {
        tokenIn: swapState.tokenIn.symbol,
        tokenOut: swapState.tokenOut.symbol,
        tokenInPrice,
        tokenOutPrice,
        exchangeRate,
        inputAmount,
        amountOut,
        priceImpact,
        source: `${prices[swapState.tokenIn.symbol]?.source} → ${prices[swapState.tokenOut.symbol]?.source}`
      })

      setSwapState((prev) => ({
        ...prev,
        amountOut,
        route: [prev.tokenIn!.symbol, prev.tokenOut!.symbol],
        priceImpact,
        estimatedGas,
        isLoading: false,
      }))
    } catch (error) {
      console.error("Error calculating swap:", error)
      setSwapState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [swapState.tokenIn, swapState.tokenOut, swapState.amountIn, prices])

  const executeSwap = useCallback(async () => {
    if (!window.ethereum || !swapState.tokenIn || !swapState.tokenOut) {
      return
    }

    try {
      setSwapState((prev) => ({ ...prev, isLoading: true }))

      // TODO: Replace with actual contract interaction
      console.log("Executing swap:", {
        tokenIn: swapState.tokenIn.address,
        tokenOut: swapState.tokenOut.address,
        amountIn: swapState.amountIn,
        amountOutMin: swapState.amountOut,
        slippage: swapState.slippage,
      })

      // Mock transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert("Swap executed successfully! (Mock transaction)")

      setSwapState((prev) => ({
        ...prev,
        amountIn: "",
        amountOut: "",
        isLoading: false,
      }))
    } catch (error) {
      console.error("Swap failed:", error)
      setSwapState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [swapState])

  useEffect(() => {
    if (swapState.amountIn && swapState.tokenIn && swapState.tokenOut) {
      const debounceTimer = setTimeout(calculateAmountOut, 500)
      return () => clearTimeout(debounceTimer)
    }
  }, [swapState.amountIn, swapState.tokenIn, swapState.tokenOut, calculateAmountOut])

  return {
    ...swapState,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setSlippage,
    swapTokens,
    executeSwap,
  }
}
