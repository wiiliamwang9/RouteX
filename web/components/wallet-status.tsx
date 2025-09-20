"use client"

import { useState } from 'react'
import { useAccount, useNetwork, useBalance } from 'wagmi'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, Wifi, WifiOff, Eye, EyeOff, Wallet, Copy, ExternalLink } from 'lucide-react'
import { useMultiTokenBalances } from '@/hooks/use-contracts'
import { useAllTokenPrices } from '@/hooks/use-token-prices'
import { SUPPORTED_TOKENS } from '@/lib/config'

/**
 * 钱包状态和余额显示组件
 * 显示在右上角网络区域，包含网络信息和用户代币余额
 */
export function WalletStatus() {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const [showBalances, setShowBalances] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // 获取原生代币余额 (MON)
  const { data: nativeBalance } = useBalance({
    address,
    enabled: !!address,
    watch: true,
  })

  // 获取所有代币余额
  const { tokenBalances } = useMultiTokenBalances(address)
  
  // 获取价格信息用于价值计算
  const { prices } = useAllTokenPrices()

  // 计算总投资组合价值
  const calculatePortfolioValue = () => {
    let totalValue = 0
    
    // 原生代币价值
    if (nativeBalance && prices['MON']) {
      const nativeValue = parseFloat(nativeBalance.formatted) * prices['MON'].price
      totalValue += nativeValue
    }
    
    // ERC20代币价值
    tokenBalances.forEach(token => {
      const price = prices[token.symbol]?.price || 0
      const balance = parseFloat(token.balanceFormatted)
      totalValue += balance * price
    })
    
    return totalValue
  }

  const portfolioValue = calculatePortfolioValue()

  // 复制地址到剪贴板
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
    }
  }

  // 在区块浏览器中查看地址
  const viewInExplorer = () => {
    if (address && chain?.blockExplorers?.default) {
      window.open(`${chain.blockExplorers.default.url}/address/${address}`, '_blank')
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <WifiOff className="w-4 h-4" />
        <span>未连接</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 min-w-[240px] justify-between"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-500" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium">
              {chain?.name || 'Monad Testnet'}
            </span>
            <span className="text-xs text-gray-500">
              {showBalances 
                ? `余额: $${portfolioValue.toFixed(2)}`
                : `${address.slice(0, 6)}...${address.slice(-4)}`
              }
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </Button>

      {showDetails && (
        <Card className="absolute top-full right-0 mt-2 w-96 z-50 shadow-lg border">
          <CardContent className="p-4 space-y-4">
            {/* 钱包信息 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  钱包信息
                </h3>
                <Badge variant="outline" className="text-xs">
                  <Wifi className="w-3 h-3 mr-1 text-green-500" />
                  已连接
                </Badge>
              </div>
              
              <div className="text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">网络:</span>
                  <span>{chain?.name || 'Monad Testnet'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">链ID:</span>
                  <span>{chain?.id || '10143'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">地址:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono">{address.slice(0, 8)}...{address.slice(-6)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAddress}
                      className="h-5 w-5 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={viewInExplorer}
                      className="h-5 w-5 p-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">代币余额</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalances(!showBalances)}
                  className="h-6 px-2"
                >
                  {showBalances ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {showBalances ? (
                <div className="space-y-3">
                  {/* 投资组合总价值 */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">总价值</div>
                    <div className="text-lg font-bold text-blue-600">
                      ${portfolioValue.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tokenBalances.filter(t => parseFloat(t.balanceFormatted) > 0).length + 
                       (nativeBalance && parseFloat(nativeBalance.formatted) > 0 ? 1 : 0)} 种代币
                    </div>
                  </div>

                  {/* 原生代币余额 */}
                  {nativeBalance && parseFloat(nativeBalance.formatted) > 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600">M</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">MON</div>
                          <div className="text-xs text-gray-500">Monad</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {parseFloat(nativeBalance.formatted).toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${(parseFloat(nativeBalance.formatted) * (prices['MON']?.price || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ERC20代币余额 */}
                  {tokenBalances.map((token) => {
                    const price = prices[token.symbol]?.price || 0
                    const balance = parseFloat(token.balanceFormatted)
                    const value = balance * price

                    if (balance === 0) return null

                    return (
                      <div key={token.address} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-600">
                              {token.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {balance.toFixed(4)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${value.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* 如果没有代币余额 */}
                  {tokenBalances.every(token => parseFloat(token.balanceFormatted) === 0) && 
                   (!nativeBalance || parseFloat(nativeBalance.formatted) === 0) && (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <div>暂无代币余额</div>
                      <div className="text-xs mt-1">请先获取一些测试代币</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div>点击眼睛图标查看余额</div>
                </div>
              )}
            </div>

            {/* 快速操作 */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  充值
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  发送
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  交易
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}