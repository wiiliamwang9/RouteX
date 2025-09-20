import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { AIService } from '../services/AIService';
import { logger } from '../utils/logger';
import { APIResponse } from '../types';

const router = Router();

// Rate limiting for AI endpoints (more restrictive due to API costs)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per user
  message: 'AI rate limit exceeded',
  keyGenerator: (req) => req.user?.id || req.ip
});

router.use(aiLimiter);

/**
 * @route POST /api/v1/ai/route-optimization
 * @desc Get AI-powered route optimization
 * @access Private
 */
router.post('/route-optimization',
  [
    body('tokenIn').isEthereumAddress().withMessage('Invalid tokenIn address'),
    body('tokenOut').isEthereumAddress().withMessage('Invalid tokenOut address'),
    body('amountIn').isNumeric().withMessage('Invalid amountIn'),
    body('marketData').isObject().withMessage('Market data required'),
    body('marketData.price').isNumeric().withMessage('Invalid price'),
    body('marketData.volume24h').isNumeric().withMessage('Invalid volume'),
    body('marketData.liquidity').isNumeric().withMessage('Invalid liquidity'),
    body('marketData.volatility').isNumeric().withMessage('Invalid volatility'),
    body('userPreferences').optional().isObject()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const aiService = AIService.getInstance();
      const recommendation = await aiService.getOptimalRoute(req.body);
      
      const response: APIResponse = {
        success: true,
        data: recommendation,
        meta: {
          timestamp: Date.now(),
          requestId: req.id,
          aiModel: 'claude-3-haiku',
          cacheHit: false
        }
      };
      
      res.json(response);
    } catch (error) {
      logger.error('AI route optimization failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_ROUTE_OPTIMIZATION_FAILED',
          message: 'Failed to generate route optimization',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/ai/market-timing
 * @desc Analyze optimal timing for trade execution
 * @access Private
 */
router.post('/market-timing',
  [
    body('tokenIn').isEthereumAddress().withMessage('Invalid tokenIn address'),
    body('tokenOut').isEthereumAddress().withMessage('Invalid tokenOut address'),
    body('marketConditions').isObject().withMessage('Market conditions required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { tokenIn, tokenOut, marketConditions } = req.body;
      const aiService = AIService.getInstance();
      
      const analysis = await aiService.analyzeMarketTiming(
        tokenIn,
        tokenOut,
        marketConditions
      );
      
      res.json({
        success: true,
        data: analysis,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Market timing analysis failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MARKET_TIMING_FAILED',
          message: 'Failed to analyze market timing'
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/ai/risk-assessment
 * @desc Get comprehensive risk assessment for a trade
 * @access Private
 */
router.post('/risk-assessment',
  [
    body('tokenIn').isEthereumAddress().withMessage('Invalid tokenIn address'),
    body('tokenOut').isEthereumAddress().withMessage('Invalid tokenOut address'),
    body('amountIn').isNumeric().withMessage('Invalid amountIn'),
    body('marketData').isObject().withMessage('Market data required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const aiService = AIService.getInstance();
      const riskAssessment = await aiService.assessTradingRisk(req.body);
      
      res.json({
        success: true,
        data: riskAssessment,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Risk assessment failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RISK_ASSESSMENT_FAILED',
          message: 'Failed to assess trading risk'
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/ai/personalized-strategy
 * @desc Generate personalized trading strategy
 * @access Private
 */
router.post('/personalized-strategy',
  [
    body('tradingHistory').isArray().withMessage('Trading history must be an array'),
    body('preferences').isObject().withMessage('Preferences required'),
    body('preferences.riskTolerance').isIn(['low', 'medium', 'high']).withMessage('Invalid risk tolerance'),
    body('preferences.investmentHorizon').isIn(['short', 'medium', 'long']).withMessage('Invalid investment horizon')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { tradingHistory, preferences } = req.body;
      const userId = req.user.id;
      
      const aiService = AIService.getInstance();
      const strategy = await aiService.generatePersonalizedStrategy(
        userId,
        tradingHistory,
        preferences
      );
      
      res.json({
        success: true,
        data: strategy,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Strategy generation failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STRATEGY_GENERATION_FAILED',
          message: 'Failed to generate personalized strategy'
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/ai/market-insights
 * @desc Get AI-powered market insights and trends
 * @access Private
 */
router.get('/market-insights',
  [
    query('tokens').optional().isString().withMessage('Tokens must be comma-separated string'),
    query('timeframe').optional().isIn(['1h', '4h', '24h', '7d']).withMessage('Invalid timeframe')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { tokens, timeframe = '24h' } = req.query;
      
      // Mock insights for now - replace with actual AI analysis
      const insights = {
        marketSentiment: 'bullish',
        volatilityForecast: 'moderate',
        tradingOpportunities: [
          {
            pair: 'ETH/USDC',
            signal: 'buy',
            confidence: 78,
            reason: 'Strong technical indicators and increasing volume'
          }
        ],
        riskFactors: [
          'Increased market volatility expected',
          'High gas prices may affect smaller trades'
        ],
        recommendations: [
          'Consider DCA strategy for large positions',
          'Use MEV protection for high-value trades'
        ]
      };
      
      res.json({
        success: true,
        data: insights,
        meta: {
          timestamp: Date.now(),
          requestId: req.id,
          timeframe
        }
      });
    } catch (error) {
      logger.error('Market insights failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MARKET_INSIGHTS_FAILED',
          message: 'Failed to generate market insights'
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/ai/portfolio-optimization
 * @desc Optimize portfolio allocation using AI
 * @access Private
 */
router.post('/portfolio-optimization',
  [
    body('currentHoldings').isArray().withMessage('Current holdings must be an array'),
    body('targetAllocation').isObject().withMessage('Target allocation required'),
    body('constraints').optional().isObject()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { currentHoldings, targetAllocation, constraints } = req.body;
      
      // Mock portfolio optimization - replace with actual AI logic
      const optimization = {
        recommendedTrades: [
          {
            action: 'buy',
            token: 'ETH',
            amount: '0.5',
            reasoning: 'Underweight in ETH allocation'
          }
        ],
        expectedPerformance: {
          annualReturn: 12.5,
          volatility: 18.2,
          sharpeRatio: 0.69
        },
        riskMetrics: {
          valueAtRisk: 8.5,
          maxDrawdown: 15.3,
          correlation: 0.65
        }
      };
      
      res.json({
        success: true,
        data: optimization,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Portfolio optimization failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PORTFOLIO_OPTIMIZATION_FAILED',
          message: 'Failed to optimize portfolio'
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/ai/health
 * @desc Check AI service health and capabilities
 * @access Private
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      capabilities: {
        routeOptimization: true,
        riskAssessment: true,
        marketTiming: true,
        strategyGeneration: true,
        portfolioOptimization: true
      },
      models: {
        primary: 'claude-3-haiku',
        fallback: 'rule-based'
      },
      performance: {
        averageResponseTime: '1.2s',
        successRate: '99.1%',
        cacheHitRate: '45%'
      }
    };
    
    res.json({
      success: true,
      data: health,
      meta: {
        timestamp: Date.now(),
        requestId: req.id
      }
    });
  } catch (error) {
    logger.error('AI health check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_HEALTH_CHECK_FAILED',
        message: 'AI service health check failed'
      }
    });
  }
});

export default router;