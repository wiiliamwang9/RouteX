import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import { Web3Provider } from "@/providers/Web3Provider"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "RouteX - Professional Trading Platform",
  description: "Advanced DEX and quantitative trading platform on Monad blockchain",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Suspense fallback={<div>Loading...</div>}>
          <Web3Provider>
            {children}
            <Toaster />
          </Web3Provider>
        </Suspense>
      </body>
    </html>
  )
}
