"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenSelector } from "@/components/token-selector"
import { useOrders } from "@/hooks/use-orders"
import { OrderType } from "@/types/orders"
import { SUPPORTED_TOKENS } from "@/lib/config"
import { Plus, Zap, Target, TrendingDown, TrendingUp } from "lucide-react"

export function OrderForm() {
  const { createOrder, createBatchOrder, isLoading } = useOrders()

  const [singleOrder, setSingleOrder] = useState({
    type: OrderType.MARKET,
    tokenIn: SUPPORTED_TOKENS[0],
    tokenOut: SUPPORTED_TOKENS[1],
    amountIn: "",
    targetPrice: "",
  })

  const [batchOrders, setBatchOrders] = useState([
    {
      type: OrderType.LIMIT,
      tokenIn: SUPPORTED_TOKENS[0],
      tokenOut: SUPPORTED_TOKENS[1],
      amountIn: "",
      targetPrice: "",
    },
  ])

  const handleSingleOrderSubmit = async () => {
    if (!singleOrder.amountIn) return

    await createOrder({
      type: singleOrder.type,
      tokenIn: singleOrder.tokenIn.symbol,
      tokenOut: singleOrder.tokenOut.symbol,
      amountIn: singleOrder.amountIn,
      targetPrice: singleOrder.targetPrice || undefined,
    })

    setSingleOrder((prev) => ({ ...prev, amountIn: "", targetPrice: "" }))
  }

  const handleBatchOrderSubmit = async () => {
    const validOrders = batchOrders.filter((order) => order.amountIn)
    if (validOrders.length === 0) return

    await createBatchOrder(
      validOrders.map((order) => ({
        type: order.type,
        tokenIn: order.tokenIn.symbol,
        tokenOut: order.tokenOut.symbol,
        amountIn: order.amountIn,
        targetPrice: order.targetPrice || undefined,
      })),
    )

    setBatchOrders([
      {
        type: OrderType.LIMIT,
        tokenIn: SUPPORTED_TOKENS[0],
        tokenOut: SUPPORTED_TOKENS[1],
        amountIn: "",
        targetPrice: "",
      },
    ])
  }

  const addBatchOrder = () => {
    setBatchOrders((prev) => [
      ...prev,
      {
        type: OrderType.LIMIT,
        tokenIn: SUPPORTED_TOKENS[0],
        tokenOut: SUPPORTED_TOKENS[1],
        amountIn: "",
        targetPrice: "",
      },
    ])
  }

  const removeBatchOrder = (index: number) => {
    setBatchOrders((prev) => prev.filter((_, i) => i !== index))
  }

  const updateBatchOrder = (index: number, field: string, value: any) => {
    setBatchOrders((prev) => prev.map((order, i) => (i === index ? { ...order, [field]: value } : order)))
  }

  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case OrderType.MARKET:
        return <Zap className="h-4 w-4" />
      case OrderType.LIMIT:
        return <Target className="h-4 w-4" />
      case OrderType.STOP_LOSS:
        return <TrendingDown className="h-4 w-4" />
      case OrderType.TAKE_PROFIT:
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  return (
    <Card className="p-6">
      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Order</TabsTrigger>
          <TabsTrigger value="batch">Batch Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Order Type</Label>
              <Select
                value={singleOrder.type.toString()}
                onValueChange={(value) =>
                  setSingleOrder((prev) => ({ ...prev, type: Number.parseInt(value) as OrderType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderType.MARKET.toString()}>
                    <div className="flex items-center gap-2">
                      {getOrderTypeIcon(OrderType.MARKET)}
                      Market Order
                    </div>
                  </SelectItem>
                  <SelectItem value={OrderType.LIMIT.toString()}>
                    <div className="flex items-center gap-2">
                      {getOrderTypeIcon(OrderType.LIMIT)}
                      Limit Order
                    </div>
                  </SelectItem>
                  <SelectItem value={OrderType.STOP_LOSS.toString()}>
                    <div className="flex items-center gap-2">
                      {getOrderTypeIcon(OrderType.STOP_LOSS)}
                      Stop Loss
                    </div>
                  </SelectItem>
                  <SelectItem value={OrderType.TAKE_PROFIT.toString()}>
                    <div className="flex items-center gap-2">
                      {getOrderTypeIcon(OrderType.TAKE_PROFIT)}
                      Take Profit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Token</Label>
                <TokenSelector
                  selectedToken={singleOrder.tokenIn}
                  onTokenSelect={(token) => setSingleOrder((prev) => ({ ...prev, tokenIn: token }))}
                  excludeToken={singleOrder.tokenOut}
                />
              </div>
              <div>
                <Label>To Token</Label>
                <TokenSelector
                  selectedToken={singleOrder.tokenOut}
                  onTokenSelect={(token) => setSingleOrder((prev) => ({ ...prev, tokenOut: token }))}
                  excludeToken={singleOrder.tokenIn}
                />
              </div>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.0"
                value={singleOrder.amountIn}
                onChange={(e) => setSingleOrder((prev) => ({ ...prev, amountIn: e.target.value }))}
              />
            </div>

            {singleOrder.type !== OrderType.MARKET && (
              <div>
                <Label>Target Price</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={singleOrder.targetPrice}
                  onChange={(e) => setSingleOrder((prev) => ({ ...prev, targetPrice: e.target.value }))}
                />
              </div>
            )}

            <Button onClick={handleSingleOrderSubmit} disabled={isLoading || !singleOrder.amountIn} className="w-full">
              {isLoading ? "Creating Order..." : "Create Order"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <div className="space-y-4">
            {batchOrders.map((order, index) => (
              <Card key={index} className="p-4 border-border/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Order {index + 1}</span>
                    {batchOrders.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeBatchOrder(index)}>
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={order.type.toString()}
                        onValueChange={(value) => updateBatchOrder(index, "type", Number.parseInt(value) as OrderType)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={OrderType.LIMIT.toString()}>Limit</SelectItem>
                          <SelectItem value={OrderType.STOP_LOSS.toString()}>Stop Loss</SelectItem>
                          <SelectItem value={OrderType.TAKE_PROFIT.toString()}>Take Profit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={order.amountIn}
                        onChange={(e) => updateBatchOrder(index, "amountIn", e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">From</Label>
                      <TokenSelector
                        selectedToken={order.tokenIn}
                        onTokenSelect={(token) => updateBatchOrder(index, "tokenIn", token)}
                        excludeToken={order.tokenOut}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">To</Label>
                      <TokenSelector
                        selectedToken={order.tokenOut}
                        onTokenSelect={(token) => updateBatchOrder(index, "tokenOut", token)}
                        excludeToken={order.tokenIn}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Target Price</Label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={order.targetPrice}
                        onChange={(e) => updateBatchOrder(index, "targetPrice", e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <div className="flex gap-2">
              <Button variant="outline" onClick={addBatchOrder} className="flex items-center gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Order
              </Button>
              <Button
                onClick={handleBatchOrderSubmit}
                disabled={isLoading || batchOrders.every((order) => !order.amountIn)}
                className="flex-1"
              >
                {isLoading ? "Creating Batch..." : `Create ${batchOrders.length} Orders`}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
