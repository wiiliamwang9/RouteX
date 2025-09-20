export enum OrderType {
  MARKET = 0,
  LIMIT = 1,
  STOP_LOSS = 2,
  TAKE_PROFIT = 3,
}

export enum OrderStatus {
  PENDING = 0,
  FILLED = 1,
  CANCELLED = 2,
  EXPIRED = 3,
  PARTIALLY_FILLED = 4,
}

export interface Order {
  id: string
  type: OrderType
  tokenIn: string
  tokenOut: string
  amountIn: string
  targetPrice?: string
  amountOut?: string
  status: OrderStatus
  createdAt: number
  filledAt?: number
  txHash?: string
  user: string
}

export interface BatchOrder {
  id: string
  orders: Order[]
  totalOrders: number
  filledOrders: number
  status: OrderStatus
  createdAt: number
}

export interface PriceAlert {
  id: string
  tokenSymbol: string
  targetPrice: string
  condition: "above" | "below"
  isActive: boolean
  createdAt: number
}
