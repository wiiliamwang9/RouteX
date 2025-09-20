# 🎯 RouteX Web 集成示例

## 🚀 快速开始示例

### 1. 基础交易组件

```tsx
// components/BasicTrading.tsx
"use client"

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { 
  useSmartTrading, 
  useAIRiskAssessment,
  formatTokenAmount,
  parseTokenAmount 
} from '@/hooks/use-contracts'
import { SUPPORTED_TOKENS } from '@/lib/config'

export function BasicTrading() {
  const { address, isConnected } = useAccount()
  const [tokenIn, setTokenIn] = useState(SUPPORTED_TOKENS[0])
  const [tokenOut, setTokenOut] = useState(SUPPORTED_TOKENS[1])
  const [amountIn, setAmountIn] = useState('')
  const [useMEV, setUseMEV] = useState(false)

  const { smartTrade, isLoading, status, txHash } = useSmartTrading()
  
  const amountInWei = parseTokenAmount(amountIn, tokenIn.decimals)
  const { riskLevel, riskScore } = useAIRiskAssessment(
    tokenIn.address,
    tokenOut.address,
    amountInWei
  )

  const handleTrade = async () => {
    if (!isConnected || !amountIn) return

    try {
      await smartTrade(
        tokenIn.address,
        tokenOut.address,
        amountInWei,
        {
          slippage: 0.5,
          useMEVProtection: useMEV,
          riskTolerance: 1
        }
      )
    } catch (error) {
      console.error('交易失败:', error)
    }
  }

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">🚀 RouteX 交易</h2>
      
      {/* 代币选择 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">卖出</label>
          <select 
            value={tokenIn.symbol}
            onChange={(e) => {
              const token = SUPPORTED_TOKENS.find(t => t.symbol === e.target.value)
              if (token) setTokenIn(token)
            }}
            className="w-full p-2 border rounded"
          >
            {SUPPORTED_TOKENS.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">买入</label>
          <select 
            value={tokenOut.symbol}
            onChange={(e) => {
              const token = SUPPORTED_TOKENS.find(t => t.symbol === e.target.value)
              if (token) setTokenOut(token)
            }}
            className="w-full p-2 border rounded"
          >
            {SUPPORTED_TOKENS.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 数量输入 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">数量</label>
        <input
          type="number"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          placeholder={`输入 ${tokenIn.symbol} 数量`}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* AI风险评估 */}
      {riskLevel && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">🤖 AI风险评估</h3>
          <div className="flex justify-between items-center">
            <span>风险等级:</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              riskLevel === '低' ? 'bg-green-100 text-green-800' :
              riskLevel === '中' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {riskLevel} ({riskScore}/100)
            </span>
          </div>
        </div>
      )}

      {/* MEV保护选项 */}
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={useMEV}
            onChange={(e) => setUseMEV(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">启用MEV保护 🛡️</span>
        </label>
      </div>

      {/* 交易按钮 */}
      <button
        onClick={handleTrade}
        disabled={!isConnected || !amountIn || isLoading || riskLevel === '高'}
        className={`w-full py-3 px-4 rounded font-medium ${
          !isConnected ? 'bg-gray-300 text-gray-500' :
          riskLevel === '高' ? 'bg-red-300 text-red-700' :
          isLoading ? 'bg-blue-300 text-blue-700' :
          'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {!isConnected ? '请连接钱包' :
         riskLevel === '高' ? '⚠️ 风险过高' :
         isLoading ? '交易确认中...' :
         `🚀 ${useMEV ? '安全' : ''}交易`}
      </button>

      {/* 交易状态 */}
      {txHash && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm font-medium">交易状态: {status}</p>
          <a
            href={`https://explorer.monad.xyz/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            查看交易详情 ↗
          </a>
        </div>
      )}
    </div>
  )
}
```

---

### 2. AI策略管理组件

```tsx
// components/StrategyManager.tsx
"use client"

import { useState } from 'react'
import { parseEther } from 'viem'
import { 
  useCreateStrategy, 
  useExecuteStrategy, 
  useStrategyPerformance,
  formatTokenAmount 
} from '@/hooks/use-contracts'

const STRATEGY_TYPES = [
  { id: 0, name: '套利策略', description: '跨DEX价差套利' },
  { id: 1, name: '网格交易', description: '区间内高抛低吸' },
  { id: 2, name: 'DCA定投', description: '定期定额投资' },
  { id: 3, name: '动量策略', description: '趋势跟踪交易' },
]

export function StrategyManager() {
  const [selectedStrategy, setSelectedStrategy] = useState(0)
  const [capital, setCapital] = useState('')
  const [strategyId, setStrategyId] = useState<bigint>()

  const { createStrategy, txHash: createTxHash } = useCreateStrategy()
  const { executeStrategy, txHash: executeTxHash } = useExecuteStrategy()
  const { totalReturn, sharpeRatio, winRate } = useStrategyPerformance(strategyId)

  const handleCreateStrategy = async () => {
    if (!capital) return

    try {
      const capitalWei = parseEther(capital)
      const maxRisk = capitalWei / 10n // 10%最大风险
      
      await createStrategy(
        selectedStrategy,
        {
          targetPrice: parseEther('2000'), // 示例目标价格
          gridLevels: 10,
          dcaInterval: 3600, // 1小时
          stopLoss: parseEther('1800'),
          takeProfit: parseEther('2200')
        },
        capitalWei,
        maxRisk
      )
    } catch (error) {
      console.error('策略创建失败:', error)
    }
  }

  const handleExecuteStrategy = async () => {
    if (!strategyId) return
    
    try {
      await executeStrategy({
        args: [strategyId]
      })
    } catch (error) {
      console.error('策略执行失败:', error)
    }
  }

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">🧠 AI策略管理</h2>

      {/* 策略选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">选择策略类型</label>
        <div className="grid grid-cols-2 gap-2">
          {STRATEGY_TYPES.map(strategy => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`p-3 rounded border text-left ${
                selectedStrategy === strategy.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'
              }`}
            >
              <div className="font-medium">{strategy.name}</div>
              <div className="text-sm text-gray-600">{strategy.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 资金配置 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">初始资金 (ETH)</label>
        <input
          type="number"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          placeholder="输入初始资金"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={handleCreateStrategy}
          disabled={!capital}
          className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          📊 创建策略
        </button>
        
        <button
          onClick={handleExecuteStrategy}
          disabled={!strategyId}
          className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          🚀 执行策略
        </button>
      </div>

      {/* 策略表现 */}
      {strategyId && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-3">📈 策略表现</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatTokenAmount(totalReturn, 18, 2)}%
              </div>
              <div className="text-sm text-gray-600">总收益</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTokenAmount(sharpeRatio, 18, 2)}
              </div>
              <div className="text-sm text-gray-600">夏普比率</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {formatTokenAmount(winRate, 18, 1)}%
              </div>
              <div className="text-sm text-gray-600">胜率</div>
            </div>
          </div>
        </div>
      )}

      {/* 交易状态 */}
      {(createTxHash || executeTxHash) && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm">
            {createTxHash && '策略创建交易: '}
            {executeTxHash && '策略执行交易: '}
            <a
              href={`https://explorer.monad.xyz/tx/${createTxHash || executeTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              查看详情 ↗
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
```

---

### 3. 订单管理组件

```tsx
// components/OrderManager.tsx
"use client"

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { 
  usePlaceLimitOrder, 
  useUserOrders,
  formatTokenAmount,
  parseTokenAmount 
} from '@/hooks/use-contracts'
import { SUPPORTED_TOKENS } from '@/lib/config'

export function OrderManager() {
  const { address } = useAccount()
  const [tokenIn, setTokenIn] = useState(SUPPORTED_TOKENS[0])
  const [tokenOut, setTokenOut] = useState(SUPPORTED_TOKENS[1])
  const [amountIn, setAmountIn] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')

  const { placeLimitOrder, txHash } = usePlaceLimitOrder()
  const { orders, isLoading, refetch } = useUserOrders(address)

  const handlePlaceOrder = async () => {
    if (!amountIn || !targetPrice) return

    try {
      const amountInWei = parseTokenAmount(amountIn, tokenIn.decimals)
      const targetPriceWei = parseEther(targetPrice)
      
      await placeLimitOrder(
        tokenIn.address,
        tokenOut.address,
        amountInWei,
        targetPriceWei,
        orderType === 'buy'
      )
      
      // 刷新订单列表
      setTimeout(refetch, 2000)
    } catch (error) {
      console.error('限价单创建失败:', error)
    }
  }

  const getOrderStatus = (status: number) => {
    const statuses = ['待执行', '已执行', '已取消', '已过期']
    return statuses[status] || '未知'
  }

  const getOrderTypeText = (isLong: boolean) => {
    return isLong ? '买入' : '卖出'
  }

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">📋 限价单管理</h2>

      {/* 创建限价单 */}
      <div className="border-b pb-4 mb-4">
        <h3 className="font-medium mb-3">创建新限价单</h3>
        
        {/* 订单类型 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setOrderType('buy')}
            className={`px-4 py-2 rounded ${
              orderType === 'buy' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200'
            }`}
          >
            买入单
          </button>
          <button
            onClick={() => setOrderType('sell')}
            className={`px-4 py-2 rounded ${
              orderType === 'sell' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200'
            }`}
          >
            卖出单
          </button>
        </div>

        {/* 代币对选择 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {orderType === 'buy' ? '支付代币' : '卖出代币'}
            </label>
            <select 
              value={tokenIn.symbol}
              onChange={(e) => {
                const token = SUPPORTED_TOKENS.find(t => t.symbol === e.target.value)
                if (token) setTokenIn(token)
              }}
              className="w-full p-2 border rounded"
            >
              {SUPPORTED_TOKENS.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {orderType === 'buy' ? '买入代币' : '换取代币'}
            </label>
            <select 
              value={tokenOut.symbol}
              onChange={(e) => {
                const token = SUPPORTED_TOKENS.find(t => t.symbol === e.target.value)
                if (token) setTokenOut(token)
              }}
              className="w-full p-2 border rounded"
            >
              {SUPPORTED_TOKENS.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 数量和价格 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">数量</label>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder={`${tokenIn.symbol} 数量`}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">目标价格 (ETH)</label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="目标执行价格"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={!amountIn || !targetPrice}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          📝 创建限价单
        </button>

        {txHash && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
            交易已提交: 
            <a
              href={`https://explorer.monad.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              查看详情 ↗
            </a>
          </div>
        )}
      </div>

      {/* 订单列表 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">我的限价单</h3>
          <button
            onClick={refetch}
            className="text-blue-600 hover:underline text-sm"
          >
            🔄 刷新
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-4">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-4 text-gray-500">暂无订单</div>
        ) : (
          <div className="space-y-2">
            {orders.map((order: any, index: number) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {getOrderTypeText(order.isLong)} #{order.id?.toString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTokenAmount(order.amountIn, 18, 4)} → 
                      目标价格: {formatEther(order.targetPrice)} ETH
                    </div>
                    <div className="text-xs text-gray-500">
                      创建时间: {new Date(Number(order.createdAt) * 1000).toLocaleString()}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    order.status === 0 ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 1 ? 'bg-green-100 text-green-800' :
                    order.status === 2 ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getOrderStatus(order.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### 4. 钱包连接组件

```tsx
// components/WalletConnect.tsx
"use client"

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect } from 'react'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isLoading, pendingConnector } = useConnect()
  const { disconnect } = useDisconnect()

  // 自动连接最后使用的钱包
  useEffect(() => {
    const lastConnector = localStorage.getItem('lastWalletConnector')
    if (lastConnector && !isConnected) {
      const connector = connectors.find(c => c.id === lastConnector)
      if (connector) {
        connect({ connector })
      }
    }
  }, [connectors, connect, isConnected])

  const handleConnect = (connector: any) => {
    connect({ connector })
    localStorage.setItem('lastWalletConnector', connector.id)
  }

  const handleDisconnect = () => {
    disconnect()
    localStorage.removeItem('lastWalletConnector')
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
          🟢 已连接
        </div>
        <div className="font-mono text-sm">
          {formatAddress(address!)}
        </div>
        <button
          onClick={handleDisconnect}
          className="text-red-600 hover:underline text-sm"
        >
          断开
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-gray-600 mb-2">连接钱包以开始交易</div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => handleConnect(connector)}
          disabled={isLoading && pendingConnector?.id === connector.id}
          className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <div className="w-6 h-6 bg-blue-500 rounded"></div>
          <span>{connector.name}</span>
          {isLoading && pendingConnector?.id === connector.id && (
            <span className="text-sm text-gray-500">连接中...</span>
          )}
        </button>
      ))}
    </div>
  )
}
```

---

### 5. 主应用页面

```tsx
// app/page.tsx
"use client"

import { WalletConnect } from '@/components/WalletConnect'
import { BasicTrading } from '@/components/BasicTrading'
import { StrategyManager } from '@/components/StrategyManager'
import { OrderManager } from '@/components/OrderManager'
import { useAccount } from 'wagmi'

export default function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded"></div>
            <h1 className="text-xl font-bold">RouteX</h1>
            <span className="text-sm text-gray-500">AI量化交易平台</span>
          </div>
          <WalletConnect />
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto p-6">
        {!isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">欢迎使用 RouteX</h2>
            <p className="text-gray-600 mb-8">
              AI驱动的量化交易平台，支持MEV保护和智能策略
            </p>
            <div className="max-w-md mx-auto">
              <WalletConnect />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基础交易 */}
            <BasicTrading />
            
            {/* 订单管理 */}
            <OrderManager />
            
            {/* 策略管理 (全宽) */}
            <div className="lg:col-span-2">
              <StrategyManager />
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t p-4 mt-12">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-600">
          <p>RouteX - Monad 上的 AI 量化交易平台</p>
          <p className="mt-1">
            合约地址: TraderAgent - 0x7267...C290 | RouterDefense - 0x458E...a16
          </p>
        </div>
      </footer>
    </div>
  )
}
```

---

## 📝 使用说明

### 1. 环境配置
```bash
# 安装依赖
npm install wagmi viem @tanstack/react-query

# 配置环境变量
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### 2. 启动应用
```bash
npm run dev
```

### 3. 钱包配置
- 添加Monad测试网络
- 获取测试代币
- 连接MetaMask或其他Web3钱包

### 4. 功能测试
1. **基础交易**: 选择代币对，输入数量，执行交易
2. **限价单**: 设置目标价格，创建条件订单  
3. **AI策略**: 选择策略类型，配置参数，创建量化策略
4. **MEV保护**: 启用保护机制，防止抢跑攻击

---

## 🔧 自定义和扩展

### 添加新的代币支持
```typescript
// lib/config.ts
export const SUPPORTED_TOKENS = [
  // 现有代币...
  {
    symbol: "NEWTOKEN",
    name: "New Token",
    address: "0x...", // 新代币合约地址
    decimals: 18,
    logoUrl: "/newtoken-logo.png",
  },
]
```

### 集成新的交易策略
```typescript
// hooks/use-contracts.ts
export function useCustomStrategy() {
  // 自定义策略逻辑
  const executeCustomStrategy = async () => {
    // 实现自定义策略
  }
  
  return { executeCustomStrategy }
}
```

这些示例提供了完整的RouteX Web前端集成方案，包括所有核心功能的UI组件和合约交互逻辑。您可以基于这些代码快速构建功能完整的量化交易界面。