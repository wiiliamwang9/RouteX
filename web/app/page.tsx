"use client"

import Image from "next/image"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Shield,
  Bell,
  AreaChart,
  DollarSign,
} from "lucide-react"

export default function HomePage() {
  const triggerClasses =
    "relative flex h-auto items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground data-[state=active]:bg-primary/90 data-[state=active]:text-white data-[state=active]:shadow-sm"

  return (
    <Tabs defaultValue="dashboard" className="min-h-screen">
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
            </TabsList>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <TabsContent value="home" className="space-y-8">
          <div className="rounded-xl bg-card/80 p-8 text-center shadow-lg backdrop-blur-sm">
            <h2 className="text-4xl font-bold tracking-tight text-primary">
              Welcome to RouteX
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The future of decentralized trading is here. Built on the
              high-performance Monad blockchain, RouteX provides unparalleled
              speed, security, and intelligence for your trades.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-lg border bg-card/50 p-6 text-center shadow-md">
              <Shield className="h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">Ironclad Security</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                With MEV protection and our custom QuantGuardPro defense system,
                your assets are shielded from front-running and other on-chain
                threats.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-lg border bg-card/50 p-6 text-center shadow-md">
              <TrendingUp className="h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">
                Optimal Trade Routing
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Our advanced cross-chain router scours multiple liquidity pools
                to guarantee the best possible price for every single swap.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-lg border bg-card/50 p-6 text-center shadow-md">
              <BarChart3 className="h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">
                AI-Powered Strategies
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Leverage our AI Strategy Optimizer to analyze market conditions
                and enhance your trading performance automatically.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <MarketOverview />
              <NetworkStatus />
            </div>
            <div className="lg:col-span-3">
              <LiquidityPools />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="swap">
          <SwapInterface />
        </TabsContent>

        <TabsContent value="prices">
          <PriceDisplay />
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
      </main>
    </Tabs>
  )
}
