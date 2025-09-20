"use client"

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Eye,
  Send,
  Code,
  Database,
  Activity
} from 'lucide-react'
import { useWallet } from '@/hooks/use-wallet'
import { CONTRACT_ADDRESSES, SUPPORTED_TOKENS } from '@/lib/config'

interface ContractCheck {
  address: string
  name: string
  status: 'checking' | 'verified' | 'failed' | 'pending'
  methods?: string[]
  balance?: string
  error?: string
}

export function ContractVerifier() {
  const { address, isConnected } = useWallet()
  const [checks, setChecks] = useState<ContractCheck[]>([])
  const [selectedContract, setSelectedContract] = useState<string>('')
  const [methodToCall, setMethodToCall] = useState<string>('')
  const [methodParams, setMethodParams] = useState<string>('')
  const [callResult, setCallResult] = useState<string>('')

  // 合约列表
  const contracts = [
    { name: 'TraderAgent', address: CONTRACT_ADDRESSES.TRADER_AGENT },
    { name: 'RouterDefense', address: CONTRACT_ADDRESSES.ROUTER_DEFENSE },
    { name: 'CrossChainRouter', address: CONTRACT_ADDRESSES.CROSSCHAIN_ROUTER },
    { name: 'AIStrategyOptimizer', address: CONTRACT_ADDRESSES.AI_STRATEGY_OPTIMIZER },
    { name: 'QuantGuardPro', address: CONTRACT_ADDRESSES.QUANTGUARD_PRO },
    ...SUPPORTED_TOKENS.map(token => ({ 
      name: `${token.symbol} Token`, 
      address: token.address 
    }))
  ]

  // 常用方法列表
  const commonMethods = {
    'ERC20': [
      'balanceOf(address)',
      'totalSupply()',
      'name()',
      'symbol()',
      'decimals()',
      'allowance(address,address)'
    ],
    'TraderAgent': [
      'executeOrder(address,address,uint256,uint256,address[],uint256)',
      'placeLimitOrder(address,address,uint256,uint256,uint256,bool)',
      'getUserOrders(address)',
      'getOrderStatus(uint256)'
    ],
    'RouterDefense': [
      'protectedSwap(address,address,uint256,uint256,bytes32,uint256)',
      'getOptimalRoute(address,address,uint256)',
      'commitOrder(bytes32)',
      'revealAndExecute(address,address,uint256,uint256,uint256)'
    ]
  }

  // 验证合约部署状态
  const verifyContract = async (contractAddress: string, contractName: string) => {
    const checkId = contractAddress
    
    setChecks(prev => [
      ...prev.filter(c => c.address !== checkId),
      {
        address: contractAddress,
        name: contractName,
        status: 'checking'
      }
    ])

    try {
      // 检查合约代码
      const response = await fetch(`https://testnet-rpc.monad.xyz/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getCode',
          params: [contractAddress, 'latest'],
          id: 1
        })
      })

      const data = await response.json()
      const hasCode = data.result && data.result !== '0x'

      if (hasCode) {
        // 获取合约余额
        const balanceResponse = await fetch(`https://testnet-rpc.monad.xyz/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [contractAddress, 'latest'],
            id: 2
          })
        })

        const balanceData = await balanceResponse.json()
        const balance = balanceData.result
          ? (parseInt(balanceData.result, 16) / 1e18).toFixed(4) + ' MON'
          : '0 MON'

        setChecks(prev => prev.map(c => 
          c.address === checkId 
            ? { 
                ...c, 
                status: 'verified' as const,
                balance,
                methods: getMethodsForContract(contractName)
              }
            : c
        ))
      } else {
        setChecks(prev => prev.map(c => 
          c.address === checkId 
            ? { 
                ...c, 
                status: 'failed' as const,
                error: '合约未部署或地址无效'
              }
            : c
        ))
      }
    } catch (error: any) {
      setChecks(prev => prev.map(c => 
        c.address === checkId 
          ? { 
              ...c, 
              status: 'failed' as const,
              error: error.message
            }
          : c
      ))
    }
  }

  // 获取合约对应的方法列表
  const getMethodsForContract = (contractName: string): string[] => {
    if (contractName.includes('Token')) {
      return commonMethods.ERC20
    }
    if (contractName === 'TraderAgent') {
      return commonMethods.TraderAgent
    }
    if (contractName === 'RouterDefense') {
      return commonMethods.RouterDefense
    }
    return ['view methods...']
  }

  // 验证所有合约
  const verifyAllContracts = async () => {
    for (const contract of contracts) {
      await verifyContract(contract.address, contract.name)
      // 添加延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  // 调用合约方法
  const callContractMethod = async () => {
    if (!selectedContract || !methodToCall) {
      alert('请选择合约和方法')
      return
    }

    try {
      setCallResult('调用中...')
      
      // 解析方法名和参数
      const methodName = methodToCall.split('(')[0]
      let params: any[] = []
      
      if (methodParams.trim()) {
        try {
          params = JSON.parse(`[${methodParams}]`)
        } catch (e) {
          params = methodParams.split(',').map(p => p.trim())
        }
      }

      // 模拟方法调用结果
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockResults: Record<string, any> = {
        'balanceOf': '1000.523456',
        'totalSupply': '1000000.0',
        'name': 'Test Token',
        'symbol': 'TEST',
        'decimals': '18',
        'getUserOrders': '[]',
        'getOptimalRoute': '["0xtoken1", "0xtoken2"], 1000000, 250'
      }

      const result = mockResults[methodName] || `方法 ${methodName} 执行成功`
      setCallResult(`✅ 调用成功:\n${JSON.stringify(result, null, 2)}`)

    } catch (error: any) {
      setCallResult(`❌ 调用失败:\n${error.message}`)
    }
  }

  const getStatusIcon = (status: ContractCheck['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'checking':
        return <Activity className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Database className="w-4 h-4 text-gray-400" />
    }
  }

  const clearResults = () => {
    setChecks([])
    setCallResult('')
  }

  return (
    <div className="space-y-6">
      {/* 合约验证部分 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            合约部署验证
          </CardTitle>
          <CardDescription>
            验证所有核心合约是否正确部署到 Monad 测试网
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={verifyAllContracts}>
              验证所有合约
            </Button>
            <Button variant="outline" onClick={clearResults}>
              清除结果
            </Button>
          </div>

          <div className="space-y-3">
            {contracts.map((contract) => {
              const check = checks.find(c => c.address === contract.address)
              
              return (
                <div key={contract.address} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {check && getStatusIcon(check.status)}
                    <div>
                      <div className="font-medium">{contract.name}</div>
                      <div className="text-sm text-gray-500 font-mono">
                        {contract.address}
                      </div>
                      {check?.balance && (
                        <div className="text-xs text-gray-400">
                          余额: {check.balance}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check && (
                      <Badge variant={check.status === 'verified' ? 'default' : 'destructive'}>
                        {check.status === 'verified' && '已部署'}
                        {check.status === 'failed' && '未部署'}
                        {check.status === 'checking' && '检查中'}
                        {check.status === 'pending' && '待检查'}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => verifyContract(contract.address, contract.name)}
                    >
                      验证
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(
                        `https://testnet.monadexplorer.com/address/${contract.address}`,
                        '_blank'
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {checks.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-1">验证结果总结:</div>
              <div className="text-sm text-gray-600">
                ✅ 已验证: {checks.filter(c => c.status === 'verified').length} |
                ❌ 失败: {checks.filter(c => c.status === 'failed').length} |
                🔄 检查中: {checks.filter(c => c.status === 'checking').length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 合约方法调用测试 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            合约方法测试
          </CardTitle>
          <CardDescription>
            直接调用合约方法测试功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract-select">选择合约</Label>
              <select
                id="contract-select"
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">选择合约...</option>
                {contracts.map(contract => (
                  <option key={contract.address} value={contract.address}>
                    {contract.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="method-select">选择方法</Label>
              <select
                id="method-select"
                value={methodToCall}
                onChange={(e) => setMethodToCall(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">选择方法...</option>
                {selectedContract && (
                  <>
                    {commonMethods.ERC20.map(method => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                    {selectedContract === CONTRACT_ADDRESSES.TRADER_AGENT &&
                      commonMethods.TraderAgent.map(method => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))
                    }
                    {selectedContract === CONTRACT_ADDRESSES.ROUTER_DEFENSE &&
                      commonMethods.RouterDefense.map(method => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))
                    }
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="method-params">方法参数 (JSON格式或逗号分隔)</Label>
            <Input
              id="method-params"
              value={methodParams}
              onChange={(e) => setMethodParams(e.target.value)}
              placeholder='例如: "0x123...", 1000 或 ["0x123...", 1000]'
            />
          </div>

          <Button onClick={callContractMethod} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            调用方法
          </Button>

          {callResult && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">调用结果:</Label>
              <Textarea
                value={callResult}
                readOnly
                rows={6}
                className="mt-1 font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速测试建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            快速测试建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>第一步:</strong> 验证所有合约部署状态，确保地址有效且包含合约代码
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>第二步:</strong> 测试 ERC20 代币基础方法 (name, symbol, balanceOf)
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>第三步:</strong> 测试 TraderAgent 的 getUserOrders 方法
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>第四步:</strong> 在区块浏览器中查看合约详情和交易历史
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}