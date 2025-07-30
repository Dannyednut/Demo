import { SENTIMENT_NFT_ABI, DEPLOYMENT_CONFIG, RARITY_TIERS } from './contract-abi'; // Removed CONTRACT_ADDRESS import
import { ethers, BrowserProvider, JsonRpcProvider, Wallet, Contract, Signer } from 'ethers';

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

interface UpdateSentimentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

// Demo wallet addresses for simulation
const DEMO_WALLETS = [
  "0x742d35Cc4Bf86C1A3e2a9b2D8c8b8f5B8A1B2C3D",
  "0x8f3B5a1D2e4F6c8A9b2C5d7E1F9a6B8c4D7e2F5G",
  "0x5a7B2c9D1e6F8a3B4c7D9e2F5a8B1c4D6e9F2a5H"
];

export class Web3Service {
  private currentWallet: ConnectedWallet | null = null; // For user's connected wallet (frontend)
  private isConnecting = false;
  private provider: Web3Provider | null = null; // Browser provider (e.g., MetaMask window.ethereum)
  private contract: Contract | null = null; // Contract instance for general reads (could be with browser provider or oracle provider)
  private useMockMode: boolean;
  private contractAddress: string | undefined; // Stored contract address

  // New properties for oracle functionality
  private oracleProvider: JsonRpcProvider | null = null;
  private oracleSigner: Wallet | null = null;
  private oracleContract: Contract | null = null; // Contract instance connected with oracle signer

  // Constructor now accepts the contractAddress
  constructor(contractAddress?: string) {
    this.contractAddress = contractAddress; // Store the address
    // Use mock mode if no contract address is provided
    this.useMockMode = !this.contractAddress;
    // Initial browser provider setup (for frontend use)
    this.initializeBrowserProvider();
  }

  // Initializes provider for browser-based wallet interaction (e.g., MetaMask)
  private async initializeBrowserProvider() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = (window as any).ethereum;
      console.log("🦊 MetaMask detected for browser interaction.");
      
      if (this.provider && this.contractAddress) { // Check both provider and contractAddress
        try {
          this.contract = new Contract(this.contractAddress, SENTIMENT_NFT_ABI, new BrowserProvider(this.provider));
          console.log("📄 Browser-based smart contract initialized:", this.contractAddress);
          this.useMockMode = false;
        } catch (error) {
          console.warn("⚠️ Ethers.js BrowserProvider or Contract initialization failed, falling back to mock mode for browser interaction:", error);
          this.useMockMode = true;
        }
      } else {
        console.warn("🚫 window.ethereum detected but is null/undefined OR contract address not provided. Frontend will use mock mode.");
        this.useMockMode = true;
      }
    } else {
      console.log("🚫 No Web3 browser provider detected. Frontend will use mock mode by default.");
      // this.useMockMode will remain true if no oracle setup either
    }
  }

  /**
   * Initializes the Web3Service for backend oracle operations using a private key.
   * This should be called once at server startup.
   */
  public async initForOracle(privateKey: string, rpcUrl: string, contractAddress: string): Promise<void> {
    this.contractAddress = contractAddress; // Ensure contractAddress is set for oracle operations
    try {
      this.oracleProvider = new JsonRpcProvider(rpcUrl);
      this.oracleSigner = new Wallet(privateKey, this.oracleProvider);
      
      // Use the provided contractAddress for oracle contract
      this.oracleContract = new Contract(this.contractAddress, SENTIMENT_NFT_ABI, this.oracleSigner);
      
      console.log(`✨ Oracle Web3Service initialized for address: ${this.oracleSigner.address} on RPC: ${rpcUrl}`);
      this.useMockMode = false; // If oracle is initialized, we are not in mock mode
    } catch (error) {
      console.error("❌ Failed to initialize Web3Service for oracle:", error);
      this.useMockMode = true; // Fallback to mock mode if oracle setup fails
      throw new Error(`Oracle initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error("No Web3 provider available (e.g., MetaMask not detected)");
    }

    try {
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const address = accounts[0];
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      const balanceInEth = ethers.formatEther(balance);

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
      return { success: false, error: "No wallet connected. Please connect your wallet to mint." };
    }

    if (this.useMockMode) {
      return await this.mintMockNFT(name, sentiment, price);
    } else {
      return await this.mintRealNFT(name, sentiment, price);
    }
  }

  private async mintMockNFT(name: string, sentiment: number, price: number): Promise<MintResult> {
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const transactionHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      const tokenId = Math.floor(Math.random() * 10000).toString();
      return { success: true, transactionHash, tokenId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
  }

  private async mintRealNFT(name: string, sentiment: number, price: number): Promise<MintResult> {
    if (!this.contract || !this.provider || !this.currentWallet || !this.contractAddress) {
      return { success: false, error: "Smart contract, user wallet, or contract address not initialized for minting." };
    }

    try {
      const browserProvider = new BrowserProvider(this.provider);
      const signer = await browserProvider.getSigner();
      const contractWithSigner = new Contract(this.contractAddress, SENTIMENT_NFT_ABI, signer); // Re-instantiate with signer

      const mintPrice = await contractWithSigner.getCurrentMintPrice();

      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify({
        name: name,
        description: `A dynamic NFT that evolves with market sentiment. Current sentiment: ${(sentiment * 100).toFixed(1)}%`,
        attributes: [
          { trait_type: "Sentiment", value: (sentiment * 100).toFixed(1), max_value: 100 },
          { trait_type: "Rarity", value: this.getRarityFromSentiment(sentiment) },
          { trait_type: "Mint Price", value: `${price.toFixed(4)} ETH` }
        ],
        image: `data:image/svg+xml;base64,${btoa(this.generateNFTSVG(sentiment))}`
      }))}`;

      const attributes = JSON.stringify({
        sentiment: sentiment,
        mintPrice: price,
        rarity: this.getRarityFromSentiment(sentiment)
      });

      const tx = await contractWithSigner.mintNFT(
        this.currentWallet!.address,
        tokenURI,
        attributes,
        { value: mintPrice }
      );

      console.log("🔄 Transaction submitted:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.transactionHash);

      const event = receipt.events?.find((e: any) => e.event === 'NFTMinted');
      const tokenId = event?.args?.tokenId?.toString();

      return { success: true, transactionHash: receipt.transactionHash, tokenId };
    } catch (error: any) {
      console.error("❌ Minting failed:", error);
      let errorMessage = "Transaction failed";
      if (error.code === 4001) errorMessage = "Transaction rejected by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for transaction";
      else if (error.message) errorMessage = error.message;
      return { success: false, error: errorMessage };
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

  /**
   * @dev Calls the updateSentiment function on the smart contract using the oracle's private key.
   * This function is intended for backend use.
   * @param sentimentValue The new sentiment value (0.0 to 1.0) to set.
   * @returns A promise that resolves with the transaction hash or an error.
   */
  async updateSentiment(sentimentValue: number): Promise<UpdateSentimentResult> {
    if (this.useMockMode && !this.oracleContract) { 
      const scaledSentiment = Math.round(sentimentValue * 1000);
      console.log(`[Mock Mode] Simulating sentiment update to: ${sentimentValue} (${scaledSentiment})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, transactionHash: `0x${Math.random().toString(16).substring(2, 66)}` };
    } else if (!this.oracleContract) {
      return { success: false, error: "Oracle Web3Service not initialized with private key. Cannot update sentiment." };
    }

    const scaledSentiment = Math.round(sentimentValue * 1000);
    if (scaledSentiment < 0 || scaledSentiment > 1000) {
      return { success: false, error: "Sentiment value must be between 0 and 1." };
    }

    try {
      const tx = await this.oracleContract.updateSentiment(scaledSentiment);
      console.log("🔄 Oracle sentiment update transaction submitted:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Oracle sentiment update transaction confirmed:", receipt.transactionHash);
      return { success: true, transactionHash: receipt.transactionHash };
    } catch (error: any) {
      console.error("❌ Failed to update sentiment via oracle:", error);
      let errorMessage = "Failed to send oracle sentiment update transaction.";
      if (error.code === 4001) errorMessage = "Oracle transaction rejected (unlikely for automated oracle).";
      else if (error.message) errorMessage = error.message;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * @dev Fetches the current mint price directly from the smart contract.
   * @returns A promise that resolves with the mint price in ETH (as a string) or null if in mock mode/error.
   */
  async getContractMintPrice(): Promise<string | null> {
    const contractToUse = this.oracleContract || this.contract;

    if (this.useMockMode && !contractToUse) {
      const simulatedSentiment = 0.5 + (Math.random() - 0.5) * 0.2;
      const scaledSentiment = Math.round(simulatedSentiment * 1000);
      const basePrice = 0.01 + (scaledSentiment * 0.49 / 1000);
      const multiplier = 1 + (scaledSentiment * 2 / 1000);
      return (basePrice * multiplier).toFixed(4);
    }

    if (!contractToUse) {
      console.warn("No contract instance available to get mint price.");
      return null;
    }

    try {
      const mintPriceWei = await contractToUse.getCurrentMintPrice();
      return ethers.formatEther(mintPriceWei);
    } catch (error) {
      console.error("Failed to fetch contract mint price:", error);
      return null;
    }
  }

  async getContractData(): Promise<{
    currentSentiment: number;
    totalSupply: number;
    mintPrice: string;
  } | null> {
    const contractToUse = this.oracleContract || this.contract;

    if (this.useMockMode && !contractToUse) {
      return null;
    }

    if (!contractToUse) {
      console.warn("No contract instance available to get contract data.");
      return null;
    }

    try {
      const [currentSentiment, totalSupply, mintPrice] = await Promise.all([
        contractToUse.currentSentiment(),
        contractToUse.totalSupply(),
        contractToUse.getCurrentMintPrice()
      ]);

      return {
        currentSentiment: Number(currentSentiment) / 1000,
        totalSupply: Number(totalSupply),
        mintPrice: ethers.formatEther(mintPrice)
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

    const providerToUse = this.oracleProvider || (this.provider ? new BrowserProvider(this.provider) : null);

    if (!providerToUse) {
      return "0.0000";
    }

    try {
      const balance = await providerToUse.getBalance(address);
      return ethers.formatEther(balance);
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

  getContractAddress(): string | undefined { // Changed return type to string | undefined
    return this.contractAddress;
  }
}

// Export a *new* instance of Web3Service without a contract address initially
// This instance will be configured for frontend use later in dashboard.tsx
// and for backend oracle use in routes.ts.
//export const web3Service = new Web3Service(import.meta.env.VITE_CONTRACT_ADDRESS);

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
  // Hold an internal instance of the new Web3Service
  private internalWeb3Service: Web3Service;

  private constructor() {
    // This legacy service will need its own Web3Service instance.
    // Since it's for legacy browser interaction, it won't have a contract address at construction.
    this.internalWeb3Service = new Web3Service(); 
  }

  // private constructor() {}

  static getInstance(): Web3ServiceLegacy {
    if (!Web3ServiceLegacy.instance) {
      Web3ServiceLegacy.instance = new Web3ServiceLegacy();
    }
    return Web3ServiceLegacy.instance;
  }

  async connectWallet(walletType: 'metamask' | 'walletconnect' | 'coinbase'): Promise<WalletInfo> {
    const wallet = await this.internalWeb3Service.connectWallet();//await web3Service.connectWallet();
    this.walletAddress = wallet.address;
    
    return {
      address: wallet.address,
      balance: wallet.balance,
      chainId: 1,
    };
  }

  async disconnectWallet(): Promise<void> {
    await this.internalWeb3Service.disconnectWallet()//await web3Service.disconnectWallet();
    this.walletAddress = null;
  }

  async mintNFT(metadata: NFTMetadata): Promise<string> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    const result = await this.internalWeb3Service.mintNFT(metadata.name, 0.5, 0.1);//await web3Service.mintNFT(metadata.name, 0.5, 0.1);
    if (!result.success) {
      throw new Error(result.error || 'Minting failed');
    }
    
    return result.transactionHash || '';
  }

  async getWalletBalance(address: string): Promise<string> {
    return await this.internalWeb3Service.getWalletBalance(address);//await web3Service.getWalletBalance(address);
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
