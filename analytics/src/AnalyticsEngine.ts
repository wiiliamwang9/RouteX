import { EventEmitter } from 'events';
import { createClient } from 'redis';
import { Client } from '@elastic/elasticsearch';
import { Logger } from 'winston';
import { 
  TradeAnalytics, 
  StrategyPerformance, 
  RiskMetrics, 
  MarketAnalytics,
  UserBehaviorAnalytics 
} from './types/AnalyticsTypes';

export class AnalyticsEngine extends EventEmitter {
  private redis: any;
  private elasticsearch: Client;
  private logger: Logger;
  private metricsBuffer: Map<string, any[]> = new Map();
  private readonly BUFFER_SIZE = 1000;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor(config: {
    redisUrl: string;
    elasticsearchUrl: string;
    logger: Logger;
  }) {
    super();
    
    this.redis = createClient({ url: config.redisUrl });
    this.elasticsearch = new Client({ node: config.elasticsearchUrl });
    this.logger = config.logger;
    
    this.setupEventHandlers();
    this.startPeriodicFlush();
  }

  /**
   * Initialize analytics engine
   */
  public async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      await this.createElasticsearchIndices();
      this.logger.info('Analytics engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize analytics engine:', error);
      throw error;
    }
  }

  /**
   * Track trade execution
   */
  public async trackTrade(tradeData: {
    orderId: string;
    userId: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    slippage: number;
    gasUsed: string;
    gasPrice: string;
    executionTime: number;
    strategy?: string;
    aiRecommendation?: any;
    timestamp: number;
  }): Promise<void> {
    try {
      // Store in buffer for batch processing
      this.addToBuffer('trades', {
        ...tradeData,
        '@timestamp': new Date(tradeData.timestamp).toISOString()
      });

      // Update real-time metrics
      await this.updateTradeMetrics(tradeData);
      
      // Emit event for real-time processing
      this.emit('tradeTracked', tradeData);
      
    } catch (error) {
      this.logger.error('Failed to track trade:', error);
    }
  }

  /**
   * Track strategy performance
   */
  public async trackStrategyPerformance(strategyData: {
    strategyId: string;
    userId: string;
    strategyType: string;
    pnl: string;
    trades: number;
    successRate: number;
    avgExecutionTime: number;
    riskScore: number;
    timestamp: number;
  }): Promise<void> {
    try {
      this.addToBuffer('strategy_performance', {
        ...strategyData,
        '@timestamp': new Date(strategyData.timestamp).toISOString()
      });

      await this.updateStrategyMetrics(strategyData);
      this.emit('strategyTracked', strategyData);
      
    } catch (error) {
      this.logger.error('Failed to track strategy performance:', error);
    }
  }

  /**
   * Track user behavior
   */
  public async trackUserBehavior(behaviorData: {
    userId: string;
    action: string;
    endpoint?: string;
    parameters?: any;
    responseTime?: number;
    success: boolean;
    timestamp: number;
  }): Promise<void> {
    try {
      this.addToBuffer('user_behavior', {
        ...behaviorData,
        '@timestamp': new Date(behaviorData.timestamp).toISOString()
      });

      await this.updateUserMetrics(behaviorData);
      this.emit('behaviorTracked', behaviorData);
      
    } catch (error) {
      this.logger.error('Failed to track user behavior:', error);
    }
  }

  /**
   * Track market data and analysis
   */
  public async trackMarketData(marketData: {
    token: string;
    price: string;
    volume24h: string;
    liquidity: string;
    volatility: number;
    priceChange24h: string;
    timestamp: number;
  }): Promise<void> {
    try {
      this.addToBuffer('market_data', {
        ...marketData,
        '@timestamp': new Date(marketData.timestamp).toISOString()
      });

      await this.updateMarketMetrics(marketData);
      this.emit('marketDataTracked', marketData);
      
    } catch (error) {
      this.logger.error('Failed to track market data:', error);
    }
  }

  /**
   * Track MEV protection events
   */
  public async trackMEVEvent(mevData: {
    type: 'sandwich' | 'frontrun' | 'backrun' | 'arbitrage';
    detected: boolean;
    prevented: boolean;
    txHash?: string;
    blockNumber: number;
    gasPrice: string;
    mevValue?: string;
    protectionMethod: string;
    timestamp: number;
  }): Promise<void> {
    try {
      this.addToBuffer('mev_events', {
        ...mevData,
        '@timestamp': new Date(mevData.timestamp).toISOString()
      });

      await this.updateMEVMetrics(mevData);
      this.emit('mevEventTracked', mevData);
      
    } catch (error) {
      this.logger.error('Failed to track MEV event:', error);
    }
  }

  /**
   * Generate trade analytics report
   */
  public async generateTradeAnalytics(
    timeframe: string = '24h',
    filters?: any
  ): Promise<TradeAnalytics> {
    try {
      const query = this.buildElasticsearchQuery('trades', timeframe, filters);
      
      const response = await this.elasticsearch.search({
        index: 'routex-trades',
        body: {
          size: 0,
          query: query,
          aggs: {
            total_volume: { sum: { field: 'amountIn' } },
            total_trades: { value_count: { field: 'orderId' } },
            avg_slippage: { avg: { field: 'slippage' } },
            avg_execution_time: { avg: { field: 'executionTime' } },
            success_rate: {
              terms: { field: 'status' },
              aggs: {
                percentage: {
                  bucket_script: {
                    buckets_path: { success: '_count' },
                    script: 'params.success'
                  }
                }
              }
            },
            top_tokens: {
              terms: { field: 'tokenOut', size: 10 },
              aggs: {
                volume: { sum: { field: 'amountIn' } }
              }
            },
            hourly_volume: {
              date_histogram: {
                field: '@timestamp',
                calendar_interval: 'hour'
              },
              aggs: {
                volume: { sum: { field: 'amountIn' } }
              }
            }
          }
        }
      });

      return this.parseTradeAnalytics(response.body);
      
    } catch (error) {
      this.logger.error('Failed to generate trade analytics:', error);
      throw error;
    }
  }

  /**
   * Generate strategy performance report
   */
  public async generateStrategyAnalytics(
    strategyId?: string,
    timeframe: string = '7d'
  ): Promise<StrategyPerformance[]> {
    try {
      const filters = strategyId ? { strategyId } : {};
      const query = this.buildElasticsearchQuery('strategy_performance', timeframe, filters);
      
      const response = await this.elasticsearch.search({
        index: 'routex-strategy-performance',
        body: {
          size: 0,
          query: query,
          aggs: {
            strategies: {
              terms: { field: 'strategyId', size: 100 },
              aggs: {
                total_pnl: { sum: { field: 'pnl' } },
                avg_success_rate: { avg: { field: 'successRate' } },
                total_trades: { sum: { field: 'trades' } },
                avg_risk_score: { avg: { field: 'riskScore' } },
                performance_timeline: {
                  date_histogram: {
                    field: '@timestamp',
                    calendar_interval: 'day'
                  },
                  aggs: {
                    daily_pnl: { sum: { field: 'pnl' } }
                  }
                }
              }
            }
          }
        }
      });

      return this.parseStrategyAnalytics(response.body);
      
    } catch (error) {
      this.logger.error('Failed to generate strategy analytics:', error);
      throw error;
    }
  }

  /**
   * Generate risk metrics report
   */
  public async generateRiskMetrics(timeframe: string = '24h'): Promise<RiskMetrics> {
    try {
      const [tradeRisks, strategyRisks, marketRisks] = await Promise.all([
        this.calculateTradeRisks(timeframe),
        this.calculateStrategyRisks(timeframe),
        this.calculateMarketRisks(timeframe)
      ]);

      return {
        timestamp: Date.now(),
        timeframe,
        tradeRisks,
        strategyRisks,
        marketRisks,
        overallRiskScore: this.calculateOverallRisk(tradeRisks, strategyRisks, marketRisks)
      };
      
    } catch (error) {
      this.logger.error('Failed to generate risk metrics:', error);
      throw error;
    }
  }

  /**
   * Generate user behavior analytics
   */
  public async generateUserAnalytics(
    userId?: string,
    timeframe: string = '7d'
  ): Promise<UserBehaviorAnalytics> {
    try {
      const filters = userId ? { userId } : {};
      const query = this.buildElasticsearchQuery('user_behavior', timeframe, filters);
      
      const response = await this.elasticsearch.search({
        index: 'routex-user-behavior',
        body: {
          size: 0,
          query: query,
          aggs: {
            total_users: { cardinality: { field: 'userId' } },
            total_actions: { value_count: { field: 'action' } },
            avg_response_time: { avg: { field: 'responseTime' } },
            success_rate: {
              terms: { field: 'success' }
            },
            popular_actions: {
              terms: { field: 'action', size: 20 }
            },
            user_activity: {
              date_histogram: {
                field: '@timestamp',
                calendar_interval: 'hour'
              },
              aggs: {
                unique_users: { cardinality: { field: 'userId' } }
              }
            }
          }
        }
      });

      return this.parseUserAnalytics(response.body);
      
    } catch (error) {
      this.logger.error('Failed to generate user analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics
   */
  public async getRealTimeMetrics(): Promise<any> {
    try {
      const [tradeMetrics, strategyMetrics, systemMetrics] = await Promise.all([
        this.redis.hGetAll('metrics:trades:realtime'),
        this.redis.hGetAll('metrics:strategies:realtime'),
        this.redis.hGetAll('metrics:system:realtime')
      ]);

      return {
        timestamp: Date.now(),
        trades: this.parseRedisMetrics(tradeMetrics),
        strategies: this.parseRedisMetrics(strategyMetrics),
        system: this.parseRedisMetrics(systemMetrics)
      };
      
    } catch (error) {
      this.logger.error('Failed to get real-time metrics:', error);
      throw error;
    }
  }

  // Private methods

  private addToBuffer(type: string, data: any): void {
    if (!this.metricsBuffer.has(type)) {
      this.metricsBuffer.set(type, []);
    }
    
    const buffer = this.metricsBuffer.get(type)!;
    buffer.push(data);
    
    if (buffer.length >= this.BUFFER_SIZE) {
      this.flushBuffer(type);
    }
  }

  private async flushBuffer(type: string): Promise<void> {
    const buffer = this.metricsBuffer.get(type);
    if (!buffer || buffer.length === 0) return;

    try {
      await this.elasticsearch.bulk({
        index: `routex-${type.replace('_', '-')}`,
        body: buffer.flatMap(doc => [
          { index: {} },
          doc
        ])
      });

      this.metricsBuffer.set(type, []);
      this.logger.debug(`Flushed ${buffer.length} ${type} records to Elasticsearch`);
      
    } catch (error) {
      this.logger.error(`Failed to flush ${type} buffer:`, error);
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      for (const type of this.metricsBuffer.keys()) {
        this.flushBuffer(type);
      }
    }, this.FLUSH_INTERVAL);
  }

  private async createElasticsearchIndices(): Promise<void> {
    const indices = [
      'routex-trades',
      'routex-strategy-performance',
      'routex-user-behavior',
      'routex-market-data',
      'routex-mev-events'
    ];

    for (const index of indices) {
      try {
        const exists = await this.elasticsearch.indices.exists({ index });
        if (!exists.body) {
          await this.elasticsearch.indices.create({
            index,
            body: {
              mappings: this.getIndexMapping(index)
            }
          });
          this.logger.info(`Created Elasticsearch index: ${index}`);
        }
      } catch (error) {
        this.logger.error(`Failed to create index ${index}:`, error);
      }
    }
  }

  private getIndexMapping(index: string): any {
    const baseMapping = {
      properties: {
        '@timestamp': { type: 'date' },
        userId: { type: 'keyword' }
      }
    };

    switch (index) {
      case 'routex-trades':
        return {
          ...baseMapping,
          properties: {
            ...baseMapping.properties,
            orderId: { type: 'keyword' },
            tokenIn: { type: 'keyword' },
            tokenOut: { type: 'keyword' },
            amountIn: { type: 'long' },
            amountOut: { type: 'long' },
            slippage: { type: 'float' },
            gasUsed: { type: 'long' },
            gasPrice: { type: 'long' },
            executionTime: { type: 'long' }
          }
        };
      
      case 'routex-strategy-performance':
        return {
          ...baseMapping,
          properties: {
            ...baseMapping.properties,
            strategyId: { type: 'keyword' },
            strategyType: { type: 'keyword' },
            pnl: { type: 'long' },
            trades: { type: 'long' },
            successRate: { type: 'float' },
            riskScore: { type: 'float' }
          }
        };
      
      default:
        return baseMapping;
    }
  }

  private buildElasticsearchQuery(type: string, timeframe: string, filters?: any): any {
    const must = [
      {
        range: {
          '@timestamp': {
            gte: `now-${timeframe}`
          }
        }
      }
    ];

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        must.push({
          term: { [key]: value }
        });
      });
    }

    return { bool: { must } };
  }

  private parseTradeAnalytics(response: any): TradeAnalytics {
    const aggregations = response.aggregations;
    
    return {
      totalVolume: aggregations.total_volume.value || 0,
      totalTrades: aggregations.total_trades.value || 0,
      averageSlippage: aggregations.avg_slippage.value || 0,
      averageExecutionTime: aggregations.avg_execution_time.value || 0,
      successRate: this.calculateSuccessRate(aggregations.success_rate),
      topTokens: aggregations.top_tokens.buckets.map((bucket: any) => ({
        token: bucket.key,
        volume: bucket.volume.value,
        trades: bucket.doc_count
      })),
      hourlyVolume: aggregations.hourly_volume.buckets.map((bucket: any) => ({
        timestamp: bucket.key,
        volume: bucket.volume.value
      }))
    };
  }

  private parseStrategyAnalytics(response: any): StrategyPerformance[] {
    const strategies = response.aggregations.strategies.buckets;
    
    return strategies.map((strategy: any) => ({
      strategyId: strategy.key,
      totalPnL: strategy.total_pnl.value,
      averageSuccessRate: strategy.avg_success_rate.value,
      totalTrades: strategy.total_trades.value,
      averageRiskScore: strategy.avg_risk_score.value,
      performanceTimeline: strategy.performance_timeline.buckets.map((bucket: any) => ({
        timestamp: bucket.key,
        pnl: bucket.daily_pnl.value
      }))
    }));
  }

  private parseUserAnalytics(response: any): UserBehaviorAnalytics {
    const aggregations = response.aggregations;
    
    return {
      totalUsers: aggregations.total_users.value,
      totalActions: aggregations.total_actions.value,
      averageResponseTime: aggregations.avg_response_time.value,
      successRate: this.calculateSuccessRate(aggregations.success_rate),
      popularActions: aggregations.popular_actions.buckets.map((bucket: any) => ({
        action: bucket.key,
        count: bucket.doc_count
      })),
      userActivity: aggregations.user_activity.buckets.map((bucket: any) => ({
        timestamp: bucket.key,
        uniqueUsers: bucket.unique_users.value
      }))
    };
  }

  private calculateSuccessRate(successRateAgg: any): number {
    const buckets = successRateAgg.buckets;
    const successBucket = buckets.find((b: any) => b.key === true);
    const totalCount = buckets.reduce((sum: number, b: any) => sum + b.doc_count, 0);
    
    return totalCount > 0 ? (successBucket?.doc_count || 0) / totalCount : 0;
  }

  private parseRedisMetrics(metrics: any): any {
    const parsed: any = {};
    
    Object.entries(metrics).forEach(([key, value]) => {
      try {
        parsed[key] = JSON.parse(value as string);
      } catch {
        parsed[key] = value;
      }
    });
    
    return parsed;
  }

  private async updateTradeMetrics(tradeData: any): Promise<void> {
    const key = 'metrics:trades:realtime';
    const multi = this.redis.multi();
    
    multi.hIncrBy(key, 'total_trades', 1);
    multi.hIncrByFloat(key, 'total_volume', parseFloat(tradeData.amountIn));
    multi.hIncrByFloat(key, 'total_slippage', tradeData.slippage);
    multi.hIncrBy(key, 'total_gas_used', parseInt(tradeData.gasUsed));
    
    await multi.exec();
  }

  private async updateStrategyMetrics(strategyData: any): Promise<void> {
    const key = 'metrics:strategies:realtime';
    const multi = this.redis.multi();
    
    multi.hIncrBy(key, 'active_strategies', 1);
    multi.hIncrByFloat(key, 'total_pnl', parseFloat(strategyData.pnl));
    multi.hIncrBy(key, 'total_strategy_trades', strategyData.trades);
    
    await multi.exec();
  }

  private async updateUserMetrics(behaviorData: any): Promise<void> {
    const key = 'metrics:users:realtime';
    const multi = this.redis.multi();
    
    multi.hIncrBy(key, 'total_actions', 1);
    if (behaviorData.responseTime) {
      multi.hIncrByFloat(key, 'total_response_time', behaviorData.responseTime);
    }
    
    await multi.exec();
  }

  private async updateMarketMetrics(marketData: any): Promise<void> {
    const key = 'metrics:market:realtime';
    const multi = this.redis.multi();
    
    multi.hSet(key, `price:${marketData.token}`, marketData.price);
    multi.hSet(key, `volume:${marketData.token}`, marketData.volume24h);
    multi.hSet(key, `volatility:${marketData.token}`, marketData.volatility.toString());
    
    await multi.exec();
  }

  private async updateMEVMetrics(mevData: any): Promise<void> {
    const key = 'metrics:mev:realtime';
    const multi = this.redis.multi();
    
    multi.hIncrBy(key, `${mevData.type}_detected`, mevData.detected ? 1 : 0);
    multi.hIncrBy(key, `${mevData.type}_prevented`, mevData.prevented ? 1 : 0);
    
    await multi.exec();
  }

  private async calculateTradeRisks(timeframe: string): Promise<any> {
    // Implementation for trade risk calculation
    return {};
  }

  private async calculateStrategyRisks(timeframe: string): Promise<any> {
    // Implementation for strategy risk calculation
    return {};
  }

  private async calculateMarketRisks(timeframe: string): Promise<any> {
    // Implementation for market risk calculation
    return {};
  }

  private calculateOverallRisk(tradeRisks: any, strategyRisks: any, marketRisks: any): number {
    // Implementation for overall risk calculation
    return 0;
  }

  private setupEventHandlers(): void {
    this.on('error', (error) => {
      this.logger.error('Analytics engine error:', error);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      await this.shutdown();
    });

    process.on('SIGINT', async () => {
      await this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down analytics engine...');
    
    // Flush all buffers
    for (const type of this.metricsBuffer.keys()) {
      await this.flushBuffer(type);
    }
    
    // Close connections
    await this.redis.quit();
    await this.elasticsearch.close();
    
    this.logger.info('Analytics engine shutdown complete');
  }
}