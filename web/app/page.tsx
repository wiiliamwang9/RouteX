"use client"

import { WalletConnect } from "@/components/wallet-connect"
import { SwapInterface } from "@/components/swap-interface"
import { OrderForm } from "@/components/order-form"
import { OrderHistory } from "@/components/order-history"
import { PriceAlerts } from "@/components/price-alerts"
import { ProtectionDashboard } from "@/components/protection-dashboard"
import { MarketOverview } from "@/components/market-overview"
import { LiquidityPools } from "@/components/liquidity-pools"
import { NetworkStatus } from "@/components/network-status"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, BarChart3, Shield, Bell } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Monad DEX</h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Professional Trading Platform</h2>
          <p className="text-muted-foreground">
            Advanced DEX with MEV protection and quantitative trading tools on Monad blockchain
          </p>
        </div>

        {/* Market Data Sidebar */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1 space-y-6">
            <MarketOverview />
            <NetworkStatus />
          </div>
          <div className="lg:col-span-3">
            <LiquidityPools />
          </div>
        </div>

        <Tabs defaultValue="swap" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="swap" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Swap
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="protection" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Protection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swap">
            <SwapInterface />
          </TabsContent>

          <TabsContent value="orders">
            <div className="grid lg:grid-cols-2 gap-6">
              <OrderForm />
              <OrderHistory />
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="max-w-2xl mx-auto">
              <PriceAlerts />
            </div>
          </TabsContent>

          <TabsContent value="protection">
            <ProtectionDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
