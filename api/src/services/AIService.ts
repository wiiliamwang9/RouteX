import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { RedisService } from './RedisService';

export interface AIAnalysisRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  marketData: {
    price: number;
    volume24h: number;
    liquidity: number;
    volatility: number;
  };
  userPreferences?: {
    riskTolerance: 'low' | 'medium' | 'high';
    maxSlippage: number;
    prioritizeSpeed: boolean;
  };
}

export interface AIRouteRecommendation {
  optimalPath: string[];
  expectedSlippage: number;
  confidenceScore: number;
  riskAssessment: {
    volatilityRisk: number;
    liquidityRisk: number;
    overallRisk: number;
    warnings: string[];
  };
  gasPriceRecommendation: {
    slow: string;
    standard: string;
    fast: string;
    optimal: string;
  };
  timingRecommendation: {
    executeNow: boolean;
    optimalTimeWindow: number;
    reason: string;
  };
}

export class AIService {
  private static instance: AIService;
  private claudeClient: AxiosInstance;
  private redis: RedisService;
  private readonly cachePrefix = 'ai_analysis:';
  private readonly cacheTTL = 300; // 5 minutes

  private constructor() {
    this.redis = RedisService.getInstance();
    
    // Initialize Claude API client
    this.claudeClient = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01'
      }
    });

    this.setupInterceptors();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Validate API key
      if (!process.env.CLAUDE_API_KEY) {
        logger.warn('Claude API key not configured. AI features will be limited.');
        return;
      }

      // Test connection
      await this.testConnection();
      logger.info('AI Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Service:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered route optimization
   */
  public async getOptimalRoute(request: AIAnalysisRequest): Promise<AIRouteRecommendation> {
    try {
      const cacheKey = this.getCacheKey('route', request);
      
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached AI route recommendation');
        return JSON.parse(cached);
      }

      const prompt = this.buildRouteOptimizationPrompt(request);
      const analysis = await this.queryAI(prompt);
      const recommendation = this.parseRouteRecommendation(analysis);

      // Cache the result
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(recommendation));

      logger.info(`AI route recommendation generated for ${request.tokenIn} -> ${request.tokenOut}`);
      return recommendation;

    } catch (error) {
      logger.error('AI route optimization failed:', error);
      // Return fallback recommendation
      return this.getFallbackRecommendation(request);
    }
  }

  /**
   * Analyze market sentiment and timing
   */
  public async analyzeMarketTiming(
    tokenIn: string,
    tokenOut: string,
    marketConditions: any
  ): Promise<{
    recommendation: 'immediate' | 'wait' | 'avoid';
    confidence: number;
    reasoning: string;
    optimalTimeWindow?: number;
  }> {
    try {
      const cacheKey = this.getCacheKey('timing', { tokenIn, tokenOut, ...marketConditions });
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const prompt = this.buildTimingAnalysisPrompt(tokenIn, tokenOut, marketConditions);
      const analysis = await this.queryAI(prompt);
      const result = this.parseTimingAnalysis(analysis);

      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
      return result;

    } catch (error) {
      logger.error('Market timing analysis failed:', error);
      return {
        recommendation: 'immediate',
        confidence: 50,
        reasoning: 'AI analysis unavailable, proceeding with standard execution'
      };
    }
  }

  /**
   * Assess trading risks using AI
   */
  public async assessTradingRisk(request: AIAnalysisRequest): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    recommendations: string[];
  }> {
    try {
      const prompt = this.buildRiskAssessmentPrompt(request);
      const analysis = await this.queryAI(prompt);
      return this.parseRiskAssessment(analysis);

    } catch (error) {
      logger.error('Risk assessment failed:', error);
      return {
        riskLevel: 'medium',
        riskScore: 50,
        factors: [],
        recommendations: ['AI risk assessment unavailable, proceed with caution']
      };
    }
  }

  /**
   * Generate personalized trading strategy
   */
  public async generatePersonalizedStrategy(
    userId: string,
    tradingHistory: any[],
    preferences: any
  ): Promise<{
    strategy: string;
    parameters: Record<string, any>;
    expectedPerformance: {
      annualReturn: number;
      maxDrawdown: number;
      sharpeRatio: number;
    };
    recommendations: string[];
  }> {
    try {
      const prompt = this.buildStrategyGenerationPrompt(userId, tradingHistory, preferences);
      const analysis = await this.queryAI(prompt);
      return this.parseStrategyRecommendation(analysis);

    } catch (error) {
      logger.error('Strategy generation failed:', error);
      throw new Error('Unable to generate personalized strategy');
    }
  }

  // Private methods

  private async queryAI(prompt: string): Promise<string> {
    try {
      const response = await this.claudeClient.post('/messages', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.data.content[0].text;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Claude API error:', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message
        });
      }
      throw new Error('AI analysis failed');
    }
  }

  private buildRouteOptimizationPrompt(request: AIAnalysisRequest): string {
    return `
As a DeFi trading expert, analyze the following swap request and provide optimal routing recommendations:

Trading Request:
- Token In: ${request.tokenIn}
- Token Out: ${request.tokenOut}
- Amount: ${request.amountIn}

Market Data:
- Current Price: $${request.marketData.price}
- 24h Volume: $${request.marketData.volume24h}
- Liquidity: $${request.marketData.liquidity}
- Volatility: ${request.marketData.volatility}%

User Preferences:
- Risk Tolerance: ${request.userPreferences?.riskTolerance || 'medium'}
- Max Slippage: ${request.userPreferences?.maxSlippage || 0.5}%
- Prioritize Speed: ${request.userPreferences?.prioritizeSpeed || false}

Please provide a JSON response with:
1. Optimal execution path and percentages
2. Expected slippage and confidence score
3. Risk assessment with specific warnings
4. Gas price recommendations
5. Timing recommendations

Format your response as valid JSON only.
    `.trim();
  }

  private buildTimingAnalysisPrompt(tokenIn: string, tokenOut: string, conditions: any): string {
    return `
Analyze market timing for this trade:

Pair: ${tokenIn}/${tokenOut}
Market Conditions: ${JSON.stringify(conditions, null, 2)}

Consider:
- Current volatility and trend
- Liquidity patterns
- Gas price trends
- MEV risks

Recommend: immediate, wait, or avoid
Provide confidence (0-100) and reasoning.
If wait, suggest optimal time window in minutes.

Respond in JSON format only.
    `.trim();
  }

  private buildRiskAssessmentPrompt(request: AIAnalysisRequest): string {
    return `
Assess trading risks for:
${JSON.stringify(request, null, 2)}

Analyze:
- Volatility risk
- Liquidity risk  
- Slippage risk
- MEV risk
- Smart contract risk

Provide risk level (low/medium/high), score (0-100), 
key factors with impact ratings, and recommendations.

Respond in JSON format only.
    `.trim();
  }

  private buildStrategyGenerationPrompt(userId: string, history: any[], preferences: any): string {
    return `
Generate personalized trading strategy for user ${userId}:

Trading History:
${JSON.stringify(history.slice(-10), null, 2)}

Preferences:
${JSON.stringify(preferences, null, 2)}

Create strategy with:
- Strategy type and parameters
- Expected performance metrics
- Risk management rules
- Specific recommendations

Respond in JSON format only.
    `.trim();
  }

  private parseRouteRecommendation(analysis: string): AIRouteRecommendation {
    try {
      const parsed = JSON.parse(analysis);
      return {
        optimalPath: parsed.optimalPath || ['direct'],
        expectedSlippage: parsed.expectedSlippage || 0.5,
        confidenceScore: Math.min(100, Math.max(0, parsed.confidenceScore || 75)),
        riskAssessment: {
          volatilityRisk: parsed.riskAssessment?.volatilityRisk || 50,
          liquidityRisk: parsed.riskAssessment?.liquidityRisk || 30,
          overallRisk: parsed.riskAssessment?.overallRisk || 40,
          warnings: parsed.riskAssessment?.warnings || []
        },
        gasPriceRecommendation: {
          slow: parsed.gasPriceRecommendation?.slow || '20',
          standard: parsed.gasPriceRecommendation?.standard || '25',
          fast: parsed.gasPriceRecommendation?.fast || '30',
          optimal: parsed.gasPriceRecommendation?.optimal || '25'
        },
        timingRecommendation: {
          executeNow: parsed.timingRecommendation?.executeNow !== false,
          optimalTimeWindow: parsed.timingRecommendation?.optimalTimeWindow || 5,
          reason: parsed.timingRecommendation?.reason || 'Conditions are favorable'
        }
      };
    } catch (error) {
      logger.error('Failed to parse AI route recommendation:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private parseTimingAnalysis(analysis: string): any {
    try {
      return JSON.parse(analysis);
    } catch (error) {
      logger.error('Failed to parse timing analysis:', error);
      return {
        recommendation: 'immediate',
        confidence: 50,
        reasoning: 'Analysis parsing failed'
      };
    }
  }

  private parseRiskAssessment(analysis: string): any {
    try {
      return JSON.parse(analysis);
    } catch (error) {
      logger.error('Failed to parse risk assessment:', error);
      return {
        riskLevel: 'medium',
        riskScore: 50,
        factors: [],
        recommendations: ['Analysis parsing failed']
      };
    }
  }

  private parseStrategyRecommendation(analysis: string): any {
    try {
      return JSON.parse(analysis);
    } catch (error) {
      logger.error('Failed to parse strategy recommendation:', error);
      throw new Error('Strategy parsing failed');
    }
  }

  private getFallbackRecommendation(request: AIAnalysisRequest): AIRouteRecommendation {
    return {
      optimalPath: [request.tokenIn, request.tokenOut],
      expectedSlippage: 0.5,
      confidenceScore: 60,
      riskAssessment: {
        volatilityRisk: 50,
        liquidityRisk: 40,
        overallRisk: 45,
        warnings: ['AI analysis unavailable, using fallback recommendation']
      },
      gasPriceRecommendation: {
        slow: '20',
        standard: '25',
        fast: '30',
        optimal: '25'
      },
      timingRecommendation: {
        executeNow: true,
        optimalTimeWindow: 5,
        reason: 'Fallback recommendation - proceed with standard execution'
      }
    };
  }

  private getCacheKey(type: string, data: any): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `${this.cachePrefix}${type}:${hash}`;
  }

  private async testConnection(): Promise<void> {
    try {
      await this.claudeClient.post('/messages', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      });
      logger.info('Claude API connection test successful');
    } catch (error) {
      logger.error('Claude API connection test failed:', error);
      throw error;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.claudeClient.interceptors.request.use(
      (config) => {
        logger.debug('AI API request:', { url: config.url, method: config.method });
        return config;
      },
      (error) => {
        logger.error('AI API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.claudeClient.interceptors.response.use(
      (response) => {
        logger.debug('AI API response received');
        return response;
      },
      (error) => {
        logger.error('AI API response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }
}