// Mock Web3 utilities for demonstration
// In a real application, this would contain actual Web3.js or Ethers.js integration

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export class Web3Service {
  private static instance: Web3Service;
  private walletAddress: string | null = null;

  private constructor() {}

  static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  async connectWallet(walletType: 'metamask' | 'walletconnect' | 'coinbase'): Promise<WalletInfo> {
    // Mock wallet connection
    const mockAddress = this.generateMockAddress();
    this.walletAddress = mockAddress;

    return {
      address: mockAddress,
      balance: (Math.random() * 10).toFixed(4),
      chainId: 1, // Ethereum mainnet
    };
  }

  async disconnectWallet(): Promise<void> {
    this.walletAddress = null;
  }

  async mintNFT(metadata: NFTMetadata): Promise<string> {
    // Mock NFT minting
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    // Simulate transaction hash
    const txHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    return txHash;
  }

  async getWalletBalance(address: string): Promise<string> {
    // Mock balance retrieval
    return (Math.random() * 10).toFixed(4);
  }

  async estimateGasFees(): Promise<{ slow: string; standard: string; fast: string }> {
    // Mock gas fee estimation
    return {
      slow: (Math.random() * 20 + 10).toFixed(0),
      standard: (Math.random() * 30 + 20).toFixed(0),
      fast: (Math.random() * 50 + 40).toFixed(0),
    };
  }

  isWalletConnected(): boolean {
    return this.walletAddress !== null;
  }

  getConnectedAddress(): string | null {
    return this.walletAddress;
  }

  private generateMockAddress(): string {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 40; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const web3Service = Web3Service.getInstance();
