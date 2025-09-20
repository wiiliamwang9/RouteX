"use client"

import { useState, useCallback, useEffect } from "react"
import { type Order, OrderType, OrderStatus, type BatchOrder, type PriceAlert } from "@/types/orders"

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [batchOrders, setBatchOrders] = useState<BatchOrder[]>([])
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: "1",
        type: OrderType.LIMIT,
        tokenIn: "ETH",
        tokenOut: "USDC",
        amountIn: "1.5",
        targetPrice: "2100",
        status: OrderStatus.PENDING,
        createdAt: Date.now() - 3600000,
        user: "0x1234...5678",
      },
      {
        id: "2",
        type: OrderType.MARKET,
        tokenIn: "USDC",
        tokenOut: "DAI",
        amountIn: "1000",
        status: OrderStatus.FILLED,
        createdAt: Date.now() - 7200000,
        filledAt: Date.now() - 7000000,
        txHash: "0xabcd...efgh",
        user: "0x1234...5678",
      },
    ]

    const mockBatchOrders: BatchOrder[] = [
      {
        id: "batch-1",
        orders: mockOrders,
        totalOrders: 5,
        filledOrders: 2,
        status: OrderStatus.PARTIALLY_FILLED,
        createdAt: Date.now() - 1800000,
      },
    ]

    const mockAlerts: PriceAlert[] = [
      {
        id: "alert-1",
        tokenSymbol: "ETH",
        targetPrice: "2200",
        condition: "above",
        isActive: true,
        createdAt: Date.now() - 3600000,
      },
    ]

    setOrders(mockOrders)
    setBatchOrders(mockBatchOrders)
    setPriceAlerts(mockAlerts)
  }, [])

  const createOrder = useCallback(
    async (orderData: {
      type: OrderType
      tokenIn: string
      tokenOut: string
      amountIn: string
      targetPrice?: string
    }) => {
      setIsLoading(true)

      try {
        // TODO: Replace with actual contract interaction
        console.log("Creating order:", orderData)

        const newOrder: Order = {
          id: Date.now().toString(),
          ...orderData,
          status: OrderStatus.PENDING,
          createdAt: Date.now(),
          user: "0x1234...5678", // Replace with actual user address
        }

        setOrders((prev) => [newOrder, ...prev])

        // Mock transaction delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        alert("Order created successfully!")
      } catch (error) {
        console.error("Failed to create order:", error)
        alert("Failed to create order")
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const createBatchOrder = useCallback(
    async (
      orders: Array<{
        type: OrderType
        tokenIn: string
        tokenOut: string
        amountIn: string
        targetPrice?: string
      }>,
    ) => {
      setIsLoading(true)

      try {
        // TODO: Replace with actual batch contract interaction
        console.log("Creating batch order:", orders)

        const batchId = Date.now().toString()
        const orderObjects: Order[] = orders.map((order, index) => ({
          id: `${batchId}-${index}`,
          ...order,
          status: OrderStatus.PENDING,
          createdAt: Date.now(),
          user: "0x1234...5678",
        }))

        const batchOrder: BatchOrder = {
          id: batchId,
          orders: orderObjects,
          totalOrders: orders.length,
          filledOrders: 0,
          status: OrderStatus.PENDING,
          createdAt: Date.now(),
        }

        setBatchOrders((prev) => [batchOrder, ...prev])
        setOrders((prev) => [...orderObjects, ...prev])

        await new Promise((resolve) => setTimeout(resolve, 2000))

        alert(`Batch order with ${orders.length} orders created successfully!`)
      } catch (error) {
        console.error("Failed to create batch order:", error)
        alert("Failed to create batch order")
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const cancelOrder = useCallback(async (orderId: string) => {
    setIsLoading(true)

    try {
      // TODO: Replace with actual contract interaction
      console.log("Cancelling order:", orderId)

      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: OrderStatus.CANCELLED } : order)),
      )

      await new Promise((resolve) => setTimeout(resolve, 1000))

      alert("Order cancelled successfully!")
    } catch (error) {
      console.error("Failed to cancel order:", error)
      alert("Failed to cancel order")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createPriceAlert = useCallback(
    async (alertData: { tokenSymbol: string; targetPrice: string; condition: "above" | "below" }) => {
      const newAlert: PriceAlert = {
        id: Date.now().toString(),
        ...alertData,
        isActive: true,
        createdAt: Date.now(),
      }

      setPriceAlerts((prev) => [newAlert, ...prev])
      alert("Price alert created!")
    },
    [],
  )

  const togglePriceAlert = useCallback((alertId: string) => {
    setPriceAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert)),
    )
  }, [])

  return {
    orders,
    batchOrders,
    priceAlerts,
    isLoading,
    createOrder,
    createBatchOrder,
    cancelOrder,
    createPriceAlert,
    togglePriceAlert,
  }
}
