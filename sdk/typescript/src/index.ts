/**
 * RouteX TypeScript SDK
 * 
 * A comprehensive SDK for high-frequency trading, MEV protection,
 * cross-chain routing, and AI-powered strategy optimization.
 */

export * from './client';
export * from './types';
export * from './utils';
export * from './strategies';
export * from './ai';
export * from './crosschain';

// Main client exports
export { RouteXClient } from './client/RouteXClient';
export { WebSocketClient } from './client/WebSocketClient';

// Strategy exports
export { StrategyManager } from './strategies/StrategyManager';
export { ArbitrageStrategy } from './strategies/ArbitrageStrategy';
export { GridStrategy } from './strategies/GridStrategy';
export { DCAStrategy } from './strategies/DCAStrategy';

// AI exports
export { AIOptimizer } from './ai/AIOptimizer';
export { RiskAnalyzer } from './ai/RiskAnalyzer';

// Cross-chain exports
export { CrossChainRouter } from './crosschain/CrossChainRouter';
export { BridgeManager } from './crosschain/BridgeManager';

// Utility exports
export { TokenUtils } from './utils/TokenUtils';
export { PriceUtils } from './utils/PriceUtils';
export { GasUtils } from './utils/GasUtils';

// Type exports
export type {
  SwapParams,
  TradeOrder,
  QuantStrategy,
  AIRecommendation,
  RiskAssessment,
  CrossChainSwapParams,
  PerformanceMetrics,
  MarketData,
  TradingSignal
} from './types';