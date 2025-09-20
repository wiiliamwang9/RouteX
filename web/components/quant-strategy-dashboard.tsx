"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { TokenSelector } from "@/components/token-selector"
import { useCreateStrategy, useGetUserStrategies, useActivateStrategy, usePauseStrategy } from "@/hooks/use-strategies"
import { useWallet } from "@/hooks/use-wallet"
import { SUPPORTED_TOKENS } from "@/lib/config"
import { formatDistanceToNow } from "date-fns"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Grid, 
  Repeat, 
  Zap,
  Settings,
  Play,
  Pause,
  Stop,
  BarChart3,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2
} from "lucide-react"

// 策略类型定义
const STRATEGY_TYPES = [
  { id: 0, name: "套利策略", icon: Target, description: "利用价格差异获取无风险收益" },
  { id: 1, name: "网格策略", icon: Grid, description: "在价格区间内自动买卖获取收益" },
  { id: 2, name: "定投策略", icon: Repeat, description: "定期投资平摊成本" },
  { id: 3, name: "动量策略", icon: Zap, description: "跟随市场趋势进行交易" },
]

const STRATEGY_STATUS = {
  0: { name: "待激活", color: "bg-gray-500", icon: Clock },
  1: { name: "运行中", color: "bg-green-500", icon: Play },
  2: { name: "已暂停", color: "bg-yellow-500", icon: Pause },
  3: { name: "已停止", color: "bg-red-500", icon: Stop },
}

const RISK_LEVELS = [
  { id: 0, name: "保守", color: "text-green-600", description: "低风险低收益" },
  { id: 1, name: "平衡", color: "text-blue-600", description: "中等风险中等收益" },
  { id: 2, name: "激进", color: "text-red-600", description: "高风险高收益" },
]

import { Strategy } from "@/hooks/use-strategies"

export function QuantStrategyDashboard() {
  const { isConnected, address } = useWallet()
  const { createStrategy, isLoading: isCreating } = useCreateStrategy()
  const { strategies, isLoading: strategiesLoading, refetch: refetchStrategies } = useGetUserStrategies(address)
  
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  
  // 创建策略表单状态
  const [newStrategy, setNewStrategy] = useState({
    type: 0,
    tokenIn: SUPPORTED_TOKENS[0],
    tokenOut: SUPPORTED_TOKENS[1],
    initialCapital: "",
    riskLevel: 1,
    parameters: {
      targetPrice: "",
      gridLevels: 10,
      dcaInterval: 24, // 小时
      stopLoss: "",
      takeProfit: "",
    }
  })

  const handleCreateStrategy = async () => {
    if (!newStrategy.initialCapital || !isConnected) return

    try {
      const capitalWei = BigInt(Number(newStrategy.initialCapital) * 1e18)
      const maxRiskWei = BigInt(capitalWei * BigInt(newStrategy.riskLevel + 1) / 10n) // 风险系数

      const parameters = {
        targetPrice: newStrategy.parameters.targetPrice ? 
          BigInt(Number(newStrategy.parameters.targetPrice) * 1e18) : undefined,
        gridLevels: newStrategy.parameters.gridLevels,
        dcaInterval: newStrategy.parameters.dcaInterval * 3600, // 转换为秒
        stopLoss: newStrategy.parameters.stopLoss ? 
          BigInt(Number(newStrategy.parameters.stopLoss) * 1e18) : undefined,
        takeProfit: newStrategy.parameters.takeProfit ? 
          BigInt(Number(newStrategy.parameters.takeProfit) * 1e18) : undefined,
      }

      await createStrategy(newStrategy.type, parameters, capitalWei, maxRiskWei)
      
      // 重置表单
      setNewStrategy(prev => ({
        ...prev,
        initialCapital: "",
        parameters: {
          ...prev.parameters,
          targetPrice: "",
          stopLoss: "",
          takeProfit: "",
        }
      }))
      
      // 刷新策略列表
      setTimeout(() => refetchStrategies(), 2000)
    } catch (error) {
      console.error("创建策略失败:", error)
    }
  }

  const formatCurrency = (value: bigint) => {
    const ethValue = Number(value) / 1e18
    return ethValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })
  }

  const calculatePnLPercentage = (strategy: Strategy) => {
    if (strategy.initialCapital === 0n) return 0
    return Number((strategy.profitLoss * 100n) / strategy.initialCapital)
  }

  const getTotalPortfolioValue = () => {
    if (!strategies?.length) return 0n
    return strategies.reduce((total, strategy) => total + strategy.currentValue, 0n)
  }

  const getTotalPnL = () => {
    if (!strategies?.length) return 0n
    return strategies.reduce((total, strategy) => total + strategy.profitLoss, 0n)
  }

  const getActiveStrategiesCount = () => {
    if (!strategies?.length) return 0
    return strategies.filter(s => s.status === 1).length
  }

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">量化策略管理</h3>
        <p className="text-muted-foreground mb-6">
          请连接钱包以访问量化策略功能
        </p>
        <Button disabled>连接钱包</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总资产价值</p>
              <p className="text-lg font-semibold">{formatCurrency(getTotalPortfolioValue())}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总盈亏</p>
              <p className={`text-lg font-semibold ${getTotalPnL() >= 0n ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(getTotalPnL())}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">活跃策略</p>
              <p className="text-lg font-semibold">{getActiveStrategiesCount()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">策略总数</p>
              <p className="text-lg font-semibold">{strategies?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">策略概览</TabsTrigger>
          <TabsTrigger value="create">创建策略</TabsTrigger>
          <TabsTrigger value="management">策略管理</TabsTrigger>
        </TabsList>

        {/* 策略概览 */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">我的策略</h3>
            
            {strategiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-lg animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-muted rounded animate-pulse"></div>
                        <div className="w-24 h-3 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-20 h-6 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : strategies?.length ? (
              <div className="space-y-3">
                {strategies.map((strategy) => {
                  const strategyType = STRATEGY_TYPES[strategy.strategyType]
                  const status = STRATEGY_STATUS[strategy.status]
                  const pnlPercentage = calculatePnLPercentage(strategy)
                  const StatusIcon = status.icon
                  const TypeIcon = strategyType.icon

                  return (
                    <div 
                      key={strategy.id.toString()} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedStrategy(strategy)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-5 w-5 text-muted-foreground" />
                          <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{strategyType.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              ID: {strategy.id.toString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(strategy.initialCapital)} 初始资金
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{status.name}</span>
                        </div>
                        <div className={`text-sm font-mono ${pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-medium mb-2">还没有策略</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  创建您的第一个量化交易策略开始自动化投资
                </p>
                <Button onClick={() => setActiveTab("create")}>
                  创建策略
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 创建策略 */}
        <TabsContent value="create" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">创建新策略</h3>
            
            <div className="space-y-6">
              {/* 策略类型选择 */}
              <div className="space-y-3">
                <Label>策略类型</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STRATEGY_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <div
                        key={type.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          newStrategy.type === type.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setNewStrategy(prev => ({ ...prev, type: type.id }))}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div>
                            <h4 className="font-medium">{type.name}</h4>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 基础配置 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>初始资金 (ETH)</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={newStrategy.initialCapital}
                    onChange={(e) => setNewStrategy(prev => ({ 
                      ...prev, 
                      initialCapital: e.target.value 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>风险等级</Label>
                  <Select 
                    value={newStrategy.riskLevel.toString()} 
                    onValueChange={(value) => setNewStrategy(prev => ({ 
                      ...prev, 
                      riskLevel: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_LEVELS.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className={level.color}>{level.name}</span>
                            <span className="text-muted-foreground">- {level.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 策略参数 */}
              <div className="space-y-4">
                <h4 className="font-medium">策略参数</h4>
                
                {newStrategy.type === 0 && ( // 套利策略
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>目标价格 (USD)</Label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={newStrategy.parameters.targetPrice}
                        onChange={(e) => setNewStrategy(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, targetPrice: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                )}

                {newStrategy.type === 1 && ( // 网格策略
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>网格层数</Label>
                      <Input
                        type="number"
                        value={newStrategy.parameters.gridLevels}
                        onChange={(e) => setNewStrategy(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, gridLevels: parseInt(e.target.value) || 10 }
                        }))}
                      />
                    </div>
                  </div>
                )}

                {newStrategy.type === 2 && ( // 定投策略
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>投资间隔 (小时)</Label>
                      <Input
                        type="number"
                        value={newStrategy.parameters.dcaInterval}
                        onChange={(e) => setNewStrategy(prev => ({
                          ...prev,
                          parameters: { ...prev.parameters, dcaInterval: parseInt(e.target.value) || 24 }
                        }))}
                      />
                    </div>
                  </div>
                )}

                {/* 通用风控参数 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>止损价格 (USD)</Label>
                    <Input
                      type="number"
                      placeholder="可选"
                      value={newStrategy.parameters.stopLoss}
                      onChange={(e) => setNewStrategy(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, stopLoss: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>止盈价格 (USD)</Label>
                    <Input
                      type="number"
                      placeholder="可选"
                      value={newStrategy.parameters.takeProfit}
                      onChange={(e) => setNewStrategy(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, takeProfit: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <Button 
                onClick={handleCreateStrategy} 
                disabled={!newStrategy.initialCapital || isCreating}
                className="w-full"
              >
                {isCreating ? "创建中..." : "创建策略"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 策略管理 */}
        <TabsContent value="management" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">策略管理</h3>
            
            {strategies?.length ? (
              <div className="space-y-4">
                {strategies.map((strategy) => {
                  const strategyType = STRATEGY_TYPES[strategy.strategyType]
                  const status = STRATEGY_STATUS[strategy.status]
                  const TypeIcon = strategyType.icon

                  return (
                    <Card key={strategy.id.toString()} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <TypeIcon className="h-5 w-5" />
                          <div>
                            <h4 className="font-medium">{strategyType.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              策略 ID: {strategy.id.toString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={status.name === "运行中" ? "default" : "secondary"}>
                            {status.name}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">初始资金</p>
                          <p className="font-medium">{formatCurrency(strategy.initialCapital)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">当前价值</p>
                          <p className="font-medium">{formatCurrency(strategy.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">总盈亏</p>
                          <p className={`font-medium ${strategy.profitLoss >= 0n ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(strategy.profitLoss)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">交易次数</p>
                          <p className="font-medium">{strategy.totalTrades}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          查看详情
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                        {strategy.status === 1 ? (
                          <Button variant="outline" size="sm">
                            <Pause className="h-4 w-4 mr-1" />
                            暂停
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            启动
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">还没有策略需要管理</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}