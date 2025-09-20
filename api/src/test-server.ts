import express from 'express';
import cors from 'cors';
import { generateTestToken } from './middleware/auth';

const app = express();
const PORT = 3001; // 使用不同端口避免冲突

// 基础中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        api: 'healthy',
        ai: 'mock-enabled'
      }
    }
  });
});

// 生成测试令牌
app.get('/api/v1/auth/test-token', (req, res) => {
  const token = generateTestToken();
  res.json({
    success: true,
    data: {
      token,
      message: 'Test token generated for API testing'
    }
  });
});

// AI路由优化 (Mock)
app.post('/api/v1/ai/route-optimization', (req, res) => {
  const { tokenIn, tokenOut, amountIn } = req.body;
  
  const mockResponse = {
    optimalPath: [tokenIn, tokenOut],
    expectedSlippage: 0.25,
    confidenceScore: 85,
    riskAssessment: {
      volatilityRisk: 30,
      liquidityRisk: 20,
      overallRisk: 25,
      warnings: []
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
      reason: 'Market conditions favorable'
    }
  };

  res.json({
    success: true,
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`,
      aiModel: 'claude-3-haiku-mock'
    }
  });
});

// 风险评估 (Mock)
app.post('/api/v1/ai/risk-assessment', (req, res) => {
  const mockResponse = {
    riskLevel: 'medium' as const,
    riskScore: 45,
    factors: [
      {
        factor: 'Market Volatility',
        impact: 60,
        description: 'Current market showing moderate volatility'
      },
      {
        factor: 'Liquidity Risk',
        impact: 30,
        description: 'Adequate liquidity available'
      }
    ],
    recommendations: [
      'Consider smaller position sizes',
      'Monitor market conditions closely'
    ]
  };

  res.json({
    success: true,
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`
    }
  });
});

// 市场时机分析 (Mock)
app.post('/api/v1/ai/market-timing', (req, res) => {
  const mockResponse = {
    recommendation: 'immediate' as const,
    confidence: 78,
    reasoning: 'Technical indicators suggest favorable entry point',
    optimalTimeWindow: 10
  };

  res.json({
    success: true,
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`
    }
  });
});

// 市场洞察 (Mock)
app.get('/api/v1/ai/market-insights', (req, res) => {
  const mockResponse = {
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
      'Monitor gas prices for optimal timing'
    ],
    recommendations: [
      'Consider DCA strategy for large positions',
      'Use MEV protection for high-value trades'
    ]
  };

  res.json({
    success: true,
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`,
      timeframe: req.query.timeframe || '24h'
    }
  });
});

// AI健康检查
app.get('/api/v1/ai/health', (req, res) => {
  const mockResponse = {
    status: 'healthy',
    capabilities: {
      routeOptimization: true,
      riskAssessment: true,
      marketTiming: true,
      strategyGeneration: true,
      portfolioOptimization: true
    },
    models: {
      primary: 'claude-3-haiku-mock',
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
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`
    }
  });
});

// 交易执行 (Mock)
app.post('/api/v1/trading/swap', (req, res) => {
  const { tokenIn, tokenOut, amountIn } = req.body;
  
  const mockResponse = {
    orderId: `order_${Date.now()}`,
    status: 'pending',
    tokenIn,
    tokenOut,
    amountIn,
    estimatedAmountOut: (parseFloat(amountIn) * 0.995).toString(),
    txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    gasUsed: '150000',
    gasPrice: '25000000000'
  };

  res.json({
    success: true,
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`
    }
  });
});

// 交易历史 (Mock)
app.get('/api/v1/trading/history', (req, res) => {
  const mockResponse = [
    {
      orderId: 'order_1',
      tokenIn: '0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e',
      tokenOut: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
      amountIn: '1000',
      amountOut: '995',
      status: 'completed',
      timestamp: Date.now() - 3600000,
      txHash: '0xabc123...'
    },
    {
      orderId: 'order_2',
      tokenIn: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
      tokenOut: '0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e',
      amountIn: '500',
      amountOut: '498',
      status: 'completed',
      timestamp: Date.now() - 7200000,
      txHash: '0xdef456...'
    }
  ];

  res.json({
    success: true,
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`,
      count: mockResponse.length
    }
  });
});

// 错误处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found'
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 RouteX Test API Server running on http://localhost:${PORT}`);
  console.log(`📚 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔑 Test Token: http://localhost:${PORT}/api/v1/auth/test-token`);
  console.log('🔗 Available Endpoints:');
  console.log('  - GET  /api/v1/health');
  console.log('  - GET  /api/v1/auth/test-token');
  console.log('  - POST /api/v1/ai/route-optimization');
  console.log('  - POST /api/v1/ai/risk-assessment');
  console.log('  - POST /api/v1/ai/market-timing');
  console.log('  - GET  /api/v1/ai/market-insights');
  console.log('  - GET  /api/v1/ai/health');
  console.log('  - POST /api/v1/trading/swap');
  console.log('  - GET  /api/v1/trading/history');
});

export default app;