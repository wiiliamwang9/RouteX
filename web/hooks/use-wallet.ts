"use client"

import { useState, useEffect, useCallback } from "react"
import { MONAD_CONFIG } from "@/lib/config"

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: number | null
  balance: string | null
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    balance: null,
  })

  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return

    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      const chainId = await window.ethereum.request({ method: "eth_chainId" })

      if (accounts.length > 0) {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [accounts[0], "latest"],
        })

        setWalletState({
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
          chainId: Number.parseInt(chainId, 16),
          balance: (Number.parseInt(balance, 16) / 1e18).toFixed(4),
        })
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error)
    }
  }, [])

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet")
      return
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true }))

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        await checkConnection()
        await switchToMonadChain()
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      setWalletState((prev) => ({ ...prev, isConnecting: false }))
    }
  }, [checkConnection])

  const switchToMonadChain = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${MONAD_CONFIG.chainId.toString(16)}` }],
      })
    } catch (switchError: any) {
      // Chain not added to wallet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${MONAD_CONFIG.chainId.toString(16)}`,
                chainName: MONAD_CONFIG.chainName,
                rpcUrls: [MONAD_CONFIG.rpcUrl],
                nativeCurrency: MONAD_CONFIG.nativeCurrency,
                blockExplorerUrls: [MONAD_CONFIG.blockExplorerUrl],
              },
            ],
          })
        } catch (addError) {
          console.error("Error adding Monad chain:", addError)
        }
      }
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      balance: null,
    })
  }, [])

  const isOnMonadChain = walletState.chainId === MONAD_CONFIG.chainId

  useEffect(() => {
    checkConnection()

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", checkConnection)
      window.ethereum.on("chainChanged", checkConnection)

      return () => {
        window.ethereum.removeListener("accountsChanged", checkConnection)
        window.ethereum.removeListener("chainChanged", checkConnection)
      }
    }
  }, [checkConnection])

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchToMonadChain,
    isOnMonadChain,
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
