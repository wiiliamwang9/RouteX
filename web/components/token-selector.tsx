"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SUPPORTED_TOKENS } from "@/lib/config"
import { ChevronDown, Search } from "lucide-react"
import Image from "next/image"

interface TokenSelectorProps {
  selectedToken: (typeof SUPPORTED_TOKENS)[0] | null
  onTokenSelect: (token: (typeof SUPPORTED_TOKENS)[0]) => void
  excludeToken?: (typeof SUPPORTED_TOKENS)[0] | null
}

export function TokenSelector({ selectedToken, onTokenSelect, excludeToken }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTokens = SUPPORTED_TOKENS.filter(
    (token) =>
      token !== excludeToken &&
      (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleTokenSelect = (token: (typeof SUPPORTED_TOKENS)[0]) => {
    onTokenSelect(token)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-12 px-4 bg-transparent">
          {selectedToken ? (
            <>
              <Image
                src={selectedToken.logoUrl || "/placeholder.svg"}
                alt={selectedToken.symbol}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="font-semibold">{selectedToken.symbol}</span>
            </>
          ) : (
            <span>Select Token</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredTokens.map((token) => (
              <Button
                key={token.symbol}
                variant="ghost"
                className="w-full justify-start h-12 px-3"
                onClick={() => handleTokenSelect(token)}
              >
                <Image
                  src={token.logoUrl || "/placeholder.svg"}
                  alt={token.symbol}
                  width={24}
                  height={24}
                  className="rounded-full mr-3"
                />
                <div className="text-left">
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-xs text-muted-foreground">{token.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
