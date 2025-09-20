"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOrders } from "@/hooks/use-orders"
import { OrderType, OrderStatus } from "@/types/orders"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, X, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function OrderHistory() {
  const { orders, batchOrders, cancelOrder, isLoading } = useOrders()

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />
      case OrderStatus.FILLED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case OrderStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />
      case OrderStatus.PARTIALLY_FILLED:
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      [OrderStatus.PENDING]: "secondary",
      [OrderStatus.FILLED]: "default",
      [OrderStatus.CANCELLED]: "destructive",
      [OrderStatus.PARTIALLY_FILLED]: "secondary",
      [OrderStatus.EXPIRED]: "outline",
    } as const

    const labels = {
      [OrderStatus.PENDING]: "Pending",
      [OrderStatus.FILLED]: "Filled",
      [OrderStatus.CANCELLED]: "Cancelled",
      [OrderStatus.PARTIALLY_FILLED]: "Partial",
      [OrderStatus.EXPIRED]: "Expired",
    }

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status]}
      </Badge>
    )
  }

  const getOrderTypeLabel = (type: OrderType) => {
    const labels = {
      [OrderType.MARKET]: "Market",
      [OrderType.LIMIT]: "Limit",
      [OrderType.STOP_LOSS]: "Stop Loss",
      [OrderType.TAKE_PROFIT]: "Take Profit",
    }
    return labels[type]
  }

  return (
    <Card className="p-6">
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Individual Orders</TabsTrigger>
          <TabsTrigger value="batch">Batch Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Order History</h3>
            <Badge variant="outline">{orders.length} orders</Badge>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No orders found</p>
                <p className="text-sm">Create your first order to get started</p>
              </div>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="p-4 border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{getOrderTypeLabel(order.type)}</Badge>
                        <span className="font-mono text-sm">
                          {order.amountIn} {order.tokenIn} → {order.tokenOut}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created {formatDistanceToNow(order.createdAt)} ago</span>
                        {order.targetPrice && <span>Target: ${order.targetPrice}</span>}
                        {order.txHash && (
                          <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Tx
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === OrderStatus.PENDING && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelOrder(order.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Batch Orders</h3>
            <Badge variant="outline">{batchOrders.length} batches</Badge>
          </div>

          <div className="space-y-3">
            {batchOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No batch orders found</p>
                <p className="text-sm">Create a batch order to execute multiple trades at once</p>
              </div>
            ) : (
              batchOrders.map((batch) => (
                <Card key={batch.id} className="p-4 border-border/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Batch #{batch.id.slice(-4)}</Badge>
                        <span className="text-sm">
                          {batch.filledOrders}/{batch.totalOrders} filled
                        </span>
                        {getStatusBadge(batch.status)}
                      </div>
                      <span className="text-sm text-muted-foreground">{formatDistanceToNow(batch.createdAt)} ago</span>
                    </div>

                    <div className="space-y-2">
                      {batch.orders.slice(0, 3).map((order, index) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded"
                        >
                          <span className="font-mono">
                            {order.amountIn} {order.tokenIn} → {order.tokenOut}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                      ))}
                      {batch.orders.length > 3 && (
                        <div className="text-sm text-muted-foreground text-center">
                          +{batch.orders.length - 3} more orders
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
