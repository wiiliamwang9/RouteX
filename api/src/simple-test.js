const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;

// 基础中间件
app.use(cors());
app.use(express.json());

// 生成测试令牌的函数
function generateTestToken() {
  return jwt.sign(
    {
      id: 'test-user',
      address: '0x1234567890123456789012345678901234567890',
      role: 'trader'
    },
    'test-secret',
    { expiresIn: '24h' }
  );
}

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
        ai: 'mock-enabled',
        blockchain: 'mock-enabled'
      },
      environment: 'test'
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
      message: 'Test token generated for API testing',
      usage: 'Add to Authorization header as: Bearer ' + token
    }
  });
});

// AI路由优化
app.post('/api/v1/ai/route-optimization', (req, res) => {
  const { tokenIn, tokenOut, amountIn, marketData, userPreferences } = req.body;
  
  const mockResponse = {
    optimalPath: [tokenIn, tokenOut],
    expectedSlippage: 0.25,
    confidenceScore: 85,
    riskAssessment: {
      volatilityRisk: 30,
      liquidityRisk: 20,
      overallRisk: 25,
      warnings: marketData?.volatility > 50 ? ['High volatility detected'] : []
    },
    gasPriceRecommendation: {
      slow: '20',
      standard: '25',
      fast: '30',
      optimal: userPreferences?.prioritizeSpeed ? '30' : '25'
    },
    timingRecommendation: {
      executeNow: true,
      optimalTimeWindow: 5,
      reason: 'Market conditions favorable for execution'
    }
  };

  res.json({
    success: true,
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`,
      aiModel: 'claude-3-haiku-mock',
      cacheHit: false
    }
  });
});

// 风险评估
app.post('/api/v1/ai/risk-assessment', (req, res) => {
  const { tokenIn, tokenOut, amountIn, marketData } = req.body;
  
  const volatilityRisk = marketData?.volatility || 30;
  const liquidityRisk = marketData?.liquidity < 10000 ? 70 : 20;
  const overallRisk = Math.min(100, (volatilityRisk + liquidityRisk) / 2);
  
  let riskLevel = 'low';
  if (overallRisk > 60) riskLevel = 'high';
  else if (overallRisk > 30) riskLevel = 'medium';

  const mockResponse = {
    riskLevel,
    riskScore: overallRisk,
    factors: [
      {
        factor: 'Market Volatility',
        impact: volatilityRisk,
        description: `Current volatility: ${volatilityRisk}%`
      },
      {
        factor: 'Liquidity Risk',
        impact: liquidityRisk,
        description: `Available liquidity: $${marketData?.liquidity || 'N/A'}`
      }
    ],
    recommendations: [
      overallRisk > 50 ? 'Consider smaller position sizes' : 'Position size acceptable',
      'Monitor market conditions closely',
      volatilityRisk > 50 ? 'Wait for lower volatility' : 'Volatility within acceptable range'
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

// 市场时机分析
app.post('/api/v1/ai/market-timing', (req, res) => {
  const { tokenIn, tokenOut, marketConditions } = req.body;
  
  const volume = marketConditions?.volume24h || 0;
  const volatility = marketConditions?.volatility || 30;
  
  let recommendation = 'immediate';
  let confidence = 75;
  let reasoning = 'Market conditions are favorable';
  
  if (volatility > 80) {
    recommendation = 'wait';
    confidence = 85;
    reasoning = 'High volatility detected, recommend waiting for stabilization';
  } else if (volume < 1000) {
    recommendation = 'avoid';
    confidence = 90;
    reasoning = 'Low volume may result in high slippage';
  }

  const mockResponse = {
    recommendation,
    confidence,
    reasoning,
    optimalTimeWindow: recommendation === 'wait' ? 30 : 10
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

// 市场洞察
app.get('/api/v1/ai/market-insights', (req, res) => {
  const { tokens, timeframe = '24h' } = req.query;
  
  const mockResponse = {
    marketSentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
    volatilityForecast: 'moderate',
    tradingOpportunities: [
      {
        pair: 'ETH/USDC',
        signal: 'buy',
        confidence: 78,
        reason: 'Strong technical indicators and increasing volume'
      },
      {
        pair: 'BTC/USDC',
        signal: 'hold',
        confidence: 65,
        reason: 'Consolidation phase, wait for breakout'
      }
    ],
    riskFactors: [
      'Increased market volatility expected in next 4 hours',
      'Monitor gas prices for optimal timing',
      'Large whale movements detected'
    ],
    recommendations: [
      'Consider DCA strategy for large positions',
      'Use MEV protection for high-value trades',
      'Set appropriate slippage tolerances'
    ]
  };

  res.json({
    success: true,
    data: mockResponse,
    meta: {
      timestamp: Date.now(),
      requestId: `req_${Date.now()}`,
      timeframe,
      tokens: tokens || 'all'
    }
  });
});

// 个性化策略生成
app.post('/api/v1/ai/personalized-strategy', (req, res) => {
  const { tradingHistory, preferences } = req.body;
  
  const strategyTypes = ['arbitrage', 'grid', 'dca', 'momentum'];
  const recommendedStrategy = strategyTypes[Math.floor(Math.random() * strategyTypes.length)];
  
  const mockResponse = {
    strategy: recommendedStrategy,
    parameters: {
      riskLevel: preferences?.riskTolerance || 'medium',
      positionSize: preferences?.riskTolerance === 'high' ? '5%' : '2%',
      stopLoss: '3%',
      takeProfit: '8%',
      rebalanceFrequency: preferences?.investmentHorizon === 'short' ? 'daily' : 'weekly'
    },
    expectedPerformance: {
      annualReturn: preferences?.riskTolerance === 'high' ? 15.5 : 8.2,
      maxDrawdown: preferences?.riskTolerance === 'high' ? 25.0 : 12.0,
      sharpeRatio: 1.2
    },
    recommendations: [
      `${recommendedStrategy.charAt(0).toUpperCase() + recommendedStrategy.slice(1)} strategy suits your profile`,
      'Start with smaller positions to test performance',
      'Review and adjust parameters monthly'
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

// 投资组合优化
app.post('/api/v1/ai/portfolio-optimization', (req, res) => {
  const { currentHoldings, targetAllocation, constraints } = req.body;
  
  const mockResponse = {
    recommendedTrades: [
      {
        action: 'buy',
        token: 'ETH',
        amount: '0.5',
        reasoning: 'Underweight in ETH allocation',
        priority: 'high'
      },
      {
        action: 'sell',
        token: 'USDC',
        amount: '1000',
        reasoning: 'Overweight in stablecoins',
        priority: 'medium'
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
    },
    rebalancingCost: {
      gasEstimate: '0.025 ETH',
      slippageImpact: '0.15%',
      totalCost: '$45.20'
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
      cacheHitRate: '45%',
      requestsToday: 1247
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

// 交易相关端点
app.post('/api/v1/trading/swap', (req, res) => {
  const { tokenIn, tokenOut, amountIn, slippage = 0.5 } = req.body;
  
  const estimatedOut = parseFloat(amountIn) * (1 - slippage / 100);
  
  const mockResponse = {
    orderId: `order_${Date.now()}`,
    status: 'pending',
    tokenIn,
    tokenOut,
    amountIn,
    estimatedAmountOut: estimatedOut.toString(),
    slippage,
    txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    gasUsed: '150000',
    gasPrice: '25000000000',
    timestamp: Date.now()
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

// 交易历史
app.get('/api/v1/trading/history', (req, res) => {
  const mockResponse = [
    {
      orderId: 'order_1',
      tokenIn: '0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e',
      tokenOut: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
      amountIn: '1000',
      amountOut: '995.5',
      status: 'completed',
      timestamp: Date.now() - 3600000,
      txHash: '0xabc123def456...',
      gasUsed: '142350'
    },
    {
      orderId: 'order_2',
      tokenIn: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
      tokenOut: '0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e',
      amountIn: '500',
      amountOut: '498.2',
      status: 'completed',
      timestamp: Date.now() - 7200000,
      txHash: '0xdef456ghi789...',
      gasUsed: '138920'
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

// 跨链相关
app.post('/api/v1/cross-chain/quote', (req, res) => {
  const { fromChain, toChain, tokenIn, tokenOut, amountIn } = req.body;
  
  const mockResponse = {
    fromChain,
    toChain,
    tokenIn,
    tokenOut,
    amountIn,
    amountOut: (parseFloat(amountIn) * 0.99).toString(), // 1% cross-chain fee
    fee: (parseFloat(amountIn) * 0.01).toString(),
    estimatedTime: '5-10 minutes',
    bridge: 'LayerZero',
    route: [
      { chain: fromChain, token: tokenIn },
      { chain: toChain, token: tokenOut }
    ],
    confidence: 'high'
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

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred'
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found',
      path: req.originalUrl
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 RouteX Test API Server running on http://localhost:${PORT}`);
  console.log(`\n📚 Available Endpoints:`);
  console.log(`  Health Check:     GET  http://localhost:${PORT}/api/v1/health`);
  console.log(`  Test Token:       GET  http://localhost:${PORT}/api/v1/auth/test-token`);
  console.log(`  AI Route Opt:     POST http://localhost:${PORT}/api/v1/ai/route-optimization`);
  console.log(`  AI Risk:          POST http://localhost:${PORT}/api/v1/ai/risk-assessment`);
  console.log(`  AI Timing:        POST http://localhost:${PORT}/api/v1/ai/market-timing`);
  console.log(`  AI Insights:      GET  http://localhost:${PORT}/api/v1/ai/market-insights`);
  console.log(`  AI Strategy:      POST http://localhost:${PORT}/api/v1/ai/personalized-strategy`);
  console.log(`  AI Portfolio:     POST http://localhost:${PORT}/api/v1/ai/portfolio-optimization`);
  console.log(`  AI Health:        GET  http://localhost:${PORT}/api/v1/ai/health`);
  console.log(`  Trading Swap:     POST http://localhost:${PORT}/api/v1/trading/swap`);
  console.log(`  Trading History:  GET  http://localhost:${PORT}/api/v1/trading/history`);
  console.log(`  Cross-chain:      POST http://localhost:${PORT}/api/v1/cross-chain/quote`);
  console.log(`\n🔧 Ready for testing!`);
});