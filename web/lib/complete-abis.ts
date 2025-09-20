// RouteX 完整合约 ABI 定义
// 基于实际智能合约接口生成

export const TRADER_AGENT_ABI = [
  // 执行市价单
  {
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMin", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "routeData", type: "bytes" }
        ]
      }
    ],
    name: "executeOrder",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  
  // 创建限价单
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "targetPrice", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ],
    name: "placeLimitOrder",
    outputs: [{ name: "orderId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  
  // 执行限价单
  {
    inputs: [{ name: "orderId", type: "uint256" }],
    name: "executeLimitOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 取消限价单
  {
    inputs: [{ name: "orderId", type: "uint256" }],
    name: "cancelLimitOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 批量执行订单
  {
    inputs: [
      {
        name: "orders",
        type: "tuple[]",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMin", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "routeData", type: "bytes" }
        ]
      }
    ],
    name: "batchExecuteOrders",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  
  // 获取限价单信息
  {
    inputs: [{ name: "orderId", type: "uint256" }],
    name: "limitOrders",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "user", type: "address" },
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "targetPrice", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "executed", type: "bool" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 获取用户订单ID列表
  {
    inputs: [{ name: "user", type: "address" }],
    name: "userOrders",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  
  // 获取下一个订单ID
  {
    inputs: [],
    name: "nextOrderId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  
  // 事件
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "tokenIn", type: "address" },
      { indexed: true, name: "tokenOut", type: "address" },
      { indexed: false, name: "amountIn", type: "uint256" },
      { indexed: false, name: "amountOut", type: "uint256" }
    ],
    name: "OrderExecuted",
    type: "event",
  },
  
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "orderId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "tokenIn", type: "address" },
      { indexed: false, name: "tokenOut", type: "address" },
      { indexed: false, name: "amountIn", type: "uint256" },
      { indexed: false, name: "targetPrice", type: "uint256" }
    ],
    name: "LimitOrderPlaced",
    type: "event",
  },
] as const

export const ROUTER_DEFENSE_ABI = [
  // MEV保护交换
  {
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMin", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" }
        ]
      }
    ],
    name: "protectedSwap",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  
  // 提交承诺 (Commit-Reveal机制)
  {
    inputs: [
      { name: "commitment", type: "bytes32" },
      { name: "deadline", type: "uint256" }
    ],
    name: "commitOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 揭示并执行
  {
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMin", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" }
        ]
      },
      { name: "nonce", type: "uint256" },
      { name: "salt", type: "bytes32" }
    ],
    name: "revealAndExecute",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  
  // 批量执行已揭示的订单
  {
    inputs: [],
    name: "batchExecuteRevealed",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 获取最优路径
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" }
    ],
    name: "getOptimalRoute",
    outputs: [
      {
        name: "routes",
        type: "tuple[]",
        components: [
          { name: "pool", type: "address" },
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "percentage", type: "uint256" }
        ]
      },
      { name: "expectedAmountOut", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 事件
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "tokenIn", type: "address" },
      { indexed: true, name: "tokenOut", type: "address" },
      { indexed: false, name: "amountIn", type: "uint256" },
      { indexed: false, name: "amountOut", type: "uint256" }
    ],
    name: "SwapExecuted",
    type: "event",
  },
  
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "commitment", type: "bytes32" },
      { indexed: false, name: "deadline", type: "uint256" }
    ],
    name: "CommitmentMade",
    type: "event",
  },
] as const

export const AI_STRATEGY_OPTIMIZER_ABI = [
  // 获取AI最优路径
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "maxSlippage", type: "uint256" },
      { name: "maxGasPrice", type: "uint256" }
    ],
    name: "getOptimalRoute",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "path", type: "address[]" },
          { name: "percentages", type: "uint256[]" },
          { name: "expectedGasCost", type: "uint256" },
          { name: "expectedSlippage", type: "uint256" },
          { name: "confidenceScore", type: "uint256" },
          { name: "timeEstimate", type: "uint256" },
          { name: "strategyData", type: "bytes" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 获取交易信号
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "timeframe", type: "uint256" }
    ],
    name: "getTradingSignal",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "signal", type: "uint8" },
          { name: "strength", type: "uint8" },
          { name: "targetPrice", type: "uint256" },
          { name: "confidence", type: "uint256" },
          { name: "timeHorizon", type: "uint256" },
          { name: "reason", type: "string" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 风险评估
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" }
    ],
    name: "assessRisk",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "volatilityRisk", type: "uint256" },
          { name: "liquidityRisk", type: "uint256" },
          { name: "slippageRisk", type: "uint256" },
          { name: "gasRisk", type: "uint256" },
          { name: "overallRisk", type: "uint256" },
          { name: "warnings", type: "string[]" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 更新市场数据
  {
    inputs: [
      {
        name: "data",
        type: "tuple[]",
        components: [
          { name: "token", type: "address" },
          { name: "price", type: "uint256" },
          { name: "volume24h", type: "uint256" },
          { name: "liquidity", type: "uint256" },
          { name: "priceChange24h", type: "int256" },
          { name: "volatility", type: "uint256" },
          { name: "timestamp", type: "uint256" }
        ]
      }
    ],
    name: "updateMarketData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 获取优先级评分
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "gasPrice", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ],
    name: "getPriorityScore",
    outputs: [{ name: "score", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  
  // 预测最佳时机
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" }
    ],
    name: "predictOptimalTiming",
    outputs: [
      { name: "optimalTimestamp", type: "uint256" },
      { name: "confidence", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 获取个性化策略
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" }
    ],
    name: "getPersonalizedStrategy",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "path", type: "address[]" },
          { name: "percentages", type: "uint256[]" },
          { name: "expectedGasCost", type: "uint256" },
          { name: "expectedSlippage", type: "uint256" },
          { name: "confidenceScore", type: "uint256" },
          { name: "timeEstimate", type: "uint256" },
          { name: "strategyData", type: "bytes" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 事件
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "tokenIn", type: "address" },
      { indexed: false, name: "tokenOut", type: "address" },
      { indexed: false, name: "amountIn", type: "uint256" },
      { indexed: false, name: "confidenceScore", type: "uint256" }
    ],
    name: "AIRecommendationGenerated",
    type: "event",
  },
] as const

export const CROSSCHAIN_ROUTER_ABI = [
  // 发起跨链交换
  {
    inputs: [
      { name: "targetChainId", type: "uint256" },
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "bridgeData", type: "bytes" }
    ],
    name: "initiateCrossChainSwap",
    outputs: [{ name: "transferId", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  
  // 获取最优桥接
  {
    inputs: [
      { name: "targetChainId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "getOptimalBridge",
    outputs: [
      { name: "bridgeType", type: "uint8" },
      { name: "estimatedTime", type: "uint256" },
      { name: "bridgeFee", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 获取跨链费用估算
  {
    inputs: [
      { name: "targetChainId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "estimateCrossChainFee",
    outputs: [{ name: "fee", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const QUANTGUARD_PRO_ABI = [
  // 创建策略
  {
    inputs: [
      { name: "strategyType", type: "uint8" },
      { name: "strategyParams", type: "bytes" },
      { name: "initialCapital", type: "uint256" },
      { name: "maxRisk", type: "uint256" }
    ],
    name: "createStrategy",
    outputs: [{ name: "strategyId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 执行策略
  {
    inputs: [{ name: "strategyId", type: "uint256" }],
    name: "executeStrategy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 暂停策略
  {
    inputs: [{ name: "strategyId", type: "uint256" }],
    name: "pauseStrategy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 激活策略
  {
    inputs: [{ name: "strategyId", type: "uint256" }],
    name: "activateStrategy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 更新策略参数
  {
    inputs: [
      { name: "strategyId", type: "uint256" },
      { name: "newParams", type: "bytes" }
    ],
    name: "updateStrategyParams",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // 获取策略表现
  {
    inputs: [{ name: "strategyId", type: "uint256" }],
    name: "getStrategyPerformance",
    outputs: [
      { name: "totalReturn", type: "uint256" },
      { name: "sharpeRatio", type: "uint256" },
      { name: "maxDrawdown", type: "uint256" },
      { name: "winRate", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 获取策略详情
  {
    inputs: [{ name: "strategyId", type: "uint256" }],
    name: "getStrategyDetails",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "strategyType", type: "uint8" },
          { name: "status", type: "uint8" },
          { name: "capital", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "lastExecuted", type: "uint256" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function",
  },
  
  // 获取用户策略列表
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserStrategies",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// 标准ERC20 ABI (用于代币交互)
export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// 兼容旧版本的导出
export const ROUTER_DEFENSE_ABI_LEGACY = ROUTER_DEFENSE_ABI
export const TRADER_AGENT_ABI_LEGACY = TRADER_AGENT_ABI