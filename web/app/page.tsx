"use client"

import { useEffect, useState } from 'react'
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { WalletConnect } from "@/components/wallet-connect"
import { SwapInterface } from "@/components/swap-interface"
import { OrderForm } from "@/components/order-form"
import { OrderHistory } from "@/components/order-history"
import { PriceAlerts } from "@/components/price-alerts"
import { ProtectionDashboard } from "@/components/protection-dashboard"
import { MarketOverview } from "@/components/market-overview"
import { LiquidityPools } from "@/components/liquidity-pools"
import { NetworkStatus } from "@/components/network-status"
import { PriceDisplay } from "@/components/price-display"
import { QuantStrategyDashboard } from "@/components/quant-strategy-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Shield,
  Bell,
  AreaChart,
  DollarSign,
  Target,
} from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const triggerClasses =
    "relative flex h-auto items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground data-[state=active]:bg-primary/90 data-[state=active]:text-white data-[state=active]:shadow-sm"

  const navigateToDashboard = () => {
    setActiveTab('dashboard')
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Image
                src="/RouteX-LOGO.jpg"
                alt="RouteX Logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg"
              />
              <h1 className="text-xl font-bold">RouteX</h1>
            </div>
            <TabsList className="hidden h-auto items-center justify-center rounded-none border-none bg-transparent p-0 sm:flex">
              <TabsTrigger value="home" className={triggerClasses}>
                <LayoutDashboard className="h-4 w-4" />
                Home
              </TabsTrigger>
              <TabsTrigger value="dashboard" className={triggerClasses}>
                <AreaChart className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="swap" className={triggerClasses}>
                <TrendingUp className="h-4 w-4" />
                Swap
              </TabsTrigger>
              <TabsTrigger value="prices" className={triggerClasses}>
                <DollarSign className="h-4 w-4" />
                Prices
              </TabsTrigger>
              <TabsTrigger value="orders" className={triggerClasses}>
                <BarChart3 className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="alerts" className={triggerClasses}>
                <Bell className="h-4 w-4" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="protection" className={triggerClasses}>
                <Shield className="h-4 w-4" />
                Protection
              </TabsTrigger>
              <TabsTrigger value="quant" className={triggerClasses}>
                <Target className="h-4 w-4" />
                Quant
              </TabsTrigger>
            </TabsList>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <TabsContent value="home" className="h-full">
          <div className="min-h-full bg-gradient-to-br from-pink-100 via-green-100 to-purple-100 -mx-4 -mt-8 px-4 pt-12 pb-16 overflow-auto">
            {/* 顶部奖励通知横幅 */}
            <div className="bg-white py-3 px-6 flex items-center justify-center gap-3 mb-16 max-w-4xl mx-auto rounded-lg shadow-sm">
              <span className="text-orange-500">🚀</span>
              <p className="text-sm">Experience the Future of DeFi with MEV Protection & Cross-chain Trading</p>
              <button className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm hover:bg-orange-600 transition-colors">
                Learn More
              </button>
            </div>

            {/* 主要内容区域 */}
            <div className="flex flex-col items-center text-center max-w-6xl mx-auto">
              <h1 className="text-7xl font-bold mb-20 leading-tight">
                Revolutionary<br />
                Cross-chain Trading Protocol
              </h1>

              {/* 统计数据部分 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 w-full max-w-5xl">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-3">$500M+</div>
                  <div className="text-gray-600 text-lg">Total Value Protected</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-3">100%</div>
                  <div className="text-gray-600 text-lg">MEV Protection</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-3">10+</div>
                  <div className="text-gray-600 text-lg">Chains Supported</div>
                </div>
              </div>

              {/* 开始按钮 */}
              <button 
                onClick={navigateToDashboard}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-5 rounded-full text-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Let's Start →
              </button>

              <p className="mt-6 text-gray-600 text-lg">
                Connect your wallet to start secure cross-chain trading
              </p>

              {/* 特性预览 */}
              <div className="flex gap-6 mt-16">
                <div className="px-6 py-4 bg-white/80 rounded-xl flex items-center gap-3 shadow-sm backdrop-blur-sm">
                  <span className="text-2xl">�️</span>
                  <span className="font-medium">MEV Protection</span>
                </div>
                <div className="px-6 py-4 bg-white/80 rounded-xl flex items-center gap-3 shadow-sm backdrop-blur-sm">
                  <span className="text-2xl">⚡</span>
                  <span className="font-medium">Lightning Fast</span>
                </div>
                <div className="px-6 py-4 bg-white/80 rounded-xl flex items-center gap-3 shadow-sm backdrop-blur-sm">
                  <span className="text-2xl">🔄</span>
                  <span className="font-medium">Cross-chain</span>
                </div>
              </div>

              {/* 特性详细信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mt-24">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold mb-4">MEV Protection</h3>
                  <p className="text-gray-600">
                    Our advanced protocol ensures your trades are protected from front-running and other malicious MEV attacks, saving you money on every transaction.
                  </p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold mb-4">Cross-chain Innovation</h3>
                  <p className="text-gray-600">
                    Trade seamlessly across multiple blockchains with our innovative cross-chain protocol, accessing the best liquidity and prices everywhere.
                  </p>
                </div>
              </div>

              {/* 合作伙伴展示 */}
              <div className="w-full max-w-6xl mt-24">
                <h3 className="text-2xl font-semibold mb-12 text-gray-800">Trusted By Leading Protocols</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                  <div className="bg-white/80 rounded-xl h-20 flex items-center justify-center shadow-sm">
                    <span className="text-gray-600 font-medium">Partner 1</span>
                  </div>
                  <div className="bg-white/80 rounded-xl h-20 flex items-center justify-center shadow-sm">
                    <span className="text-gray-600 font-medium">Partner 2</span>
                  </div>
                  <div className="bg-white/80 rounded-xl h-20 flex items-center justify-center shadow-sm">
                    <span className="text-gray-600 font-medium">Partner 3</span>
                  </div>
                  <div className="bg-white/80 rounded-xl h-20 flex items-center justify-center shadow-sm">
                    <span className="text-gray-600 font-medium">Partner 4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="flex-1 p-6">
          <div className="grid lg:grid-cols-4 gap-6 h-full">
            <div className="lg:col-span-1 space-y-6">
              <MarketOverview />
              <NetworkStatus />
            </div>
            <div className="lg:col-span-3">
              <LiquidityPools />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="swap" className="flex-1 p-6">
          <div className="h-full">
            <SwapInterface />
          </div>
        </TabsContent>

        <TabsContent value="prices">
          <PriceDisplay />
        </TabsContent>

        <TabsContent value="orders" className="flex-1 p-6">
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            <OrderForm />
            <OrderHistory />
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 p-6">
          <div className="max-w-2xl mx-auto h-full">
            <PriceAlerts />
          </div>
        </TabsContent>

        <TabsContent value="protection" className="flex-1 p-6">
          <div className="h-full">
            <ProtectionDashboard />
          </div>
        </TabsContent>

        <TabsContent value="quant" className="flex-1 p-6">
          <div className="h-full">
            <QuantStrategyDashboard />
          </div>
        </TabsContent>

      </main>
    </Tabs>
  )
}
