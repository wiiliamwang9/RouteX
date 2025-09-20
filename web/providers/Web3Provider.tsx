"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import { MONAD_CONFIG } from "@/lib/config"

// Define the shape of the context value
interface WalletContextType {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: number | null
  balance: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToMonadChain: () => Promise<void>
  isOnMonadChain: boolean
}

// Create a context for the wallet
export const WalletContext = createContext<WalletContextType | null>(null)

// Provider component
export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [walletState, setWalletState] = useState({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    balance: null,
  })

  const switchToMonadChain = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${MONAD_CONFIG.chainId.toString(16)}` }],
      })
    } catch (switchError: any) {
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
      } else {
        setWalletState({
          address: null,
          isConnected: false,
          isConnecting: false,
          chainId: null,
          balance: null,
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
      } else {
        // Handle case where user closes wallet modal without connecting
        setWalletState((prev) => ({ ...prev, isConnecting: false }))
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      // Reset state on error
      setWalletState((prev) => ({ ...prev, isConnecting: false, isConnected: false }))
    }
  }, [checkConnection])


  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      balance: null,
    })
    // Optionally, could add a specific disconnect method if the wallet provider supports it
  }, [])

  useEffect(() => {
    checkConnection()

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          checkConnection()
        }
      }
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", checkConnection)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", checkConnection)
      }
    }
  }, [checkConnection, disconnectWallet])

  const isOnMonadChain = walletState.chainId === MONAD_CONFIG.chainId

  const value = useMemo(
    () => ({
      ...walletState,
      connectWallet,
      disconnectWallet,
      switchToMonadChain,
      isOnMonadChain,
    }),
    [walletState, connectWallet, disconnectWallet, switchToMonadChain, isOnMonadChain],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// Custom hook to use the wallet context
export function useWalletContext() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWalletContext must be used within a Web3Provider")
  }
  return context
}


// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
