# 🧪 RouteX 核心功能测试指南

## 🎯 测试目标
验证以下核心功能是否正常工作：
1. **量化交易系统** (TraderAgent)
2. **流动性路由** (RouterDefense)
3. **AI策略优化** (AIStrategyOptimizer)
4. **MEV保护** (RouterDefense)
5. **跨链功能** (CrossChainRouter)

---

## 📋 预备条件

### **1. 钱包准备**
- ✅ 连接到 Monad 测试网
- ✅ 网络配置: 
  - RPC: `https://testnet-rpc.monad.xyz/`
  - 链ID: `10143`
  - 区块浏览器: `https://testnet.monadexplorer.com`

### **2. 测试代币准备**
- 🪙 **MON**: 原生代币 (用于 Gas 费)
- 🪙 **WETH**: `0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37`
- 🪙 **USDC**: `0xf817257fed379853cDe0fa4F97AB987181B1E5Ea`
- 🪙 **DAI**: `0xA3dbBD3887228aE84f08bE839f9e20485759a004`

### **3. 已部署合约地址**
```javascript
// 核心合约 (已部署到 Monad 测试网)
const CONTRACTS = {
  TRADER_AGENT: "0x7267749E1Fa24Cae44e1B76Ec90F3B2f98D2C290",
  ROUTER_DEFENSE: "0x458Ec2Bc6E645ccd8f98599D6E4d942ea480ca16",
  CROSSCHAIN_ROUTER: "0x22A8C0BD01f88D3461c98E9bc3399A83dDBB9Cee",
  AI_STRATEGY_OPTIMIZER: "0xc6aF426FC11BFb6d46ffaB9A57c30ab5437AA09C",
  QUANTGUARD_PRO: "0xb10a0b0f6282024D5c3b5256CB312D06177cF4ab"
}
```

---

## 🔧 测试工具设置

### **方法1: 使用 RouteX Web 界面**
1. 访问 RouteX 应用
2. 连接 MetaMask 到 Monad 测试网
3. 确保有足够的测试代币

### **方法2: 直接合约交互**
使用 Ethers.js 或 Web3.js 直接调用合约

### **方法3: 区块浏览器验证**
在 [Monad Explorer](https://testnet.monadexplorer.com) 查看交易状态

---

## 📊 测试用例

## 1️⃣ **量化交易系统测试**

### **测试 A: 市价单执行**
```javascript
// 测试目标: 验证市价单能正确执行
async function testMarketOrder() {
  const params = {
    tokenIn: WETH_ADDRESS,
    tokenOut: USDC_ADDRESS,
    amountIn: "0.01", // 0.01 WETH
    slippage: 0.5 // 0.5%
  }
  
  // 预期结果:
  // ✅ 交易成功执行
  // ✅ 获得预期数量的 USDC
  // ✅ Gas 费合理
  // ✅ 交易时间 < 10秒
}
```

**Web 界面测试步骤:**
1. 进入 "Swap" 标签页
2. 选择 WETH → USDC
3. 输入数量: 0.01 WETH
4. 点击 "智能交换"
5. 确认 MetaMask 交易

**验证指标:**
- ✅ 交易成功 (绿色确认)
- ✅ 余额正确更新
- ✅ 滑点控制在 0.5% 内
- ✅ 交易费用合理

### **测试 B: 限价单管理**
```javascript
// 测试目标: 创建和管理限价单
async function testLimitOrder() {
  const params = {
    tokenIn: WETH_ADDRESS,
    tokenOut: USDC_ADDRESS,
    amountIn: "0.01",
    targetPrice: "2600", // 目标价格
    deadline: Date.now() + 86400000 // 24小时
  }
  
  // 预期结果:
  // ✅ 限价单创建成功
  // ✅ 订单状态可查询
  // ✅ 可以取消订单
}
```

**Web 界面测试步骤:**
1. 进入 "Orders" 标签页
2. 创建限价单
3. 查看订单历史
4. 测试取消订单

---

## 2️⃣ **流动性路由测试**

### **测试 A: 最优路径发现**
```javascript
// 测试目标: 验证能找到最优交易路径
async function testOptimalRouting() {
  const params = {
    tokenIn: WETH_ADDRESS,
    tokenOut: DAI_ADDRESS,
    amountIn: "0.1"
  }
  
  // 预期结果:
  // ✅ 返回最优路径
  // ✅ 估算输出数量准确
  // ✅ 价格影响计算正确
}
```

**验证方法:**
1. 在 Web 界面选择不同交易对
2. 观察路径建议和价格估算
3. 对比多个 DEX 的价格

### **测试 B: MEV 保护机制**
```javascript
// 测试目标: 验证 MEV 保护功能
async function testMEVProtection() {
  // 使用 commit-reveal 机制
  const commitment = generateCommitment()
  
  // 第一步: 提交承诺
  await routerDefense.commitOrder(commitment)
  
  // 等待一个区块
  await waitForBlocks(1)
  
  // 第二步: 揭示并执行
  await routerDefense.revealAndExecute(params, nonce)
  
  // 预期结果:
  // ✅ 两阶段交易成功
  // ✅ 避免前置交易攻击
}
```

---

## 3️⃣ **AI 策略优化测试**

### **测试 A: 路径优化**
```javascript
// 测试目标: AI 策略提供更好的交易路径
async function testAIOptimization() {
  const params = {
    tokenIn: WETH_ADDRESS,
    tokenOut: USDC_ADDRESS,
    amountIn: "1.0",
    riskTolerance: 1 // 中等风险
  }
  
  // 预期结果:
  // ✅ AI 路径优于标准路径
  // ✅ 返回置信度分数
  // ✅ 考虑风险因素
}
```

### **测试 B: 风险评估**
```javascript
// 测试目标: AI 风险评估功能
async function testRiskAssessment() {
  // 预期结果:
  // ✅ 返回风险等级 (低/中/高)
  // ✅ 提供风险警告
  // ✅ 波动性分析准确
}
```

---

## 4️⃣ **跨链功能测试**

### **测试 A: 跨链桥接**
```javascript
// 测试目标: 跨链资产转移
async function testCrossChainBridge() {
  const params = {
    targetChainId: 1, // 以太坊主网
    token: WETH_ADDRESS,
    amount: "0.01",
    recipient: userAddress
  }
  
  // 预期结果:
  // ✅ 跨链交易初始化
  // ✅ 选择最优桥接方案
  // ✅ 估算时间和费用准确
}
```

---

## 📊 性能测试指标

### **响应时间**
- 🎯 交易执行: < 10 秒
- 🎯 路径计算: < 3 秒
- 🎯 价格更新: < 5 秒
- 🎯 AI 分析: < 15 秒

### **准确性**
- 🎯 价格滑点: < 设定值
- 🎯 Gas 估算误差: < 10%
- 🎯 路径优化改进: > 1%

### **可靠性**
- 🎯 交易成功率: > 95%
- 🎯 系统可用性: > 99%
- 🎯 错误恢复: < 30 秒

---

## 🛠️ 故障排查

### **常见问题**

1. **交易失败**
   ```bash
   # 检查余额
   # 检查授权状态
   # 验证网络连接
   # 查看 Gas 设置
   ```

2. **价格异常**
   ```bash
   # 刷新价格数据
   # 检查预言机状态
   # 对比外部价格源
   ```

3. **路由失败**
   ```bash
   # 检查流动性
   # 验证代币地址
   # 测试不同数量
   ```

### **调试工具**
- 🔍 浏览器开发者工具
- 📝 合约事件日志
- 🌐 区块浏览器交易详情
- 📊 网络监控工具

---

## ✅ 测试检查清单

### **基础功能** ✅
- [ ] 钱包连接
- [ ] 网络切换
- [ ] 余额显示
- [ ] 价格获取

### **交易功能** ⚡
- [ ] 市价单执行
- [ ] 限价单管理
- [ ] 授权处理
- [ ] 交易确认

### **高级功能** 🚀
- [ ] MEV 保护
- [ ] AI 路径优化
- [ ] 风险评估
- [ ] 跨链桥接

### **用户体验** 🎨
- [ ] 响应速度
- [ ] 错误处理
- [ ] 状态更新
- [ ] 交互反馈

---

## 📈 监控和分析

### **实时监控**
```javascript
// 设置监控指标
const metrics = {
  transactionCount: 0,
  successRate: 0,
  averageGasUsed: 0,
  averageExecutionTime: 0
}

// 监控函数
function monitorPerformance() {
  // 记录关键指标
  // 生成性能报告
  // 发送告警通知
}
```

### **数据分析**
- 📊 交易量统计
- 💰 费用分析
- ⏱️ 性能趋势
- 🔄 用户行为

---

## 🎯 成功标准

### **功能完整性**
- ✅ 所有核心功能可用
- ✅ 错误处理完善
- ✅ 用户体验流畅

### **性能指标**
- ✅ 响应时间达标
- ✅ 成功率 > 95%
- ✅ Gas 效率优化

### **安全性**
- ✅ MEV 保护有效
- ✅ 合约安全审计
- ✅ 用户资金安全

通过这个全面的测试指南，您可以系统性地验证 RouteX 的所有核心功能是否正常工作！🚀