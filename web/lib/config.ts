export const MONAD_CONFIG = {
  chainId: 10143,
  rpcUrl: "https://testnet-rpc.monad.xyz",
  chainName: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  blockExplorerUrl: "https://explorer.monad.xyz",
}

export const CONTRACT_ADDRESSES = {
  // 核心合约地址 (Monad Testnet)
  TRADER_AGENT: "0x7267749E1Fa24Cae44e1B76Ec90F3B2f98D2C290",
  ROUTER_DEFENSE: "0x458Ec2Bc6E645ccd8f98599D6E4d942ea480ca16",
  CROSSCHAIN_ROUTER: "0x22A8C0BD01f88D3461c98E9bc3399A83dDBB9Cee",
  AI_STRATEGY_OPTIMIZER: "0xc6aF426FC11BFb6d46ffaB9A57c30ab5437AA09C",
  QUANTGUARD_PRO: "0xb10a0b0f6282024D5c3b5256CB312D06177cF4ab",
  
  // 外部合约
  UNISWAP_ROUTER: "0x4c4eABd5Fb1D1A7234A48692551eAECFF8194CA7",
  WETH: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
} as const

export const SUPPORTED_TOKENS = [
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
    decimals: 18,
    logoUrl: "/ethereum-logo.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin", 
    address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    decimals: 6,
    logoUrl: "/usdc-logo.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0xA3dbBD3887228aE84f08bE839f9e20485759a004",
    decimals: 18,
    logoUrl: "/dai-logo.png",
  },
] as const
