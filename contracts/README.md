# RouteX 智能合约

RouteX 是一个基于 Monad 的量化基础设施工具，提供高频交易下单和流动性路由防护功能。

## 项目结构

```
contracts/
├── src/
│   ├── core/                 # 核心合约
│   │   ├── TraderAgent.sol   # 高频交易代理合约
│   │   └── RouterDefense.sol # 流动性路由防护合约
│   ├── interfaces/           # 接口定义
│   │   ├── ITraderAgent.sol
│   │   └── IRouterDefense.sol
│   ├── libraries/            # 工具库
│   │   ├── PriceOracle.sol   # 价格预言机
│   │   └── RouteOptimizer.sol # 路由优化器
│   └── utils/               # 通用工具
│       └── ReentrancyGuard.sol
├── script/                  # 部署脚本
│   └── Deploy.s.sol
├── test/                    # 测试文件
└── foundry.toml            # Foundry 配置
```

## 核心功能

### 1. TraderAgent（高频交易工具）

- **快速下单**：支持限价和市价订单
- **批量交易**：一次性执行多个订单
- **限价订单**：设置目标价格自动执行
- **Gas 优化**：减少链上交互成本

主要功能：
- `executeOrder()` - 立即执行交易订单
- `placeLimitOrder()` - 放置限价订单
- `batchExecuteOrders()` - 批量执行订单
- `cancelLimitOrder()` - 取消限价订单

### 2. RouterDefense（流动性路由防护）

- **多路径路由**：在多个流动性池中拆分交易
- **MEV 防护**：通过 commit-reveal 机制防止抢跑
- **批量撮合**：合并多用户交易减少成本
- **滑点保护**：动态计算最优执行路径

主要功能：
- `protectedSwap()` - 受保护的交换交易
- `commitOrder()` - 提交订单承诺
- `revealAndExecute()` - 揭示并执行订单
- `batchExecuteRevealed()` - 批量执行已揭示订单

## 安装和部署

### 1. 安装依赖

```bash
# 安装 Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 安装项目依赖
make install
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的私钥和 RPC 端点
vim .env
```

### 3. 编译合约

```bash
make build
```

### 4. 运行测试

```bash
make test
```

### 5. 部署合约

```bash
# 部署到测试网
make deploy-testnet

# 部署到主网（谨慎操作）
make deploy-mainnet
```

## 使用方法

### TraderAgent 使用示例

```solidity
// 1. 执行即时交易
ITraderAgent.OrderParams memory params = ITraderAgent.OrderParams({
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: 1 ether,
    amountOutMin: 3000 * 1e6, // 最少 3000 USDC
    deadline: block.timestamp + 300,
    routeData: ""
});

uint256 amountOut = traderAgent.executeOrder{value: 1 ether}(params);

// 2. 放置限价订单
uint256 orderId = traderAgent.placeLimitOrder{value: 1 ether}(
    address(0), // ETH
    USDC,
    1 ether,
    3100 * 1e6, // 目标价格 3100 USDC
    block.timestamp + 3600 // 1小时后过期
);
```

### RouterDefense 使用示例

```solidity
// 1. 受保护的交换
IRouterDefense.SwapParams memory params = IRouterDefense.SwapParams({
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: 10 ether,
    amountOutMin: 29000 * 1e6,
    recipient: msg.sender,
    deadline: block.timestamp + 300
});

uint256 amountOut = routerDefense.protectedSwap{value: 10 ether}(params);

// 2. Commit-Reveal 交易
bytes32 commitment = keccak256(abi.encodePacked(
    msg.sender,
    params.tokenIn,
    params.tokenOut,
    params.amountIn,
    params.amountOutMin,
    params.recipient,
    params.deadline,
    nonce,
    salt
));

// 提交承诺
routerDefense.commitOrder(commitment, block.timestamp + 120);

// 等待并揭示
routerDefense.revealAndExecute{value: 10 ether}(params, nonce, salt);
```

## 安全特性

1. **重入攻击防护**：所有外部调用都使用 ReentrancyGuard
2. **权限控制**：关键功能限制调用者权限
3. **时间锁定**：Commit-Reveal 机制防止抢跑
4. **滑点保护**：自动计算和验证最小输出
5. **Gas 优化**：批量操作减少交易成本

## 开发工具

```bash
# 代码格式化
make fmt

# 生成 Gas 报告
make gas-report

# 检查合约大小
make size-check

# 生成文档
make docs

# 运行安全审计（需要安装 slither）
make audit
```

## 注意事项

1. **测试网测试**：请先在测试网充分测试
2. **私钥安全**：请勿将私钥提交到代码仓库
3. **Gas 费用**：主网部署和使用需要消耗真实 ETH
4. **合约审计**：主网部署前建议进行专业安全审计
5. **监控和升级**：部署后持续监控合约运行状态

## 许可证

MIT License