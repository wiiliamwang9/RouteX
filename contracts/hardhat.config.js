require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MONAD_TESTNET_RPC_URL = process.env.MONAD_TESTNET_RPC_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    monad_testnet: {
      url: MONAD_TESTNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 10143,
      gasPrice: 100000000000, // 100 gwei - increased for Monad testnet
      gas: 8000000,
      timeout: 120000,
    },
  },
  etherscan: {
    apiKey: {
      monad_testnet: "dummy", // Monad testnet doesn't require API key
    },
    customChains: [
      {
        network: "monad_testnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.monadexplorer.com/api",
          browserURL: "https://testnet.monadexplorer.com/",
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  mocha: {
    timeout: 40000,
  },
};