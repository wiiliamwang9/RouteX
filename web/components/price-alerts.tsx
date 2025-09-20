"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/hooks/use-orders"
import { SUPPORTED_TOKENS } from "@/lib/config"
import { formatDistanceToNow } from "date-fns"
import { Bell, TrendingUp, TrendingDown, Plus } from "lucide-react"

export function PriceAlerts() {
  const { priceAlerts, createPriceAlert, togglePriceAlert } = useOrders()

  const [newAlert, setNewAlert] = useState({
    tokenSymbol: SUPPORTED_TOKENS[0].symbol,
    targetPrice: "",
    condition: "above" as "above" | "below",
  })

  const handleCreateAlert = async () => {
    if (!newAlert.targetPrice) return

    await createPriceAlert(newAlert)
    setNewAlert((prev) => ({ ...prev, targetPrice: "" }))
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
          </h3>
          <Badge variant="outline">{priceAlerts.filter((alert) => alert.isActive).length} active</Badge>
        </div>

        {/* Create New Alert */}
        <Card className="p-4 border-border/50">
          <div className="space-y-4">
            <h4 className="font-medium">Create Price Alert</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Token</Label>
                <Select
                  value={newAlert.tokenSymbol}
                  onValueChange={(value) => setNewAlert((prev) => ({ ...prev, tokenSymbol: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Condition</Label>
                <Select
                  value={newAlert.condition}
                  onValueChange={(value: "above" | "below") => setNewAlert((prev) => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Above
                      </div>
                    </SelectItem>
                    <SelectItem value="below">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Below
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Target Price ($)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newAlert.targetPrice}
                onChange={(e) => setNewAlert((prev) => ({ ...prev, targetPrice: e.target.value }))}
              />
            </div>

            <Button onClick={handleCreateAlert} disabled={!newAlert.targetPrice} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </Card>

        {/* Active Alerts */}
        <div className="space-y-3">
          {priceAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No price alerts set</p>
              <p className="text-sm">Create alerts to get notified when prices hit your targets</p>
            </div>
          ) : (
            priceAlerts.map((alert) => (
              <Card key={alert.id} className="p-4 border-border/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{alert.tokenSymbol}</Badge>
                      <div className="flex items-center gap-1">
                        {alert.condition === "above" ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-mono">${alert.targetPrice}</span>
                      </div>
                      <Badge variant={alert.isActive ? "default" : "secondary"}>
                        {alert.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Created {formatDistanceToNow(alert.createdAt)} ago</p>
                  </div>

                  <Switch checked={alert.isActive} onCheckedChange={() => togglePriceAlert(alert.id)} />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
