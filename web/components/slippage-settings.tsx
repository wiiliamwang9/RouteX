"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings } from "lucide-react"

interface SlippageSettingsProps {
  slippage: number
  onSlippageChange: (slippage: number) => void
}

export function SlippageSettings({ slippage, onSlippageChange }: SlippageSettingsProps) {
  const [customSlippage, setCustomSlippage] = useState("")
  const [open, setOpen] = useState(false)

  const presetSlippages = [0.1, 0.5, 1.0]

  const handlePresetSlippage = (value: number) => {
    onSlippageChange(value)
    setCustomSlippage("")
  }

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value)
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onSlippageChange(numValue)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Slippage Tolerance</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Your transaction will revert if the price changes unfavorably by more than this percentage.
            </p>
          </div>

          <div className="flex gap-2">
            {presetSlippages.map((preset) => (
              <Button
                key={preset}
                variant={slippage === preset ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSlippage(preset)}
                className="flex-1"
              >
                {preset}%
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Custom"
              value={customSlippage}
              onChange={(e) => handleCustomSlippage(e.target.value)}
              className="flex-1"
              min="0"
              max="50"
              step="0.1"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>

          {slippage > 5 && (
            <div className="text-sm text-destructive">High slippage tolerance may result in unfavorable trades</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
