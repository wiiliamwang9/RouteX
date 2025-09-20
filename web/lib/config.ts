export const MONAD_CONFIG = {
  // TODO: Replace with actual Monad chain configuration
  chainId: 10143, // Placeholder - replace with actual Monad chainId
  rpcUrl: "https://testnet-rpc.monad.xyz",
  chainName: "Monad",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  blockExplorerUrl: "https://explorer.monad.xyz", // Placeholder
}

export const CONTRACT_ADDRESSES = {
  // TODO: Replace with actual contract addresses
  ROUTER_DEFENSE: "0x0000000000000000000000000000000000000000", // Placeholder
  TRADER_AGENT: "0x0000000000000000000000000000000000000000", // Placeholder
}

export const SUPPORTED_TOKENS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000", // Native token
    decimals: 18,
    logoUrl: "/ethereum-logo.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x0000000000000000000000000000000000000001", // TODO: Replace
    decimals: 6,
    logoUrl: "/usdc-logo.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x0000000000000000000000000000000000000002", // TODO: Replace
    decimals: 18,
    logoUrl: "/dai-logo.png",
  },
]
