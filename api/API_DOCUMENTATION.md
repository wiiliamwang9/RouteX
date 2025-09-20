# RouteX API Documentation

## 🚀 快速开始

**Base URL**: `http://localhost:3001/api/v1`  
**版本**: v1.0.0  
**认证**: Bearer Token (某些端点需要)

## 🔐 认证

### 获取测试令牌
```bash
GET /auth/test-token
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Test token generated for API testing",
    "usage": "Add to Authorization header as: Bearer <token>"
  }
}
```

**使用方式**:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json'
}
```

---

## 🏥 健康检查

### 系统健康状态
```bash
GET /health
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-20T08:08:16.371Z",
    "version": "1.0.0",
    "services": {
      "api": "healthy",
      "ai": "mock-enabled",
      "blockchain": "mock-enabled"
    },
    "environment": "test"
  }
}
```

---

## 🤖 AI服务端点

### 1. AI路由优化
**智能路径推荐和交易优化**

```bash
POST /ai/route-optimization
```

**请求体**:
```json
{
  "tokenIn": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e",
  "tokenOut": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "amountIn": "1000",
  "marketData": {
    "price": 1500,
    "volume24h": 50000,
    "liquidity": 100000,
    "volatility": 25
  },
  "userPreferences": {
    "riskTolerance": "medium",
    "maxSlippage": 0.5,
    "prioritizeSpeed": false
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "optimalPath": ["0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e", "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea"],
    "expectedSlippage": 0.25,
    "confidenceScore": 85,
    "riskAssessment": {
      "volatilityRisk": 30,
      "liquidityRisk": 20,
      "overallRisk": 25,
      "warnings": []
    },
    "gasPriceRecommendation": {
      "slow": "20",
      "standard": "25",
      "fast": "30",
      "optimal": "25"
    },
    "timingRecommendation": {
      "executeNow": true,
      "optimalTimeWindow": 5,
      "reason": "Market conditions favorable for execution"
    }
  },
  "meta": {
    "timestamp": 1758355708037,
    "requestId": "req_1758355708037",
    "aiModel": "claude-3-haiku-mock",
    "cacheHit": false
  }
}
```

**前端使用示例**:
```javascript
const optimizeRoute = async (params) => {
  const response = await fetch('http://localhost:3001/api/v1/ai/route-optimization', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  });
  return response.json();
};
```

### 2. AI风险评估
**智能风险分析和预警**

```bash
POST /ai/risk-assessment
```

**请求体**:
```json
{
  "tokenIn": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e",
  "tokenOut": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "amountIn": "1000",
  "marketData": {
    "price": 1500,
    "volume24h": 50000,
    "liquidity": 5000,
    "volatility": 80
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "riskLevel": "high",
    "riskScore": 75,
    "factors": [
      {
        "factor": "Market Volatility",
        "impact": 80,
        "description": "Current volatility: 80%"
      },
      {
        "factor": "Liquidity Risk",
        "impact": 70,
        "description": "Available liquidity: $5000"
      }
    ],
    "recommendations": [
      "Consider smaller position sizes",
      "Monitor market conditions closely",
      "Wait for lower volatility"
    ]
  }
}
```

### 3. 市场时机分析
**最佳交易执行时机判断**

```bash
POST /ai/market-timing
```

**请求体**:
```json
{
  "tokenIn": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e",
  "tokenOut": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "marketConditions": {
    "volume24h": 1000,
    "volatility": 85,
    "liquidityRatio": 0.8
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "recommendation": "wait",
    "confidence": 85,
    "reasoning": "High volatility detected, recommend waiting for stabilization",
    "optimalTimeWindow": 30
  }
}
```

### 4. 市场洞察
**实时市场情报和趋势分析**

```bash
GET /ai/market-insights?timeframe=24h&tokens=ETH,BTC
```

**查询参数**:
- `timeframe`: `1h`, `4h`, `24h`, `7d` (可选)
- `tokens`: 逗号分隔的代币列表 (可选)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "marketSentiment": "bullish",
    "volatilityForecast": "moderate",
    "tradingOpportunities": [
      {
        "pair": "ETH/USDC",
        "signal": "buy",
        "confidence": 78,
        "reason": "Strong technical indicators and increasing volume"
      }
    ],
    "riskFactors": [
      "Increased market volatility expected in next 4 hours",
      "Monitor gas prices for optimal timing"
    ],
    "recommendations": [
      "Consider DCA strategy for large positions",
      "Use MEV protection for high-value trades"
    ]
  }
}
```

### 5. 个性化策略生成
**基于用户历史的定制交易策略**

```bash
POST /ai/personalized-strategy
```

**请求体**:
```json
{
  "tradingHistory": [
    {
      "pair": "ETH/USDC",
      "volume": 1000,
      "pnl": 50,
      "timestamp": 1758355000000
    }
  ],
  "preferences": {
    "riskTolerance": "medium",
    "investmentHorizon": "short"
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "strategy": "grid",
    "parameters": {
      "riskLevel": "medium",
      "positionSize": "2%",
      "stopLoss": "3%",
      "takeProfit": "8%",
      "rebalanceFrequency": "daily"
    },
    "expectedPerformance": {
      "annualReturn": 8.2,
      "maxDrawdown": 12.0,
      "sharpeRatio": 1.2
    },
    "recommendations": [
      "Grid strategy suits your profile",
      "Start with smaller positions to test performance"
    ]
  }
}
```

### 6. 投资组合优化
**AI驱动的资产配置优化**

```bash
POST /ai/portfolio-optimization
```

**请求体**:
```json
{
  "currentHoldings": [
    {
      "token": "ETH",
      "amount": "5",
      "value": 7500
    },
    {
      "token": "USDC",
      "amount": "2000",
      "value": 2000
    }
  ],
  "targetAllocation": {
    "ETH": 0.6,
    "USDC": 0.4
  },
  "constraints": {
    "maxTradeSize": 1000,
    "minHoldingPeriod": 24
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "recommendedTrades": [
      {
        "action": "buy",
        "token": "ETH",
        "amount": "0.5",
        "reasoning": "Underweight in ETH allocation",
        "priority": "high"
      }
    ],
    "expectedPerformance": {
      "annualReturn": 12.5,
      "volatility": 18.2,
      "sharpeRatio": 0.69
    },
    "riskMetrics": {
      "valueAtRisk": 8.5,
      "maxDrawdown": 15.3,
      "correlation": 0.65
    },
    "rebalancingCost": {
      "gasEstimate": "0.025 ETH",
      "slippageImpact": "0.15%",
      "totalCost": "$45.20"
    }
  }
}
```

### 7. AI服务健康检查
**AI服务状态和性能监控**

```bash
GET /ai/health
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "capabilities": {
      "routeOptimization": true,
      "riskAssessment": true,
      "marketTiming": true,
      "strategyGeneration": true,
      "portfolioOptimization": true
    },
    "models": {
      "primary": "claude-3-haiku-mock",
      "fallback": "rule-based"
    },
    "performance": {
      "averageResponseTime": "1.2s",
      "successRate": "99.1%",
      "cacheHitRate": "45%",
      "requestsToday": 1247
    }
  }
}
```

---

## 💱 交易服务端点

### 1. 执行交换
**智能交易执行**

```bash
POST /trading/swap
```

**请求体**:
```json
{
  "tokenIn": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e",
  "tokenOut": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "amountIn": "1000",
  "slippage": 0.5
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_1758355740785",
    "status": "pending",
    "tokenIn": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e",
    "tokenOut": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    "amountIn": "1000",
    "estimatedAmountOut": "995",
    "slippage": 0.5,
    "txHash": "0x7baecb085f33e",
    "gasUsed": "150000",
    "gasPrice": "25000000000",
    "timestamp": 1758355740785
  }
}
```

### 2. 交易历史
**获取用户交易记录**

```bash
GET /trading/history
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "orderId": "order_1",
      "tokenIn": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e",
      "tokenOut": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
      "amountIn": "1000",
      "amountOut": "995.5",
      "status": "completed",
      "timestamp": 1758352140830,
      "txHash": "0xabc123def456...",
      "gasUsed": "142350"
    }
  ],
  "meta": {
    "timestamp": 1758355740830,
    "requestId": "req_1758355740830",
    "count": 2
  }
}
```

---

## 🌉 跨链服务端点

### 跨链报价
**获取跨链交换报价**

```bash
POST /cross-chain/quote
```

**请求体**:
```json
{
  "fromChain": "ethereum",
  "toChain": "monad",
  "tokenIn": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e",
  "tokenOut": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  "amountIn": "1000"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "fromChain": "ethereum",
    "toChain": "monad",
    "tokenIn": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e",
    "tokenOut": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    "amountIn": "1000",
    "amountOut": "990",
    "fee": "10",
    "estimatedTime": "5-10 minutes",
    "bridge": "LayerZero",
    "route": [
      { "chain": "ethereum", "token": "0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e" },
      { "chain": "monad", "token": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea" }
    ],
    "confidence": "high"
  }
}
```

---

## 📊 前端集成示例

### React Hooks集成

```javascript
// useRouteXAPI.js
import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api/v1';

export const useRouteXAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('routex_token');
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'API request failed');
      }
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // AI功能
  const optimizeRoute = useCallback((params) => 
    apiCall('/ai/route-optimization', {
      method: 'POST',
      body: JSON.stringify(params)
    }), [apiCall]);

  const assessRisk = useCallback((params) => 
    apiCall('/ai/risk-assessment', {
      method: 'POST',
      body: JSON.stringify(params)
    }), [apiCall]);

  const getMarketInsights = useCallback((timeframe = '24h') => 
    apiCall(`/ai/market-insights?timeframe=${timeframe}`), [apiCall]);

  // 交易功能
  const executeSwap = useCallback((params) => 
    apiCall('/trading/swap', {
      method: 'POST',
      body: JSON.stringify(params)
    }), [apiCall]);

  const getTradingHistory = useCallback(() => 
    apiCall('/trading/history'), [apiCall]);

  return {
    loading,
    error,
    optimizeRoute,
    assessRisk,
    getMarketInsights,
    executeSwap,
    getTradingHistory,
    apiCall
  };
};
```

### 使用示例
```javascript
// TradingComponent.jsx
import { useRouteXAPI } from './useRouteXAPI';

const TradingComponent = () => {
  const { 
    loading, 
    error, 
    optimizeRoute, 
    assessRisk, 
    executeSwap 
  } = useRouteXAPI();

  const handleTrade = async () => {
    try {
      // 1. 获取AI路由推荐
      const routeData = await optimizeRoute({
        tokenIn: '0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e',
        tokenOut: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
        amountIn: '1000',
        marketData: {
          price: 1500,
          volume24h: 50000,
          liquidity: 100000,
          volatility: 25
        }
      });

      // 2. 评估风险
      const riskData = await assessRisk({
        tokenIn: '0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e',
        tokenOut: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
        amountIn: '1000',
        marketData: { /* ... */ }
      });

      // 3. 根据AI建议执行交易
      if (routeData.timingRecommendation.executeNow && 
          riskData.riskLevel !== 'high') {
        const swapResult = await executeSwap({
          tokenIn: '0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e',
          tokenOut: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
          amountIn: '1000',
          slippage: routeData.expectedSlippage
        });
        
        console.log('交易已提交:', swapResult.orderId);
      }
    } catch (err) {
      console.error('交易失败:', err);
    }
  };

  return (
    <div>
      <button onClick={handleTrade} disabled={loading}>
        {loading ? '处理中...' : '智能交易'}
      </button>
      {error && <div className="error">错误: {error}</div>}
    </div>
  );
};
```

---

## 🔧 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### 常见错误代码
- `NOT_FOUND`: 端点不存在
- `VALIDATION_ERROR`: 请求参数验证失败
- `UNAUTHORIZED`: 认证失败
- `RATE_LIMIT_EXCEEDED`: 请求频率过高
- `INTERNAL_ERROR`: 服务器内部错误

---

## 📈 响应时间和限制

- **平均响应时间**: 1-2秒
- **请求频率限制**: 1000次/15分钟/IP
- **AI端点限制**: 20次/分钟/用户
- **数据更新频率**: 实时(交易)，1分钟(市场数据)

---

## 🔄 实时数据 (WebSocket)

```javascript
// WebSocket连接示例
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  // 订阅市场数据
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['market_data', 'trade_updates']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('实时数据:', data);
};
```

---

## 📝 更新日志

**v1.0.0** (2025-09-20)
- 初始版本发布
- AI驱动的路由优化
- 风险评估系统
- 市场洞察分析
- 个性化策略生成
- 投资组合优化
- 基础交易功能
- 跨链支持

---

## 📞 技术支持

如有任何问题或建议，请联系开发团队或查看项目GitHub仓库。

**测试服务器状态**: 🟢 运行中  
**API版本**: v1.0.0  
**最后更新**: 2025-09-20