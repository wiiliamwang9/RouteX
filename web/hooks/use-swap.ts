"use client"

import { useState, useCallback, useEffect } from "react"
import { SUPPORTED_TOKENS } from "@/lib/config"

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

  // Mock price calculation - replace with actual DEX routing logic
  const calculateAmountOut = useCallback(async () => {
    if (!swapState.tokenIn || !swapState.tokenOut || !swapState.amountIn) {
      return
    }

    setSwapState((prev) => ({ ...prev, isLoading: true }))

    try {
      // TODO: Replace with actual routing calculation
      // This would typically call your DEX router contract or API
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      const mockRate = swapState.tokenIn.symbol === "ETH" ? 2000 : swapState.tokenOut.symbol === "ETH" ? 0.0005 : 1
      const amountOut = (Number.parseFloat(swapState.amountIn) * mockRate).toFixed(6)

      setSwapState((prev) => ({
        ...prev,
        amountOut,
        route: [prev.tokenIn!.symbol, prev.tokenOut!.symbol],
        priceImpact: Math.random() * 2, // Mock price impact
        estimatedGas: "0.002",
        isLoading: false,
      }))
    } catch (error) {
      console.error("Error calculating swap:", error)
      setSwapState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [swapState.tokenIn, swapState.tokenOut, swapState.amountIn])

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
