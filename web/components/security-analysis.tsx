"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMEVProtection } from "@/hooks/use-mev-protection"
import { Shield, AlertTriangle, CheckCircle, Eye, EyeOff, TrendingUp, Target } from "lucide-react"

interface SecurityAnalysisProps {
  transactionData: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage: number
    route: string[]
  } | null
  onProtectionEnabled: (enabled: boolean) => void
}

export function SecurityAnalysis({ transactionData, onProtectionEnabled }: SecurityAnalysisProps) {
  const { analyzeTransaction, isAnalyzing } = useMEVProtection()
  const [analysis, setAnalysis] = useState<any>(null)
  const [protectionEnabled, setProtectionEnabled] = useState(false)

  useEffect(() => {
    if (transactionData) {
      analyzeTransaction(transactionData).then(setAnalysis)
    }
  }, [transactionData, analyzeTransaction])

  const handleProtectionToggle = () => {
    const newState = !protectionEnabled
    setProtectionEnabled(newState)
    onProtectionEnabled(newState)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "low":
        return "default"
      case "medium":
        return "secondary"
      case "high":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (!transactionData) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Security Analysis</h3>
        </div>
        <p className="text-muted-foreground">Enter transaction details to analyze MEV risks</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Security Analysis</h3>
          </div>
          {analysis && (
            <Badge variant={getRiskBadgeVariant(analysis.riskLevel)} className="capitalize">
              {analysis.riskLevel} Risk
            </Badge>
          )}
        </div>

        {isAnalyzing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Analyzing transaction security...</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Risk Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">MEV Risk</span>
                </div>
                <Progress value={analysis.mevRisk} className="h-2" />
                <span className="text-xs text-muted-foreground">{analysis.mevRisk}%</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Frontrun Risk</span>
                </div>
                <Progress value={analysis.frontrunRisk} className="h-2" />
                <span className="text-xs text-muted-foreground">{analysis.frontrunRisk}%</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sandwich Risk</span>
                </div>
                <Progress value={analysis.sandwichRisk} className="h-2" />
                <span className="text-xs text-muted-foreground">{analysis.sandwichRisk}%</span>
              </div>
            </div>

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Security Warnings
                </h4>
                {analysis.warnings.map((warning: string, index: number) => (
                  <Alert key={index} className="border-yellow-500/20 bg-yellow-500/5">
                    <AlertDescription className="text-sm">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Recommendations
                </h4>
                <div className="space-y-1">
                  {analysis.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Protection Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">MEV Protection</span>
                  {protectionEnabled && (
                    <Badge variant="default" className="text-xs">
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Use commit-reveal mechanism to protect against MEV attacks
                </p>
              </div>
              <Button
                variant={protectionEnabled ? "default" : "outline"}
                onClick={handleProtectionToggle}
                className="flex items-center gap-2"
              >
                {protectionEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {protectionEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
