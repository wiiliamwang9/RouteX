import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'eventemitter3';
import { ethers } from 'ethers';
import { WebSocketClient } from './WebSocketClient';
import { StrategyManager } from '../strategies/StrategyManager';
import { AIOptimizer } from '../ai/AIOptimizer';
import { CrossChainRouter } from '../crosschain/CrossChainRouter';
import {
  SwapParams,
  TradeOrder,
  QuantStrategy,
  APIResponse,
  RouteXConfig,
  TradeEstimate,
  GasPrices,
  PerformanceMetrics
} from '../types';

export class RouteXClient extends EventEmitter {
  private httpClient: AxiosInstance;
  private wsClient: WebSocketClient;
  public strategyManager: StrategyManager;
  public aiOptimizer: AIOptimizer;
  public crossChainRouter: CrossChainRouter;
  
  private config: RouteXConfig;
  private signer?: ethers.Signer;

  constructor(config: RouteXConfig) {
    super();
    
    this.config = {
      apiUrl: 'https://api.routex.io',
      wsUrl: 'wss://ws.routex.io',
      timeout: 30000,
      retries: 3,
      ...config
    };

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'User-Agent': `RouteX-SDK-TS/1.0.0`
      }
    });

    // Add request/response interceptors
    this.setupInterceptors();

    // Initialize WebSocket client
    this.wsClient = new WebSocketClient(this.config.wsUrl!, this.config.apiKey);
    this.setupWebSocketListeners();

    // Initialize sub-managers
    this.strategyManager = new StrategyManager(this);
    this.aiOptimizer = new AIOptimizer(this);
    this.crossChainRouter = new CrossChainRouter(this);

    if (this.config.signer) {
      this.setSigner(this.config.signer);
    }
  }

  /**
   * Set the Ethereum signer for transaction signing
   */
  public setSigner(signer: ethers.Signer): void {
    this.signer = signer;
  }

  /**
   * Get the current signer
   */
  public getSigner(): ethers.Signer | undefined {
    return this.signer;
  }

  /**
   * Execute immediate swap
   */
  public async executeSwap(params: SwapParams): Promise<TradeOrder> {
    try {
      const response = await this.httpClient.post<APIResponse<TradeOrder>>(
        '/api/v1/trading/swap',
        params
      );
      
      this.emit('swapExecuted', response.data.data);
      return response.data.data!;
    } catch (error) {
      this.emit('error', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Place limit order
   */
  public async placeLimitOrder(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    targetPrice: string;
    deadline: number;
  }): Promise<TradeOrder> {
    try {
      const response = await this.httpClient.post<APIResponse<TradeOrder>>(
        '/api/v1/trading/limit-order',
        params
      );
      
      this.emit('limitOrderPlaced', response.data.data);
      return response.data.data!;
    } catch (error) {
      this.emit('error', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Execute batch trades
   */
  public async executeBatchTrades(orders: SwapParams[]): Promise<{
    batchId: string;
    results: any[];
    totalOrders: number;
    successCount: number;
    failureCount: number;
  }> {
    try {
      const response = await this.httpClient.post<APIResponse>(
        '/api/v1/trading/batch',
        { orders }
      );
      
      this.emit('batchTradeExecuted', response.data.data);
      return response.data.data!;
    } catch (error) {
      this.emit('error', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get trade estimate
   */
  public async getTradeEstimate(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippageTolerance?: number;
  }): Promise<TradeEstimate> {
    try {
      const response = await this.httpClient.post<APIResponse<TradeEstimate>>(
        '/api/v1/trading/estimate',
        params
      );
      
      return response.data.data!;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get user's trading orders
   */
  public async getOrders(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    orders: TradeOrder[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const response = await this.httpClient.get<APIResponse>(
        '/api/v1/trading/orders',
        { params: options }
      );
      
      return response.data.data!;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get specific order by ID
   */
  public async getOrderById(orderId: string): Promise<TradeOrder | null> {
    try {
      const response = await this.httpClient.get<APIResponse<TradeOrder>>(
        `/api/v1/trading/orders/${orderId}`
      );
      
      return response.data.data!;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw this.handleApiError(error);
    }
  }

  /**
   * Cancel order
   */
  public async cancelOrder(orderId: string): Promise<{ orderId: string; status: string }> {
    try {
      const response = await this.httpClient.delete<APIResponse>(
        `/api/v1/trading/orders/${orderId}`
      );
      
      this.emit('orderCancelled', response.data.data);
      return response.data.data!;
    } catch (error) {
      this.emit('error', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get current gas prices
   */
  public async getGasPrices(): Promise<GasPrices> {
    try {
      const response = await this.httpClient.get<APIResponse<GasPrices>>(
        '/api/v1/trading/gas-price'
      );
      
      return response.data.data!;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get health status
   */
  public async getHealth(): Promise<any> {
    try {
      const response = await this.httpClient.get<APIResponse>(
        '/api/v1/health'
      );
      
      return response.data.data!;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  public subscribe(channels: string[]): void {
    this.wsClient.subscribe(channels);
  }

  /**
   * Unsubscribe from real-time updates
   */
  public unsubscribe(channels: string[]): void {
    this.wsClient.unsubscribe(channels);
  }

  /**
   * Connect WebSocket
   */
  public async connect(): Promise<void> {
    return this.wsClient.connect();
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    this.wsClient.disconnect();
  }

  /**
   * Get internal HTTP client for custom requests
   */
  public getHttpClient(): AxiosInstance {
    return this.httpClient;
  }

  /**
   * Get WebSocket client
   */
  public getWebSocketClient(): WebSocketClient {
    return this.wsClient;
  }

  // Private methods

  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        this.emit('requestStart', config);
        return config;
      },
      (error) => {
        this.emit('requestError', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        this.emit('requestComplete', response);
        return response;
      },
      async (error) => {
        this.emit('requestError', error);
        
        // Retry logic
        if (this.shouldRetry(error)) {
          return this.retryRequest(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  private setupWebSocketListeners(): void {
    this.wsClient.on('connected', () => {
      this.emit('connected');
    });

    this.wsClient.on('disconnected', () => {
      this.emit('disconnected');
    });

    this.wsClient.on('error', (error) => {
      this.emit('error', error);
    });

    this.wsClient.on('message', (message) => {
      this.handleWebSocketMessage(message);
    });
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'priceUpdate':
        this.emit('priceUpdate', message.data);
        break;
      case 'tradeUpdate':
        this.emit('tradeUpdate', message.data);
        break;
      case 'gasUpdate':
        this.emit('gasUpdate', message.data);
        break;
      case 'strategyUpdate':
        this.emit('strategyUpdate', message.data);
        break;
      default:
        this.emit('message', message);
    }
  }

  private shouldRetry(error: any): boolean {
    if (!this.config.retries || this.config.retries <= 0) {
      return false;
    }

    // Retry on network errors or 5xx status codes
    return !error.response || error.response.status >= 500;
  }

  private async retryRequest(config: AxiosRequestConfig, retryCount = 0): Promise<any> {
    if (retryCount >= (this.config.retries || 0)) {
      throw new Error('Max retries exceeded');
    }

    // Exponential backoff
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      return await this.httpClient.request(config);
    } catch (error) {
      if (this.shouldRetry(error)) {
        return this.retryRequest(config, retryCount + 1);
      }
      throw error;
    }
  }

  private handleApiError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        return new Error(`${apiError.code}: ${apiError.message}`);
      }
      
      if (error.response?.status) {
        return new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      
      if (error.request) {
        return new Error('Network error: No response received');
      }
    }
    
    return error instanceof Error ? error : new Error('Unknown error');
  }
}