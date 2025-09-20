# 🎯 RouteX 前端集成指南

## 🚀 快速开始

本指南帮助前端开发者快速集成RouteX API，实现AI驱动的量化交易功能。

### 📋 前置条件

1. **API服务器运行中**: `http://localhost:3001`
2. **测试令牌**: 可通过 `GET /api/v1/auth/test-token` 获取
3. **前端框架**: React/Vue/Angular (示例基于React)

### 🔧 环境配置

```bash
# 1. 启动API服务器
cd api
node src/simple-test.js

# 2. 配置前端环境变量
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 📦 核心Hooks实现

### 1. 基础API Hook

```javascript
// hooks/useRouteXAPI.js
import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const useRouteXAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiRequest = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('routex_auth_token');
      
      const config = {
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      };

      const response = await axios(endpoint, config);
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API请求失败');
      }

      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiRequest, loading, error };
};
```

### 2. AI分析Hook

```javascript
// hooks/useAIAnalysis.js
import { useState } from 'react';
import { useRouteXAPI } from './useRouteXAPI';

export const useAIAnalysis = () => {
  const { apiRequest, loading, error } = useRouteXAPI();
  const [analysisData, setAnalysisData] = useState(null);

  // AI路由优化
  const optimizeRoute = async (params) => {
    const result = await apiRequest('/ai/route-optimization', {
      method: 'POST',
      data: params
    });
    setAnalysisData(prev => ({ ...prev, route: result }));
    return result;
  };

  // 风险评估
  const assessRisk = async (params) => {
    const result = await apiRequest('/ai/risk-assessment', {
      method: 'POST',
      data: params
    });
    setAnalysisData(prev => ({ ...prev, risk: result }));
    return result;
  };

  // 市场时机分析
  const analyzeMarketTiming = async (params) => {
    const result = await apiRequest('/ai/market-timing', {
      method: 'POST',
      data: params
    });
    setAnalysisData(prev => ({ ...prev, timing: result }));
    return result;
  };

  // 市场洞察
  const getMarketInsights = async (timeframe = '24h') => {
    const result = await apiRequest(`/ai/market-insights?timeframe=${timeframe}`);
    setAnalysisData(prev => ({ ...prev, insights: result }));
    return result;
  };

  // 完整AI分析
  const analyzeComplete = async (tradeParams) => {
    try {
      const [routeResult, riskResult, timingResult] = await Promise.allSettled([
        optimizeRoute(tradeParams),
        assessRisk(tradeParams),
        analyzeMarketTiming({
          tokenIn: tradeParams.tokenIn,
          tokenOut: tradeParams.tokenOut,
          marketConditions: tradeParams.marketData
        })
      ]);

      return {
        route: routeResult.status === 'fulfilled' ? routeResult.value : null,
        risk: riskResult.status === 'fulfilled' ? riskResult.value : null,
        timing: timingResult.status === 'fulfilled' ? timingResult.value : null
      };
    } catch (error) {
      console.error('完整AI分析失败:', error);
      throw error;
    }
  };

  return {
    optimizeRoute,
    assessRisk,
    analyzeMarketTiming,
    getMarketInsights,
    analyzeComplete,
    analysisData,
    loading,
    error
  };
};
```

### 3. 交易Hook

```javascript
// hooks/useTrading.js
import { useState } from 'react';
import { useRouteXAPI } from './useRouteXAPI';

export const useTrading = () => {
  const { apiRequest, loading, error } = useRouteXAPI();
  const [tradeHistory, setTradeHistory] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);

  // 执行交换
  const executeSwap = async (params) => {
    const result = await apiRequest('/trading/swap', {
      method: 'POST',
      data: params
    });
    
    // 更新活跃订单
    setActiveOrders(prev => [result, ...prev]);
    return result;
  };

  // 获取交易历史
  const fetchTradingHistory = async () => {
    const result = await apiRequest('/trading/history');
    setTradeHistory(result);
    return result;
  };

  // 智能交易 (结合AI分析)
  const smartTrade = async (tradeParams) => {
    try {
      // 首先进行AI分析
      const aiAnalysis = await apiRequest('/ai/route-optimization', {
        method: 'POST',
        data: tradeParams
      });

      // 检查AI建议
      if (!aiAnalysis.timingRecommendation.executeNow) {
        throw new Error(`AI建议: ${aiAnalysis.timingRecommendation.reason}`);
      }

      // 执行交易
      const swapResult = await executeSwap({
        ...tradeParams,
        slippage: aiAnalysis.expectedSlippage
      });

      return {
        trade: swapResult,
        aiAnalysis
      };
    } catch (error) {
      console.error('智能交易失败:', error);
      throw error;
    }
  };

  return {
    executeSwap,
    smartTrade,
    fetchTradingHistory,
    tradeHistory,
    activeOrders,
    loading,
    error
  };
};
```

---

## 🎨 UI组件示例

### 1. AI路由优化组件

```jsx
// components/AIRouteOptimizer.jsx
import { useState } from 'react';
import { useAIAnalysis } from '../hooks/useAIAnalysis';

const AIRouteOptimizer = ({ tokenIn, tokenOut, amountIn, onOptimize }) => {
  const { optimizeRoute, loading, error } = useAIAnalysis();
  const [optimization, setOptimization] = useState(null);

  const handleOptimize = async () => {
    try {
      const result = await optimizeRoute({
        tokenIn,
        tokenOut,
        amountIn,
        marketData: {
          price: 1500, // 实际应从市场数据获取
          volume24h: 50000,
          liquidity: 100000,
          volatility: 25
        },
        userPreferences: {
          riskTolerance: 'medium',
          maxSlippage: 0.5,
          prioritizeSpeed: false
        }
      });
      
      setOptimization(result);
      onOptimize?.(result);
    } catch (err) {
      console.error('路由优化失败:', err);
    }
  };

  return (
    <div className="ai-route-optimizer">
      <h3>🤖 AI路由优化</h3>
      
      <button 
        onClick={handleOptimize} 
        disabled={loading}
        className="optimize-btn"
      >
        {loading ? '分析中...' : '优化路由'}
      </button>

      {error && (
        <div className="error">
          ❌ {error}
        </div>
      )}

      {optimization && (
        <div className="optimization-result">
          <h4>📊 优化结果</h4>
          
          <div className="metric">
            <span>置信度:</span>
            <span className="value">{optimization.confidenceScore}%</span>
          </div>
          
          <div className="metric">
            <span>预期滑点:</span>
            <span className="value">{optimization.expectedSlippage}%</span>
          </div>
          
          <div className="metric">
            <span>风险等级:</span>
            <span className={`value risk-${optimization.riskAssessment.overallRisk > 50 ? 'high' : 'low'}`}>
              {optimization.riskAssessment.overallRisk}/100
            </span>
          </div>

          <div className="gas-recommendation">
            <h5>⛽ Gas价格建议</h5>
            <div className="gas-options">
              <span>慢: {optimization.gasPriceRecommendation.slow} gwei</span>
              <span>标准: {optimization.gasPriceRecommendation.standard} gwei</span>
              <span>快速: {optimization.gasPriceRecommendation.fast} gwei</span>
              <span className="optimal">推荐: {optimization.gasPriceRecommendation.optimal} gwei</span>
            </div>
          </div>

          <div className="timing">
            <h5>⏰ 执行时机</h5>
            <p>
              {optimization.timingRecommendation.executeNow 
                ? '✅ 当前市场条件适合交易' 
                : `⏳ 建议等待 ${optimization.timingRecommendation.optimalTimeWindow} 分钟`
              }
            </p>
            <small>{optimization.timingRecommendation.reason}</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRouteOptimizer;
```

### 2. 智能交易组件

```jsx
// components/SmartTrading.jsx
import { useState } from 'react';
import { useTrading } from '../hooks/useTrading';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import AIRouteOptimizer from './AIRouteOptimizer';

const SmartTrading = () => {
  const { smartTrade, loading: tradeLoading } = useTrading();
  const { assessRisk, loading: riskLoading } = useAIAnalysis();
  
  const [tradeParams, setTradeParams] = useState({
    tokenIn: '0xA0b86a33E6bA3C6bC7b7b0CC3a59f4c0d4b0b53e',
    tokenOut: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
    amountIn: '1000'
  });
  
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [tradeResult, setTradeResult] = useState(null);

  const handleRiskCheck = async () => {
    try {
      const risk = await assessRisk({
        ...tradeParams,
        marketData: {
          price: 1500,
          volume24h: 50000,
          liquidity: 100000,
          volatility: 25
        }
      });
      setRiskAssessment(risk);
    } catch (error) {
      console.error('风险评估失败:', error);
    }
  };

  const handleSmartTrade = async (optimization) => {
    try {
      const result = await smartTrade({
        ...tradeParams,
        marketData: {
          price: 1500,
          volume24h: 50000,
          liquidity: 100000,
          volatility: 25
        }
      });
      
      setTradeResult(result);
    } catch (error) {
      console.error('智能交易失败:', error);
    }
  };

  return (
    <div className="smart-trading">
      <h2>🧠 AI智能交易</h2>
      
      {/* 交易参数输入 */}
      <div className="trade-inputs">
        <div className="input-group">
          <label>卖出代币:</label>
          <input 
            value={tradeParams.tokenIn}
            onChange={(e) => setTradeParams(prev => ({...prev, tokenIn: e.target.value}))}
          />
        </div>
        
        <div className="input-group">
          <label>买入代币:</label>
          <input 
            value={tradeParams.tokenOut}
            onChange={(e) => setTradeParams(prev => ({...prev, tokenOut: e.target.value}))}
          />
        </div>
        
        <div className="input-group">
          <label>数量:</label>
          <input 
            value={tradeParams.amountIn}
            onChange={(e) => setTradeParams(prev => ({...prev, amountIn: e.target.value}))}
          />
        </div>
      </div>

      {/* AI分析区域 */}
      <div className="ai-analysis">
        {/* 路由优化 */}
        <AIRouteOptimizer 
          {...tradeParams}
          onOptimize={handleSmartTrade}
        />

        {/* 风险评估 */}
        <div className="risk-assessment">
          <h3>⚠️ 风险评估</h3>
          <button onClick={handleRiskCheck} disabled={riskLoading}>
            {riskLoading ? '评估中...' : '评估风险'}
          </button>
          
          {riskAssessment && (
            <div className="risk-result">
              <div className={`risk-level risk-${riskAssessment.riskLevel}`}>
                风险等级: {riskAssessment.riskLevel.toUpperCase()}
              </div>
              <div className="risk-score">
                风险评分: {riskAssessment.riskScore}/100
              </div>
              
              <div className="risk-factors">
                <h4>风险因子:</h4>
                {riskAssessment.factors.map((factor, index) => (
                  <div key={index} className="factor">
                    <span>{factor.factor}:</span>
                    <span>{factor.impact}% - {factor.description}</span>
                  </div>
                ))}
              </div>
              
              <div className="recommendations">
                <h4>建议:</h4>
                <ul>
                  {riskAssessment.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 交易结果 */}
      {tradeResult && (
        <div className="trade-result">
          <h3>✅ 交易已提交</h3>
          <div className="result-details">
            <p><strong>订单ID:</strong> {tradeResult.trade.orderId}</p>
            <p><strong>交易哈希:</strong> {tradeResult.trade.txHash}</p>
            <p><strong>状态:</strong> {tradeResult.trade.status}</p>
            <p><strong>预期输出:</strong> {tradeResult.trade.estimatedAmountOut}</p>
            <p><strong>AI置信度:</strong> {tradeResult.aiAnalysis.confidenceScore}%</p>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {tradeLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>正在执行智能交易...</p>
        </div>
      )}
    </div>
  );
};

export default SmartTrading;
```

### 3. 市场洞察面板

```jsx
// components/MarketInsights.jsx
import { useState, useEffect } from 'react';
import { useAIAnalysis } from '../hooks/useAIAnalysis';

const MarketInsights = () => {
  const { getMarketInsights, loading, error } = useAIAnalysis();
  const [insights, setInsights] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    fetchInsights();
    // 设置自动刷新
    const interval = setInterval(fetchInsights, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchInsights = async () => {
    try {
      const data = await getMarketInsights(timeframe);
      setInsights(data);
    } catch (err) {
      console.error('获取市场洞察失败:', err);
    }
  };

  if (loading && !insights) {
    return <div className="loading">加载市场洞察中...</div>;
  }

  return (
    <div className="market-insights">
      <div className="header">
        <h2>📊 市场洞察</h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="1h">1小时</option>
          <option value="4h">4小时</option>
          <option value="24h">24小时</option>
          <option value="7d">7天</option>
        </select>
      </div>

      {error && <div className="error">❌ {error}</div>}

      {insights && (
        <div className="insights-content">
          {/* 市场情绪 */}
          <div className="sentiment-card">
            <h3>📈 市场情绪</h3>
            <div className={`sentiment ${insights.marketSentiment}`}>
              {insights.marketSentiment === 'bullish' ? '🐂 看涨' : '🐻 看跌'}
            </div>
            <div className="volatility">
              波动预测: {insights.volatilityForecast}
            </div>
          </div>

          {/* 交易机会 */}
          <div className="opportunities-card">
            <h3>💡 交易机会</h3>
            {insights.tradingOpportunities.map((opp, index) => (
              <div key={index} className="opportunity">
                <div className="pair">{opp.pair}</div>
                <div className={`signal signal-${opp.signal}`}>
                  {opp.signal === 'buy' ? '📈 买入' : 
                   opp.signal === 'sell' ? '📉 卖出' : '⏸️ 持有'}
                </div>
                <div className="confidence">置信度: {opp.confidence}%</div>
                <div className="reason">{opp.reason}</div>
              </div>
            ))}
          </div>

          {/* 风险因子 */}
          <div className="risks-card">
            <h3>⚠️ 风险因子</h3>
            <ul>
              {insights.riskFactors.map((risk, index) => (
                <li key={index} className="risk-item">
                  {risk}
                </li>
              ))}
            </ul>
          </div>

          {/* 建议 */}
          <div className="recommendations-card">
            <h3>💭 AI建议</h3>
            <ul>
              {insights.recommendations.map((rec, index) => (
                <li key={index} className="recommendation-item">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="last-update">
        最后更新: {new Date().toLocaleTimeString()}
        {loading && <span className="updating"> (更新中...)</span>}
      </div>
    </div>
  );
};

export default MarketInsights;
```

---

## 🎨 样式示例 (CSS)

```css
/* styles/routex-components.css */

/* AI路由优化器 */
.ai-route-optimizer {
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.optimize-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.optimize-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.optimize-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 优化结果 */
.optimization-result {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.metric {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.value {
  font-weight: bold;
}

.risk-high {
  color: #ff6b6b;
}

.risk-low {
  color: #51cf66;
}

/* Gas推荐 */
.gas-recommendation {
  margin-top: 16px;
}

.gas-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.gas-options span {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.optimal {
  background: rgba(81, 207, 102, 0.3) !important;
  border: 1px solid #51cf66;
}

/* 智能交易 */
.smart-trading {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.trade-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-weight: 600;
  color: #374151;
}

.input-group input {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* AI分析区域 */
.ai-analysis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .ai-analysis {
    grid-template-columns: 1fr;
  }
}

/* 风险评估 */
.risk-assessment {
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 20px;
  background: #f8fafc;
}

.risk-level {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  margin: 8px 0;
}

.risk-low {
  background: #dcfce7;
  color: #166534;
}

.risk-medium {
  background: #fef3c7;
  color: #92400e;
}

.risk-high {
  background: #fee2e2;
  color: #991b1b;
}

.risk-factors, .recommendations {
  margin-top: 16px;
}

.factor {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

/* 市场洞察 */
.market-insights {
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 24px;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
}

.insights-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.sentiment-card, .opportunities-card, .risks-card, .recommendations-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.sentiment {
  font-size: 18px;
  font-weight: bold;
  margin: 8px 0;
}

.sentiment.bullish {
  color: #059669;
}

.sentiment.bearish {
  color: #dc2626;
}

.opportunity {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  border-left: 4px solid #667eea;
}

.signal-buy {
  color: #059669;
  font-weight: bold;
}

.signal-sell {
  color: #dc2626;
  font-weight: bold;
}

.signal-hold {
  color: #d97706;
  font-weight: bold;
}

/* 交易结果 */
.trade-result {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.result-details p {
  margin: 8px 0;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error {
  background: #fee2e2;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 12px 0;
  border: 1px solid #fecaca;
}

/* 最后更新时间 */
.last-update {
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.updating {
  color: #667eea;
  font-weight: 500;
}
```

---

## 🔧 集成检查清单

### ✅ 基础集成
- [ ] API服务器运行正常
- [ ] 获取测试令牌成功
- [ ] 基础API请求功能正常
- [ ] 错误处理机制完善

### ✅ AI功能集成
- [ ] AI路由优化接口调用
- [ ] 风险评估功能实现
- [ ] 市场时机分析集成
- [ ] 市场洞察数据展示
- [ ] 个性化策略生成

### ✅ 交易功能集成
- [ ] 基础交易执行
- [ ] 智能交易流程
- [ ] 交易历史查询
- [ ] 订单状态追踪

### ✅ 用户体验优化
- [ ] 加载状态显示
- [ ] 错误信息提示
- [ ] 响应式设计
- [ ] 实时数据更新

---

## 🚀 部署建议

1. **开发环境**: 使用本地API服务器测试
2. **生产环境**: 
   - API服务器部署到云服务器
   - 配置CORS策略
   - 启用HTTPS
   - 实现真实的认证系统

3. **性能优化**:
   - 实现请求缓存
   - 使用WebSocket实现实时数据
   - 优化API响应时间

---

## 📞 技术支持

如遇到集成问题，请查看：
1. API文档: `/api/API_DOCUMENTATION.md`
2. 控制台错误信息
3. 网络请求状态
4. API服务器日志

**测试API地址**: `http://localhost:3001/api/v1`