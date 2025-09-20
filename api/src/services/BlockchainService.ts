import { ethers } from 'ethers';
import { logger } from '../utils/logger';

export class BlockchainService {
  private static instance: BlockchainService;
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  private constructor() {}

  public static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize Monad testnet provider
      if (process.env.MONAD_TESTNET_RPC_URL) {
        const monadProvider = new ethers.JsonRpcProvider(process.env.MONAD_TESTNET_RPC_URL);
        this.providers.set('monad-testnet', monadProvider);
        
        // Test connection
        await monadProvider.getNetwork();
        logger.info('Monad testnet provider initialized');
      }

      // Initialize other network providers as needed
      if (process.env.ETHEREUM_RPC_URL) {
        const ethProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        this.providers.set('ethereum', ethProvider);
        logger.info('Ethereum provider initialized');
      }

    } catch (error) {
      logger.error('Failed to initialize blockchain services:', error);
      throw error;
    }
  }

  public getProvider(network: string): ethers.JsonRpcProvider | undefined {
    return this.providers.get(network);
  }

  public async getBlockNumber(network = 'monad-testnet'): Promise<number> {
    const provider = this.getProvider(network);
    if (!provider) {
      throw new Error(`Provider for network ${network} not found`);
    }
    return await provider.getBlockNumber();
  }
}