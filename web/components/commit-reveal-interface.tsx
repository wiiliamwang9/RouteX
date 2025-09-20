"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMEVProtection } from "@/hooks/use-mev-protection"
import { Lock, Unlock, Clock, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react"

interface CommitRevealInterfaceProps {
  orderData: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    amountOutMin: string
    deadline: number
  } | null
  onComplete: () => void
}

export function CommitRevealInterface({ orderData, onComplete }: CommitRevealInterfaceProps) {
  const { commitRevealState, commitOrder, revealOrder, resetCommitReveal } = useMEVProtection()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (commitRevealState.expirationTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, commitRevealState.expirationTime! - Date.now())
        setTimeRemaining(remaining)

        if (remaining === 0) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [commitRevealState.expirationTime])

  const handleCommit = async () => {
    if (!orderData) return

    setIsProcessing(true)
    try {
      const result = await commitOrder(orderData)
      if (!result.success) {
        alert(`Commit failed: ${result.error}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReveal = async () => {
    if (!orderData) return

    setIsProcessing(true)
    try {
      const result = await revealOrder(orderData)
      if (result.success) {
        setTimeout(() => {
          onComplete()
          resetCommitReveal()
        }, 2000)
      } else {
        alert(`Reveal failed: ${result.error}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getProgressValue = () => {
    if (!commitRevealState.expirationTime) return 0
    const total = 300000 // 5 minutes
    const remaining = timeRemaining
    return ((total - remaining) / total) * 100
  }

  if (!orderData) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Commit-Reveal Protection</h3>
          <p className="text-muted-foreground">Configure your transaction to enable MEV protection</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Commit-Reveal Protection
          </h3>
          <Badge variant="outline">2-Step Process</Badge>
        </div>

        {/* Process Steps */}
        <div className="space-y-4">
          {/* Step 1: Commit */}
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                commitRevealState.isCommitted
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground text-muted-foreground"
              }`}
            >
              {commitRevealState.isCommitted ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Commit Transaction</span>
                {commitRevealState.isCommitted && <Badge variant="default">Completed</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                Submit a commitment hash without revealing transaction details
              </p>
              {commitRevealState.commitTxHash && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-primary mt-1">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Commit Tx
                </Button>
              )}
            </div>
          </div>

          {/* Step 2: Reveal */}
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                commitRevealState.isRevealed
                  ? "bg-primary border-primary text-primary-foreground"
                  : commitRevealState.isCommitted
                    ? "border-primary text-primary"
                    : "border-muted-foreground text-muted-foreground"
              }`}
            >
              {commitRevealState.isRevealed ? <CheckCircle className="h-4 w-4" /> : "2"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Reveal & Execute</span>
                {commitRevealState.isRevealed && <Badge variant="default">Completed</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">Reveal transaction details and execute the protected swap</p>
              {commitRevealState.revealTxHash && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-primary mt-1">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Reveal Tx
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Timer and Progress */}
        {commitRevealState.isCommitted && !commitRevealState.isRevealed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Time Remaining</span>
              </div>
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
            {timeRemaining < 60000 && (
              <Alert className="border-yellow-500/20 bg-yellow-500/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Less than 1 minute remaining to reveal your transaction!</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!commitRevealState.isCommitted ? (
            <Button onClick={handleCommit} disabled={isProcessing} className="w-full">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Committing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Commit Transaction
                </>
              )}
            </Button>
          ) : !commitRevealState.isRevealed ? (
            <Button onClick={handleReveal} disabled={isProcessing || timeRemaining === 0} className="w-full">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Revealing...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Reveal & Execute
                </>
              )}
            </Button>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p className="text-lg font-semibold text-green-500">Transaction Protected & Executed!</p>
              <p className="text-sm text-muted-foreground">Your swap was successfully protected from MEV attacks</p>
            </div>
          )}

          {commitRevealState.isCommitted && !commitRevealState.isRevealed && (
            <Button variant="outline" onClick={resetCommitReveal} className="w-full bg-transparent">
              Cancel Protection
            </Button>
          )}
        </div>

        {/* Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Commit-reveal mechanism protects against frontrunning and sandwich attacks</p>
          <p>• You have 5 minutes to reveal after committing</p>
          <p>• Failed reveals will forfeit the committed transaction</p>
        </div>
      </div>
    </Card>
  )
}
