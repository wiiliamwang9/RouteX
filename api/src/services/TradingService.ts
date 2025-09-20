import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { RedisService } from './RedisService';
import { BlockchainService } from './BlockchainService';
import { AIService } from './AIService';
import { SwapParams, TradeOrder, AIRouteRecommendation } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TradingService {
  private static instance: TradingService;
  private redis: RedisService;
  private blockchain: BlockchainService;
  private ai: AIService;

  private constructor() {
    this.redis = RedisService.getInstance();
    this.blockchain = BlockchainService.getInstance();
    this.ai = AIService.getInstance();
  }

  public static getInstance(): TradingService {
    if (!TradingService.instance) {
      TradingService.instance = new TradingService();
    }
    return TradingService.instance;
  }

  /**
   * Execute immediate swap transaction
   */
  public static async executeSwap(userId: string, params: SwapParams) {
    const instance = TradingService.getInstance();
    
    try {
      // Validate parameters
      await instance._validateSwapParams(params);
      
      // Get AI route recommendation
      const aiRecommendation = await instance.ai.getOptimalRoute(
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.slippageTolerance || 0.5
      );
      
      // Check risk assessment
      const riskAssessment = await instance.ai.assessRisk(
        params.tokenIn,
        params.tokenOut,
        params.amountIn
      );
      
      if (riskAssessment.overallRisk > 80) {
        throw new Error('Risk level too high for execution');
      }
      
      // Create order record
      const order: TradeOrder = {
        id: uuidv4(),
        user: userId,
        type: 'market',
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        status: 'executing',
        createdAt: Date.now(),
        deadline: params.deadline
      };
      
      // Store order in Redis
      await instance.redis.setOrder(order.id, order);
      
      // Execute swap on blockchain
      const txResult = await instance.blockchain.executeSwap(params, aiRecommendation);
      
      // Update order status
      order.status = txResult.success ? 'completed' : 'failed';
      order.amountOut = txResult.amountOut;
      
      await instance.redis.setOrder(order.id, order);
      
      // Emit WebSocket update
      instance._emitTradeUpdate(order);
      
      return {
        orderId: order.id,
        txHash: txResult.txHash,
        amountOut: txResult.amountOut,
        gasUsed: txResult.gasUsed,
        recommendation: aiRecommendation
      };
      
    } catch (error) {
      logger.error('Swap execution failed:', error);
      throw error;
    }
  }

  /**
   * Place limit order
   */
  public static async placeLimitOrder(userId: string, params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    targetPrice: string;
    deadline: number;
  }) {
    const instance = TradingService.getInstance();
    
    try {
      const order: TradeOrder = {
        id: uuidv4(),
        user: userId,
        type: 'limit',
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        targetPrice: params.targetPrice,
        status: 'pending',
        createdAt: Date.now(),
        deadline: params.deadline
      };
      
      // Store order
      await instance.redis.setOrder(order.id, order);
      await instance.redis.addUserOrder(userId, order.id);
      
      // Add to limit order queue
      await instance._addToLimitOrderQueue(order);
      
      return {
        orderId: order.id,
        status: order.status,
        estimatedExecution: await instance._estimateExecutionTime(order)
      };
      
    } catch (error) {
      logger.error('Limit order placement failed:', error);
      throw error;
    }
  }

  /**
   * Execute batch trades
   */
  public static async executeBatchTrades(userId: string, orders: SwapParams[]) {
    const instance = TradingService.getInstance();
    
    try {
      const batchId = uuidv4();
      const results = [];
      
      for (const orderParams of orders) {
        try {
          const result = await TradingService.executeSwap(userId, orderParams);
          results.push({
            success: true,
            ...result
          });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            params: orderParams
          });
        }
      }
      
      return {
        batchId,
        results,
        totalOrders: orders.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      };
      
    } catch (error) {
      logger.error('Batch trade execution failed:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  public static async getUserOrders(userId: string, options: {
    status?: string;
    limit: number;
    offset: number;
  }) {
    const instance = TradingService.getInstance();
    
    try {
      const orderIds = await instance.redis.getUserOrders(userId);
      const orders = [];
      
      for (const orderId of orderIds.slice(options.offset, options.offset + options.limit)) {
        const order = await instance.redis.getOrder(orderId);
        if (order && (!options.status || order.status === options.status)) {
          orders.push(order);
        }
      }
      
      return {
        orders,
        total: orderIds.length,
        limit: options.limit,
        offset: options.offset
      };
      
    } catch (error) {
      logger.error('Failed to fetch user orders:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  public static async getOrderById(userId: string, orderId: string) {
    const instance = TradingService.getInstance();
    
    try {
      const order = await instance.redis.getOrder(orderId);
      
      if (!order || order.user !== userId) {
        return null;
      }
      
      return order;
      
    } catch (error) {
      logger.error('Failed to fetch order:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  public static async cancelOrder(userId: string, orderId: string) {
    const instance = TradingService.getInstance();
    
    try {
      const order = await instance.redis.getOrder(orderId);
      
      if (!order || order.user !== userId) {
        throw new Error('Order not found');
      }
      
      if (order.status !== 'pending') {
        throw new Error('Order cannot be cancelled');
      }
      
      // Update order status
      order.status = 'cancelled';
      await instance.redis.setOrder(orderId, order);
      
      // Remove from limit order queue if applicable
      if (order.type === 'limit') {
        await instance._removeFromLimitOrderQueue(orderId);
      }
      
      // Emit update
      instance._emitTradeUpdate(order);
      
      return {
        orderId,
        status: 'cancelled'
      };
      
    } catch (error) {
      logger.error('Order cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Get trade estimate
   */
  public static async getTradeEstimate(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippageTolerance: number;
  }) {
    const instance = TradingService.getInstance();
    
    try {
      // Get AI recommendation
      const recommendation = await instance.ai.getOptimalRoute(
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.slippageTolerance
      );
      
      // Get current market data
      const marketData = await instance.blockchain.getMarketData(params.tokenIn, params.tokenOut);
      
      // Calculate estimates
      const estimate = {
        amountOut: await instance._calculateExpectedOutput(params),
        priceImpact: recommendation.expectedSlippage,
        gasCost: recommendation.expectedGasCost,
        timeEstimate: recommendation.timeEstimate,
        confidence: recommendation.confidenceScore,
        route: recommendation.path,
        risks: recommendation.risks
      };
      
      return estimate;
      
    } catch (error) {
      logger.error('Trade estimation failed:', error);
      throw error;
    }
  }

  /**
   * Get gas price recommendations
   */
  public static async getGasPrices() {
    const instance = TradingService.getInstance();
    
    try {
      const gasPrices = await instance.blockchain.getGasPrices();
      
      return {
        slow: gasPrices.slow,
        standard: gasPrices.standard,
        fast: gasPrices.fast,
        instant: gasPrices.instant,
        timestamp: Date.now()
      };
      
    } catch (error) {
      logger.error('Failed to fetch gas prices:', error);
      throw error;
    }
  }

  // Private helper methods

  private async _validateSwapParams(params: SwapParams) {
    if (!ethers.utils.isAddress(params.tokenIn)) {
      throw new Error('Invalid tokenIn address');
    }
    
    if (!ethers.utils.isAddress(params.tokenOut)) {
      throw new Error('Invalid tokenOut address');
    }
    
    if (ethers.BigNumber.from(params.amountIn).lte(0)) {
      throw new Error('Invalid amountIn');
    }
    
    if (params.deadline <= Date.now() / 1000) {
      throw new Error('Deadline has passed');
    }
  }

  private async _addToLimitOrderQueue(order: TradeOrder) {
    await this.redis.addToLimitOrderQueue(order);
  }

  private async _removeFromLimitOrderQueue(orderId: string) {
    await this.redis.removeFromLimitOrderQueue(orderId);
  }

  private async _estimateExecutionTime(order: TradeOrder): Promise<number> {
    if (order.type === 'limit') {
      const currentPrice = await this.blockchain.getCurrentPrice(order.tokenIn, order.tokenOut);
      const targetPrice = ethers.BigNumber.from(order.targetPrice!);
      
      // Simple estimation based on price difference
      const priceDiff = targetPrice.sub(currentPrice).abs();
      const percentageDiff = priceDiff.mul(100).div(currentPrice).toNumber();
      
      // Estimate time based on historical volatility
      return Math.max(300, percentageDiff * 3600); // Minimum 5 minutes
    }
    
    return 60; // 1 minute for market orders
  }

  private async _calculateExpectedOutput(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippageTolerance: number;
  }): Promise<string> {
    // Get current price from blockchain
    const price = await this.blockchain.getCurrentPrice(params.tokenIn, params.tokenOut);
    const amountIn = ethers.BigNumber.from(params.amountIn);
    
    // Calculate expected output with slippage
    const expectedOutput = amountIn.mul(price).div(ethers.constants.WeiPerEther);
    const slippageAmount = expectedOutput.mul(params.slippageTolerance * 100).div(10000);
    
    return expectedOutput.sub(slippageAmount).toString();
  }

  private _emitTradeUpdate(order: TradeOrder) {
    // This would emit WebSocket updates
    // Implementation depends on WebSocket service
    logger.info(`Trade update emitted for order ${order.id}: ${order.status}`);
  }
}