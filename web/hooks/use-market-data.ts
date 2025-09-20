"use client"

import { useState, useEffect, useCallback } from "react"
import { monadDataProvider, externalPriceProvider, type PriceData } from "@/lib/data-providers"
import { SUPPORTED_TOKENS } from "@/lib/config"

export function useMarketData() {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<number>(0)

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true)

      // Fetch prices from both on-chain and external sources
      const [onChainPrices, externalPrices] = await Promise.all([
        Promise.all(
          SUPPORTED_TOKENS.map(async (token) => {
            const price = await monadDataProvider.getTokenPrice(token.address)
            return {
              symbol: token.symbol,
              price,
              change24h: Math.random() * 10 - 5, // Mock 24h change
              volume24h: Math.random() * 1000000000,
              lastUpdated: Date.now(),
            }
          }),
        ),
        externalPriceProvider.getTokenPrices(["ethereum", "usd-coin", "dai"]),
      ])

      // Combine and prioritize on-chain data
      const combinedPrices: Record<string, PriceData> = {}

      onChainPrices.forEach((priceData) => {
        combinedPrices[priceData.symbol] = priceData
      })

      // Use external data as fallback or for additional info
      Object.values(externalPrices).forEach((priceData) => {
        if (!combinedPrices[priceData.symbol]) {
          combinedPrices[priceData.symbol] = priceData
        } else {
          // Merge volume data from external source
          combinedPrices[priceData.symbol].volume24h = priceData.volume24h
          combinedPrices[priceData.symbol].change24h = priceData.change24h
        }
      })

      setPrices(combinedPrices)
      setLastUpdated(Date.now())
    } catch (error) {
      console.error("Failed to fetch market data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()

    // Update prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000)

    return () => clearInterval(interval)
  }, [fetchPrices])

  return {
    prices,
    isLoading,
    lastUpdated,
    refetch: fetchPrices,
  }
}
