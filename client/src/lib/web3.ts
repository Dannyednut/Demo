import { SENTIMENT_NFT_ABI, CONTRACT_ADDRESS, DEPLOYMENT_CONFIG, RARITY_TIERS } from './contract-abi';

// Web3 integration supporting both mock mode and real smart contracts
interface Web3Provider {
  request: (params: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
}

interface ConnectedWallet {
  address: string;
  balance: string;
  network: string;
}

interface MintResult {
  success: boolean;
  transactionHash?: string;
  tokenId?: string;
  error?: string;
}

// Demo wallet addresses for simulation
const DEMO_WALLETS = [
  "0x742d35Cc4Bf86C1A3e2a9b2D8c8b8f5B8A1B2C3D",
  "0x8f3B5a1D2e4F6c8A9b2C5d7E1F9a6B8c4D7e2F5G",
  "0x5a7B2c9D1e6F8a3B4c7D9e2F5a8B1c4D6e9F2a5H"
];

class Web3Service {
  private currentWallet: ConnectedWallet | null = null;
  private isConnecting = false;
  private provider: Web3Provider | null = null;
  private contract: any = null;
  private useMockMode: boolean;

  constructor() {
    // Use mock mode if no contract address is configured
    this.useMockMode = !CONTRACT_ADDRESS;
    this.initializeProvider();
  }

  private async initializeProvider() {
    if (this.useMockMode) {
      console.log("🎭 Running in mock mode - no real blockchain interaction");
      return;
    }

    // Check if MetaMask is available
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = (window as any).ethereum;
      console.log("🦊 MetaMask detected");
      
      // Initialize contract if we have ethers.js
      try {
        const { ethers, BrowserProvider, Contract } = await import('ethers');
        if (this.provider) {
          const provider = new BrowserProvider(this.provider);
          this.contract = new Contract(CONTRACT_ADDRESS, SENTIMENT_NFT_ABI, provider);
          console.log("📄 Smart contract initialized:", CONTRACT_ADDRESS);
        }
      } catch (error) {
        console.warn("⚠️ Ethers.js not available, falling back to mock mode");
        this.useMockMode = true;
      }
    } else {
      console.log("🚫 No Web3 provider detected, using mock mode");
      this.useMockMode = true;
    }
  }

  async connectWallet(): Promise<ConnectedWallet> {
    if (this.isConnecting) {
      throw new Error("Already connecting to wallet");
    }

    this.isConnecting = true;

    try {
      if (this.useMockMode) {
        return await this.connectMockWallet();
      } else {
        return await this.connectRealWallet();
      }
    } finally {
      this.isConnecting = false;
    }
  }

  private async connectMockWallet(): Promise<ConnectedWallet> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Randomly select a demo wallet
    const randomWallet = DEMO_WALLETS[Math.floor(Math.random() * DEMO_WALLETS.length)];
    
    this.currentWallet = {
      address: randomWallet,
      balance: (Math.random() * 10 + 1).toFixed(4), // Random balance between 1-11 ETH
      network: "Mock Network"
    };

    return this.currentWallet;
  }

  private async connectRealWallet(): Promise<ConnectedWallet> {
    if (!this.provider) {
      throw new Error("No Web3 provider available");
    }

    try {
      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const address = accounts[0];

      // Get balance
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      // Convert balance from wei to ETH
      const { formatEther } = await import('ethers');
      const balanceInEth = formatEther(balance);

      // Get network info
      const chainId = await this.provider.request({
        method: 'eth_chainId'
      });

      const networkName = this.getNetworkName(parseInt(chainId, 16));

      this.currentWallet = {
        address,
        balance: parseFloat(balanceInEth).toFixed(4),
        network: networkName
      };

      return this.currentWallet;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getNetworkName(chainId: number): string {
    const networks: { [key: number]: string } = {
      1: "Ethereum Mainnet",
      5: "Goerli Testnet",
      137: "Polygon Mainnet",
      80001: "Mumbai Testnet",
      1337: "Localhost"
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  }

  async disconnectWallet(): Promise<void> {
    this.currentWallet = null;
  }

  getCurrentWallet(): ConnectedWallet | null {
    return this.currentWallet;
  }

  async mintNFT(name: string, sentiment: number, price: number): Promise<MintResult> {
    if (!this.currentWallet) {
      return { success: false, error: "No wallet connected" };
    }

    if (this.useMockMode) {
      return await this.mintMockNFT(name, sentiment, price);
    } else {
      return await this.mintRealNFT(name, sentiment, price);
    }
  }

  private async mintMockNFT(name: string, sentiment: number, price: number): Promise<MintResult> {
    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate fake transaction hash
      const transactionHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      const tokenId = Math.floor(Math.random() * 10000).toString();

      return {
        success: true,
        transactionHash,
        tokenId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private async mintRealNFT(name: string, sentiment: number, price: number): Promise<MintResult> {
    if (!this.contract || !this.provider) {
      return { success: false, error: "Smart contract not initialized" };
    }

    try {
      const { BrowserProvider } = await import('ethers');
      const provider = new BrowserProvider(this.provider);
      const signer = await provider.getSigner();
      const contractWithSigner = this.contract.connect(signer);

      // Get current mint price from contract
      const mintPrice = await contractWithSigner.getCurrentMintPrice();

      // Create metadata
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify({
        name: name,
        description: `A dynamic NFT that evolves with market sentiment. Current sentiment: ${(sentiment * 100).toFixed(1)}%`,
        attributes: [
          {
            trait_type: "Sentiment",
            value: (sentiment * 100).toFixed(1),
            max_value: 100
          },
          {
            trait_type: "Rarity",
            value: this.getRarityFromSentiment(sentiment)
          },
          {
            trait_type: "Mint Price",
            value: `${price.toFixed(4)} ETH`
          }
        ],
        image: `data:image/svg+xml;base64,${btoa(this.generateNFTSVG(sentiment))}`
      }))}`;

      const attributes = JSON.stringify({
        sentiment: sentiment,
        mintPrice: price,
        rarity: this.getRarityFromSentiment(sentiment)
      });

      // Call smart contract mint function
      const tx = await contractWithSigner.mintNFT(
        this.currentWallet!.address,
        tokenURI,
        attributes,
        { value: mintPrice }
      );

      console.log("🔄 Transaction submitted:", tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.transactionHash);

      // Extract token ID from events
      const event = receipt.events?.find((e: any) => e.event === 'NFTMinted');
      const tokenId = event?.args?.tokenId?.toString();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        tokenId
      };
    } catch (error: any) {
      console.error("❌ Minting failed:", error);
      
      let errorMessage = "Transaction failed";
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private getRarityFromSentiment(sentiment: number): string {
    if (sentiment > 0.8) return "Legendary";
    if (sentiment > 0.6) return "Ultra Rare";
    if (sentiment > 0.4) return "Rare";
    return "Common";
  }

  private generateNFTSVG(sentiment: number): string {
    const hue = sentiment * 360;
    const saturation = 50 + (sentiment * 50);
    const brightness = 30 + (sentiment * 40);

    return `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sentimentGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="hsl(${hue}, ${saturation}%, ${brightness + 20}%)" />
            <stop offset="100%" stop-color="hsl(${hue}, ${saturation}%, ${brightness}%)" />
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill="url(#sentimentGradient)" />
        <circle cx="200" cy="200" r="${100 + sentiment * 50}" fill="none" stroke="white" stroke-width="2" opacity="0.8" />
        <text x="200" y="380" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">
          Sentiment: ${(sentiment * 100).toFixed(1)}%
        </text>
      </svg>
    `;
  }

  async getContractData(): Promise<{
    currentSentiment: number;
    totalSupply: number;
    mintPrice: string;
  } | null> {
    if (this.useMockMode || !this.contract) {
      return null;
    }

    try {
      const [currentSentiment, totalSupply, mintPrice] = await Promise.all([
        this.contract.currentSentiment(),
        this.contract.totalSupply(),
        this.contract.getCurrentMintPrice()
      ]);

      const { formatEther } = await import('ethers');
      
      return {
        currentSentiment: Number(currentSentiment) / 1000, // Convert from 0-1000 to 0-1
        totalSupply: Number(totalSupply),
        mintPrice: formatEther(mintPrice)
      };
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      return null;
    }
  }

  async getWalletBalance(address: string): Promise<string> {
    if (this.useMockMode) {
      return (Math.random() * 10 + 1).toFixed(4);
    }

    if (!this.provider) {
      return "0.0000";
    }

    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      const { formatEther } = await import('ethers');
      return formatEther(balance);
    } catch (error) {
      console.error("Failed to get wallet balance:", error);
      return "0.0000";
    }
  }

  isWalletConnected(): boolean {
    return this.currentWallet !== null;
  }

  isMockMode(): boolean {
    return this.useMockMode;
  }

  getContractAddress(): string {
    return CONTRACT_ADDRESS || "Not deployed";
  }
}

export const web3Service = new Web3Service();

// Legacy exports for compatibility
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

// Legacy singleton pattern for backward compatibility
export class Web3ServiceLegacy {
  private static instance: Web3ServiceLegacy;
  private walletAddress: string | null = null;

  private constructor() {}

  static getInstance(): Web3ServiceLegacy {
    if (!Web3ServiceLegacy.instance) {
      Web3ServiceLegacy.instance = new Web3ServiceLegacy();
    }
    return Web3ServiceLegacy.instance;
  }

  async connectWallet(walletType: 'metamask' | 'walletconnect' | 'coinbase'): Promise<WalletInfo> {
    const wallet = await web3Service.connectWallet();
    this.walletAddress = wallet.address;
    
    return {
      address: wallet.address,
      balance: wallet.balance,
      chainId: 1,
    };
  }

  async disconnectWallet(): Promise<void> {
    await web3Service.disconnectWallet();
    this.walletAddress = null;
  }

  async mintNFT(metadata: NFTMetadata): Promise<string> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    const result = await web3Service.mintNFT(metadata.name, 0.5, 0.1);
    if (!result.success) {
      throw new Error(result.error || 'Minting failed');
    }
    
    return result.transactionHash || '';
  }

  async getWalletBalance(address: string): Promise<string> {
    return await web3Service.getWalletBalance(address);
  }

  async estimateGasFees(): Promise<{ slow: string; standard: string; fast: string }> {
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
}