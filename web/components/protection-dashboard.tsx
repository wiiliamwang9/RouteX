'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityAnalysis } from '@/components/security-analysis';
import { CommitRevealInterface } from '@/components/commit-reveal-interface';
import { Shield, BarChart3, Settings } from 'lucide-react';

export function ProtectionDashboard() {
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  // Mock transaction data for demonstration
  const mockTransactionData = {
    tokenIn: 'ETH',
    tokenOut: 'USDC',
    amountIn: '5.0',
    slippage: 2.5,
    route: ['ETH', 'WETH', 'USDC'],
  };

  const mockOrderData = {
    tokenIn: '0x0000000000000000000000000000000000000000',
    tokenOut: '0x0000000000000000000000000000000000000001',
    amountIn: '5000000000000000000', // 5 ETH in wei
    amountOutMin: '9500000000', // 9500 USDC (6 decimals)
    deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
  };

  const handleProtectionComplete = () => {
    alert('Protected transaction completed successfully!');
    setProtectionEnabled(false);
    setTransactionData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MEV Protection</h2>
          <p className="text-muted-foreground">
            Advanced protection against MEV attacks and frontrunning
          </p>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Security Analysis
          </TabsTrigger>
          <TabsTrigger value="protection" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Commit-Reveal
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Transaction Analysis
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Transaction Analysis: This demonstrates security analysis for a
                sample transaction. In production, this would analyze your
                actual swap parameters.
              </p>
              <div className="space-y-2 text-sm bg-muted/30 p-3 rounded">
                <div>
                  <strong>Transaction:</strong> {mockTransactionData.amountIn}{' '}
                  {mockTransactionData.tokenIn} → {mockTransactionData.tokenOut}
                </div>
                <div>
                  <strong>Slippage:</strong> {mockTransactionData.slippage}%
                </div>
                <div>
                  <strong>Route:</strong>{' '}
                  {mockTransactionData.route.join(' → ')}
                </div>
              </div>
            </Card>

            <SecurityAnalysis
              transactionData={mockTransactionData}
              onProtectionEnabled={(enabled) => {
                setProtectionEnabled(enabled);
                if (enabled) {
                  setTransactionData(mockTransactionData);
                }
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="protection">
          <CommitRevealInterface
            orderData={protectionEnabled ? mockOrderData : null}
            onComplete={handleProtectionComplete}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Protection Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Default Protection Thresholds</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">
                      Auto-enable for transactions &gt;
                    </span>
                    <div className="font-mono">$10,000</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">
                      High-risk slippage threshold
                    </span>
                    <div className="font-mono">2.0%</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Commit-Reveal Settings</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Reveal window</span>
                    <div className="font-mono">5 minutes</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">
                      Gas optimization
                    </span>
                    <div className="font-mono">Enabled</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Protection settings can be customized based on your trading
                  preferences and risk tolerance. Contact support for advanced
                  configuration options.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
