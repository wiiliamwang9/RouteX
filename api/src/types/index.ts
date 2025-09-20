// API Types and Interfaces

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  recipient: string;
  deadline: number;
  slippageTolerance?: number;
}

export interface CrossChainSwapParams extends SwapParams {
  srcChainId: number;
  dstChainId: number;
  bridgeType?: string;
}

export interface TradeOrder {
  id: string;
  user: string;
  type: 'market' | 'limit' | 'stop';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut?: string;
  targetPrice?: string;
  status: 'pending' | 'executing' | 'completed' | 'cancelled' | 'failed';
  createdAt: number;
  deadline: number;
  gasPrice?: string;
  nonce?: number;
}

export interface AIRouteRecommendation {
  path: string[];
  percentages: number[];
  expectedGasCost: string;
  expectedSlippage: number;
  confidenceScore: number;
  timeEstimate: number;
  risks: RiskAssessment;
}

export interface RiskAssessment {
  volatilityRisk: number;
  liquidityRisk: number;
  slippageRisk: number;
  gasRisk: number;
  overallRisk: number;
  warnings: string[];
}

export interface MarketData {
  token: string;
  price: string;
  volume24h: string;
  liquidity: string;
  priceChange24h: string;
  volatility: number;
  timestamp: number;
}

export interface TradingSignal {
  token: string;
  signal: 'buy' | 'sell' | 'hold';
  strength: number; // 1-10
  targetPrice: string;
  confidence: number;
  timeHorizon: number;
  reason: string;
}

export interface QuantGuardStrategy {
  id: string;
  name: string;
  description: string;
  type: 'arbitrage' | 'dca' | 'grid' | 'momentum' | 'custom';
  parameters: Record<string, any>;
  isActive: boolean;
  performance: StrategyPerformance;
}

export interface StrategyPerformance {
  totalTrades: number;
  successRate: number;
  totalPnL: string;
  avgTradeSize: string;
  maxDrawdown: number;
  sharpeRatio: number;
  lastUpdated: number;
}

export interface User {
  id: string;
  address: string;
  apiKey: string;
  tier: 'basic' | 'pro' | 'enterprise';
  permissions: string[];
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  createdAt: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId: string;
  };
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface PriceUpdate extends WebSocketMessage {
  type: 'priceUpdate';
  data: {
    token: string;
    price: string;
    change24h: string;
  };
}

export interface TradeUpdate extends WebSocketMessage {
  type: 'tradeUpdate';
  data: {
    orderId: string;
    status: string;
    txHash?: string;
  };
}

export interface GasUpdate extends WebSocketMessage {
  type: 'gasUpdate';
  data: {
    chainId: number;
    gasPrice: string;
    baseFee: string;
    priorityFee: string;
  };
}

export interface AnalyticsData {
  totalVolume: string;
  totalTrades: number;
  uniqueUsers: number;
  avgTradeSize: string;
  topTokens: Array<{
    token: string;
    volume: string;
    trades: number;
  }>;
  timeframe: string;
}

export interface CrossChainBridge {
  name: string;
  address: string;
  srcChain: number;
  dstChain: number;
  fee: number;
  estimatedTime: number;
  maxAmount: string;
  minAmount: string;
  isActive: boolean;
}

export interface QuantGuardConfig {
  maxSlippage: number;
  maxGasPrice: string;
  deadlineMinutes: number;
  enableMEVProtection: boolean;
  enableCrossChain: boolean;
  preferredBridges: string[];
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface BatchOperation {
  id: string;
  operations: Array<{
    type: string;
    params: any;
  }>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  results: any[];
  createdAt: number;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    database: boolean;
    redis: boolean;
    blockchain: boolean;
    ai: boolean;
  };
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}