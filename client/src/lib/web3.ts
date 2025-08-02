import { ethers, BrowserProvider, Contract, JsonRpcProvider, Wallet } from 'ethers';
import { SENTIMENT_NFT_ABI } from './contract-abi';

// Types for the new Crypto Beasts system
export interface CryptoBeastTraits {
  character: 'Bull' | 'Bear';
  mood: 'Aggressive' | 'Cautious' | 'Optimistic' | 'Contemplative' | 'Resilient';
  background: 'Golden Peak' | 'Shadowfen' | 'Crystal Caverns' | 'Ethereal Plains' | 'Storm Ridge';
  aura: 'Fire' | 'Ice' | 'Lightning' | 'Earth' | 'Void';
  expression: 'Determined' | 'Alert' | 'Focused' | 'Confident' | 'Watchful';
  accessory: 'Crown' | 'Ring' | 'Amulet' | 'Armor' | 'Cloak';
  weather: 'Clear' | 'Storm' | 'Mist' | 'Aurora' | 'Eclipse';
}

export enum Sentiment {
  VeryBearish = 0,
  Bearish = 1,  
  Neutral = 2,
  Bullish = 3,
  VeryBullish = 4
}

export enum MarketPhase {
  Reversal = 0,
  Consolidation = 1,
  Trend = 2, 
  Volatile = 3,
  Stable = 4
}

export interface WalletInfo {
  address: string;
  balance: string;
  chainId?: number;
}

export interface MintResult {
  success: boolean;
  transactionHash?: string;
  tokenId?: string;
  error?: string;
}

export interface UpdateSentimentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class Web3Service {
  private provider: any = null;
  private contract: Contract | null = null;
  private oracleContract: Contract | null = null;
  private currentWallet: WalletInfo | null = null;
  private contractAddress?: string;
  private useMockMode: boolean = true;
  private network: number = 1;

  // New properties for oracle functionality
  private oracleProvider: JsonRpcProvider | null = null;
  private oracleSigner: Wallet | null = null;

  constructor(contractAddress?: string) {
    this.contractAddress = contractAddress;
    this.useMockMode = !contractAddress;
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = (window as any).ethereum;
      this.useMockMode = false;
      console.log("🔗 Web3 browser provider detected. Frontend will use live blockchain interaction.");
    } else {
      console.log("🚫 No Web3 browser provider detected. Frontend will use mock mode by default.");
    }
    
    if (contractAddress && this.provider) {
      this.initializeContract();
    }
  }

  private async initializeContract() {
    if (!this.provider || !this.contractAddress) return;
    
    try {
      const browserProvider = new BrowserProvider(this.provider);
      this.contract = new Contract(this.contractAddress, SENTIMENT_NFT_ABI, browserProvider);
      console.log("✅ Smart contract initialized for frontend interaction.");
    } catch (error) {
      console.error("❌ Failed to initialize smart contract:", error);
      this.useMockMode = true;
    }
  }

  public async initForOracle(privateKey: string, rpcUrl: string, contractAddress: string): Promise<void> {
    this.contractAddress = contractAddress; // Ensure contractAddress is set for oracle operations
    try {
      this.oracleProvider = new JsonRpcProvider(rpcUrl);
      this.oracleSigner = new Wallet(privateKey, this.oracleProvider);
      this.network = parseInt((await this.oracleProvider.getNetwork()).chainId.toString(), 16)
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

  async connectWallet(): Promise<WalletInfo> {
    if (this.useMockMode || !this.provider) {
      const mockWallet = {
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        balance: (Math.random() * 10).toFixed(4),
        chainId: 1
      };
      this.currentWallet = mockWallet;
      console.log("🎭 Mock wallet connected:", mockWallet.address);
      return mockWallet;
    }

    try {
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      const browserProvider = new BrowserProvider(this.provider);
      const balance = await browserProvider.getBalance(accounts[0]);
      
      const walletInfo = {
        address: accounts[0],
        balance: ethers.formatEther(balance),
        chainId: parseInt((await browserProvider.getNetwork()).chainId.toString(), 16)
        // how to convert chainId to number?
      };
      
      this.currentWallet = walletInfo;
      console.log("✅ Real wallet connected:", walletInfo.address);
      console.log(this.network, " ", walletInfo.chainId)
      if (this.network !== walletInfo.chainId) {
        console.warn(`⚠️ Network mismatch: Expected ${this.getNetworkName(this.network)}, but connected to ${this.getNetworkName(walletInfo.chainId)}.`);
      }
      return walletInfo;
    } catch (error: any) {
      console.error("❌ Failed to connect wallet:", error);
      throw new Error(error.message || "Failed to connect wallet");
    }
  }

  async disconnectWallet(): Promise<void> {
    this.currentWallet = null;
    console.log("👋 Wallet disconnected");
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

  
  async mintNFT(name: string, sentiment: number, price: number): Promise<MintResult> {
    if (this.useMockMode) {
      return this.mintMockNFT(name, sentiment, price);
    } else {
      return this.mintRealNFT(name, sentiment, price);
    }
  }

  private async mintMockNFT(name: string, sentiment: number, price: number): Promise<MintResult> {
    console.log(`🎭 [Mock Mode] Simulating NFT mint: ${name}, sentiment: ${sentiment}, price: ${price} ETH`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        tokenId: Math.floor(Math.random() * 10000).toString()
      };
      
      console.log("✅ [Mock Mode] NFT minted successfully:", mockResult);
      return mockResult;
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
      const contractWithSigner = new Contract(this.contractAddress, SENTIMENT_NFT_ABI, signer);

      const mintPrice = await contractWithSigner.getCurrentMintPrice();

      const tokenURI = `data:application/json;base64,${this.btoaUnicode(JSON.stringify({
        name: name,
        description: `A dynamic Crypto Beast NFT that evolves with market sentiment. Current sentiment: ${(sentiment * 100).toFixed(1)}%`,
        attributes: [
          { trait_type: "Sentiment", value: (sentiment * 100).toFixed(1), max_value: 100 },
          { trait_type: "Rarity", value: this.getRarityFromSentiment(sentiment) },
          { trait_type: "Mint Price", value: `${price.toFixed(4)} ETH` }
        ],
        image: `data:image/svg+xml;base64,${this.btoaUnicode(this.generateCryptoBeastSVG(sentiment))}`
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

  private generateCryptoBeastSVG(sentiment: number): string {
    // Convert sentiment to our enum system
    const sentimentEnum = this.getSentimentEnum(sentiment);
    const marketPhase = this.getMarketPhase(sentiment);
    
    // Generate sophisticated traits
    const traits = this.generateTraits(sentiment);
    
    // Photorealistic color palette with micro-variations
    const colors = this.getPhotorealisticColors(traits.character, sentimentEnum, sentiment);
    
    // Precise scaling with anatomical proportions
    const anatomy = this.getAnatomicalDetails(sentimentEnum, sentiment);
    
    // Complex atmospheric rendering
    const atmosphere = this.getRealisticAtmosphere(traits.weather, marketPhase, sentimentEnum, sentiment);
    
    return `
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
        <defs>
          ${this.generatePhotorealisticGradients(colors, sentimentEnum, sentiment)}
          ${this.generateAdvancedFilters(atmosphere, sentimentEnum, sentiment)}
          ${this.generateTexturePatterns(traits, sentimentEnum, sentiment)}
          ${this.generateLightingEffects(colors, atmosphere, sentiment)}
        </defs>
        
        <!-- Environmental Foundation -->
        ${this.renderRealisticEnvironment(traits.background, colors, atmosphere, sentiment)}
        
        <!-- Dynamic Weather System -->
        ${this.renderAdvancedWeather(traits.weather, sentimentEnum, marketPhase, sentiment)}
        
        <!-- Creature Anatomy -->
        <g transform="translate(200, 300) scale(${anatomy.scale})">
          ${this.renderPhotorealisticCreature(traits.character, colors, anatomy, sentimentEnum, sentiment)}
          
          <!-- Detailed Musculature -->
          ${this.renderMuscleDefinition(traits.character, colors, anatomy, sentimentEnum, sentiment)}
          
          <!-- Facial Expression Details -->
          ${this.renderDetailedExpression(traits.expression, colors, anatomy, sentimentEnum, sentiment)}
          
          <!-- Skin/Fur Texture -->
          ${this.renderSkinTexture(traits.character, colors, anatomy, sentimentEnum, sentiment)}
          
          <!-- Eye Detail System -->
          ${this.renderRealisticEyes(traits.character, colors, anatomy, sentimentEnum, sentiment)}
          
          <!-- Sophisticated Aura -->
          ${this.renderEnergyField(traits.aura, colors, anatomy, sentimentEnum, marketPhase, sentiment)}
          
          <!-- Premium Accessories -->
          ${this.renderLuxuryAccessory(traits.accessory, colors, anatomy, sentimentEnum, sentiment)}
        </g>
        
        <!-- Market Micro-indicators -->
        ${this.renderMarketMicroSignals(marketPhase, sentimentEnum, sentiment)}
        
        <!-- Environmental Particles -->
        ${this.renderAtmosphericParticles(atmosphere, sentimentEnum, sentiment)}
        
        <!-- Signature & Metadata -->
        ${this.renderCreatureSignature(traits, colors, sentimentEnum, sentiment)}
      </svg>
    `;
  }

  private getSentimentEnum(sentiment: number): Sentiment {
    if (sentiment <= 0.2) return Sentiment.VeryBearish;
    if (sentiment <= 0.4) return Sentiment.Bearish;
    if (sentiment <= 0.6) return Sentiment.Neutral;
    if (sentiment <= 0.8) return Sentiment.Bullish;
    return Sentiment.VeryBullish;
  }

  private getMarketPhase(sentiment: number): MarketPhase {
    const random = Math.random();
    if (random < 0.2) return MarketPhase.Reversal;
    if (random < 0.4) return MarketPhase.Consolidation;
    if (random < 0.6) return MarketPhase.Trend;
    if (random < 0.8) return MarketPhase.Volatile;
    return MarketPhase.Stable;
  }

  private generateTraits(sentiment: number): CryptoBeastTraits {
    const characters: CryptoBeastTraits['character'][] = ['Bull', 'Bear'];
    const moods: CryptoBeastTraits['mood'][] = ['Aggressive', 'Cautious', 'Optimistic', 'Contemplative', 'Resilient'];
    const backgrounds: CryptoBeastTraits['background'][] = ['Golden Peak', 'Shadowfen', 'Crystal Caverns', 'Ethereal Plains', 'Storm Ridge'];
    const auras: CryptoBeastTraits['aura'][] = ['Fire', 'Ice', 'Lightning', 'Earth', 'Void'];
    const expressions: CryptoBeastTraits['expression'][] = ['Determined', 'Alert', 'Focused', 'Confident', 'Watchful'];
    const accessories: CryptoBeastTraits['accessory'][] = ['Crown', 'Ring', 'Amulet', 'Armor', 'Cloak'];
    const weathers: CryptoBeastTraits['weather'][] = ['Clear', 'Storm', 'Mist', 'Aurora', 'Eclipse'];

    return {
      character: sentiment > 0.5 ? 'Bull' : 'Bear',
      mood: moods[Math.floor(Math.random() * moods.length)],
      background: backgrounds[Math.floor(Math.random() * backgrounds.length)],
      aura: auras[Math.floor(Math.random() * auras.length)],
      expression: expressions[Math.floor(Math.random() * expressions.length)],
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      weather: weathers[Math.floor(Math.random() * weathers.length)]
    };
  }

  private getPhotorealisticColors(character: string, sentiment: Sentiment, sentimentValue: number): any {
    // Micro-variations based on exact sentiment value
    const intensity = sentimentValue;
    const volatility = Math.abs(sentimentValue - 0.5) * 2; // 0 to 1 scale
    
    if (character === 'Bull') {
      return {
        // Skin tones with realistic variation
        skinBase: this.interpolateColor('#D4A574', '#E6C399', intensity),
        skinShadow: this.interpolateColor('#B8956A', '#C9A876', intensity),
        skinHighlight: this.interpolateColor('#F2D4A7', '#FFE8C7', intensity),
        
        // Muscle definition
        muscleLight: this.interpolateColor('#E8C7A0', '#FFD9B3', intensity),
        muscleDark: this.interpolateColor('#A08060', '#B89070', intensity),
        
        // Eye details
        eyeIris: sentiment >= Sentiment.Bullish ? '#2E7D32' : '#4A5D23',
        eyePupil: '#000000',
        eyeReflection: '#FFFFFF',
        eyeBloodshot: volatility > 0.7 ? '#FF6B6B' : 'transparent',
        
        // Horn material
        hornBase: this.interpolateColor('#3E2723', '#5D4037', intensity),
        hornTip: sentiment >= Sentiment.VeryBullish ? '#FFD700' : '#8D6E63',
        hornShine: '#FFFFFF',
        
        // Environmental reflection
        ambientLight: this.interpolateColor('#FFF8E1', '#FFFDE7', intensity),
        shadowColor: this.interpolateColor('#8D6E63', '#A1887F', intensity),
        
        // Aura energy
        auraCore: sentiment >= Sentiment.Bullish ? '#4CAF50' : '#689F38',
        auraEdge: sentiment >= Sentiment.VeryBullish ? '#81C784' : '#AED581',
        
        text: '#2E2E2E',
        accent: sentiment >= Sentiment.Bullish ? '#388E3C' : '#558B2F'
      };
    } else {
      return {
        // Bear fur tones
        furBase: this.interpolateColor('#3E2723', '#1B0000', 1 - intensity),
        furShadow: this.interpolateColor('#2E1A0A', '#0D0000', 1 - intensity),
        furHighlight: this.interpolateColor('#5D4037', '#3E2723', 1 - intensity),
        
        // Muscle definition
        muscleLight: this.interpolateColor('#4E342E', '#3E2723', 1 - intensity),
        muscleDark: this.interpolateColor('#2E1A0A', '#1B0000', 1 - intensity),
        
        // Eye details
        eyeIris: sentiment <= Sentiment.Bearish ? '#B71C1C' : '#8D6E63',
        eyePupil: '#000000',
        eyeReflection: '#FFFFFF',
        eyeBloodshot: volatility > 0.7 ? '#FF8A80' : 'transparent',
        
        // Claw material
        clawBase: this.interpolateColor('#212121', '#000000', 1 - intensity),
        clawTip: sentiment <= Sentiment.VeryBearish ? '#FF1744' : '#424242',
        clawShine: '#666666',
        
        // Environmental reflection
        ambientLight: this.interpolateColor('#ECEFF1', '#CFD8DC', 1 - intensity),
        shadowColor: this.interpolateColor('#37474F', '#263238', 1 - intensity),
        
        // Aura energy
        auraCore: sentiment <= Sentiment.Bearish ? '#D32F2F' : '#7B1FA2',
        auraEdge: sentiment <= Sentiment.VeryBearish ? '#F44336' : '#9C27B0',
        
        text: '#FFFFFF',
        accent: sentiment <= Sentiment.Bearish ? '#C62828' : '#8E24AA'
      };
    }
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    // Convert hex to RGB
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private getAnatomicalDetails(sentiment: Sentiment, sentimentValue: number): any {
    const muscleTension = Math.abs(sentimentValue - 0.5) * 2; // Tension increases with extreme sentiment
    const postureConfidence = sentimentValue; // 0 = hunched, 1 = proud
    
    return {
      scale: 0.8 + (sentimentValue * 0.6), // 0.8 to 1.4 range
      muscleBulk: 0.5 + (muscleTension * 0.5), // More defined muscles in extreme markets
      postureAngle: -15 + (postureConfidence * 30), // -15° to +15° spine angle
      shoulderWidth: 0.9 + (postureConfidence * 0.2), // Broader shoulders when confident
      chestExpansion: 0.8 + (postureConfidence * 0.4), // Expanded chest in bullish sentiment
      jawClench: muscleTension, // Jaw tension reflects market stress
      browFurrow: Math.max(0, (0.5 - sentimentValue) * 2), // Furrowed brow in bearish markets
      eyeIntensity: muscleTension, // Eye intensity reflects market volatility
      nostrilFlare: muscleTension * 0.3, // Subtle nostril flare under stress
      breathingRate: 0.5 + (muscleTension * 1.5) // Faster breathing in volatile markets
    };
  }

  private getRealisticAtmosphere(weather: string, phase: MarketPhase, sentiment: Sentiment, sentimentValue: number): any {
    const volatility = phase === MarketPhase.Volatile ? 2.0 : phase === MarketPhase.Stable ? 0.3 : 1.0;
    const pressure = sentimentValue; // Atmospheric pressure metaphor
    
    return {
      // Light scattering
      lightScatter: 0.1 + (volatility * 0.4),
      lightAngle: 45 + (sentimentValue * 90), // Sun angle from low to high
      shadowDepth: 0.3 + ((1 - sentimentValue) * 0.7), // Deeper shadows in bearish
      
      // Particle systems
      dustDensity: volatility * 0.8,
      moistureLevel: weather === 'Storm' ? 0.9 : weather === 'Mist' ? 0.7 : 0.2,
      windStrength: volatility * 0.6,
      
      // Color temperature
      colorTemp: 3000 + (sentimentValue * 3000), // 3000K (warm) to 6000K (cool)
      saturation: 0.4 + (sentimentValue * 0.6), // More saturated in bullish
      
      // Environmental pressure
      airDensity: 0.5 + (pressure * 0.5),
      electricCharge: volatility > 1.5 ? 0.8 : 0.1, // Electric feel during volatility
      
      // Animation parameters
      breathingCycle: 2 + (volatility * 2), // Environment "breathing"
      particleSpeed: volatility * 2,
      waveAmplitude: volatility * 3
    };
  }

  private generatePhotorealisticGradients(colors: any, sentiment: Sentiment, sentimentValue: number): string {
    return `
      <!-- Skin/Fur base gradients -->
      <radialGradient id="skinGradient" cx="40%" cy="30%" r="80%">
        <stop offset="0%" stop-color="${colors.skinHighlight || colors.furHighlight}" stop-opacity="1"/>
        <stop offset="50%" stop-color="${colors.skinBase || colors.furBase}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${colors.skinShadow || colors.furShadow}" stop-opacity="1"/>
      </radialGradient>
      
      <!-- Ambient lighting -->
      <radialGradient id="ambientLight" cx="50%" cy="20%" r="120%">
        <stop offset="0%" stop-color="${colors.ambientLight}" stop-opacity="${0.3 + sentimentValue * 0.4}"/>
        <stop offset="100%" stop-color="${colors.shadowColor}" stop-opacity="${0.6 - sentimentValue * 0.3}"/>
      </radialGradient>
      
      <!-- Muscle definition -->
      <linearGradient id="muscleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors.muscleLight}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${colors.muscleDark}" stop-opacity="0.9"/>
      </linearGradient>
      
      <!-- Aura energy field -->
      <radialGradient id="energyField" cx="50%" cy="50%" r="150%">
        <stop offset="0%" stop-color="${colors.auraCore}" stop-opacity="0.6"/>
        <stop offset="70%" stop-color="${colors.auraEdge}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${colors.auraEdge}" stop-opacity="0"/>
      </radialGradient>
    `;
  }

  private generateAdvancedFilters(atmosphere: any, sentiment: Sentiment, sentimentValue: number): string {
    return `
      <!-- Realistic lighting and shadows -->
      <filter id="realisticGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="${2 + sentimentValue * 6}" result="softGlow"/>
        <feColorMatrix type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0  
          0 0 1 0 0
          0 0 0 ${0.4 + sentimentValue * 0.4} 0" result="glowColor"/>
        <feMerge>
          <feMergeNode in="glowColor"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Atmospheric scattering -->
      <filter id="atmosphericScatter">
        <feTurbulence baseFrequency="${atmosphere.lightScatter}" numOctaves="4" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${atmosphere.lightScatter * 3}"/>
        <feGaussianBlur stdDeviation="0.8" result="scattered"/>
        <feBlend mode="overlay" in="scattered" in2="SourceGraphic"/>
      </filter>
      
      <!-- Skin/fur texture detail -->
      <filter id="textureDetail" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence baseFrequency="0.8" numOctaves="5" result="texture"/>
        <feColorMatrix in="texture" type="saturate" values="0"/>
        <feComponentTransfer result="contrastTexture">
          <feFuncA type="discrete" tableValues="0 .5 .5 .7 .7 .8 .9 1"/>
        </feComponentTransfer>
        <feComposite in="SourceGraphic" in2="contrastTexture" operator="multiply"/>
      </filter>
      
      <!-- Muscle definition enhancement -->
      <filter id="muscleDefinition">
        <feGaussianBlur stdDeviation="1" result="blur"/>
        <feSpecularLighting result="specOut" in="blur" specularConstant="1.5" specularExponent="20" lighting-color="white">
          <fePointLight x="-50" y="-50" z="200"/>
        </feSpecularLighting>
        <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut2"/>
        <feComposite in="SourceGraphic" in2="specOut2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
      </filter>
    `;
  }

  private generateTexturePatterns(traits: CryptoBeastTraits, sentiment: Sentiment, sentimentValue: number): string {
    const textureIntensity = 0.3 + (sentimentValue * 0.4);
    
    return `
      <!-- Realistic fur/skin texture -->
      <pattern id="skinTexture" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,${textureIntensity * 0.2})" opacity="0.6"/>
        <circle cx="6" cy="2" r="0.3" fill="rgba(255,255,255,${textureIntensity * 0.15})" opacity="0.4"/>
        <circle cx="4" cy="6" r="0.4" fill="rgba(255,255,255,${textureIntensity * 0.18})" opacity="0.5"/>
        <path d="M1,1 Q2,2 1,3" stroke="rgba(0,0,0,${textureIntensity * 0.1})" stroke-width="0.2" fill="none"/>
      </pattern>
      
      <!-- Detailed muscle striations -->
      <pattern id="muscleTexture" width="12" height="4" patternUnits="userSpaceOnUse">
        <path d="M0,2 Q6,1 12,2" stroke="rgba(255,255,255,${textureIntensity * 0.3})" stroke-width="0.5" fill="none"/>
        <path d="M0,2 Q6,3 12,2" stroke="rgba(0,0,0,${textureIntensity * 0.2})" stroke-width="0.3" fill="none"/>
      </pattern>
      
      <!-- Environmental particle system -->
      <pattern id="atmosphericParticles" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="0.8" fill="rgba(255,255,255,${textureIntensity * 0.4})" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.6;0.1" dur="${3 + sentimentValue * 2}s" repeatCount="indefinite"/>
        </circle>
        <circle cx="30" cy="15" r="0.5" fill="rgba(255,255,255,${textureIntensity * 0.3})" opacity="0.2">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur="${4 + sentimentValue * 1.5}s" repeatCount="indefinite"/>
        </circle>
        <circle cx="20" cy="30" r="0.6" fill="rgba(255,255,255,${textureIntensity * 0.35})" opacity="0.25">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="${3.5 + sentimentValue * 1.8}s" repeatCount="indefinite"/>
        </circle>
      </pattern>
    `;
  }

  private generateLightingEffects(colors: any, atmosphere: any, sentimentValue: number): string {
    return `
      <!-- Directional lighting -->
      <filter id="directionalLight">
        <feSpecularLighting result="specOut" in="SourceGraphic" specularConstant="2" specularExponent="30" lighting-color="${colors.ambientLight}">
          <feDistantLight azimuth="${atmosphere.lightAngle}" elevation="${45 + sentimentValue * 20}"/>
        </feSpecularLighting>
        <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
      </filter>
      
      <!-- Rim lighting for definition -->
      <filter id="rimLight">
        <feMorphology operator="dilate" radius="1"/>
        <feGaussianBlur stdDeviation="2" result="glowBlur"/>
        <feFlood flood-color="${colors.ambientLight}" flood-opacity="${0.4 + sentimentValue * 0.3}"/>
        <feComposite in2="glowBlur" operator="in"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
  }

  private renderRealisticEnvironment(background: string, colors: any, atmosphere: any, sentimentValue: number): string {
    const environments = {
      'Golden Peak': `
        <!-- Mountain landscape with dynamic lighting -->
        <defs>
          <linearGradient id="peakGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${this.interpolateColor('#FFD700', '#FFEB3B', sentimentValue)}"/>
            <stop offset="30%" stop-color="${this.interpolateColor('#FF8F00', '#FFC107', sentimentValue)}"/>
            <stop offset="70%" stop-color="${this.interpolateColor('#E65100', '#FF9800', sentimentValue)}"/>
            <stop offset="100%" stop-color="${this.interpolateColor('#3E2723', '#5D4037', sentimentValue)}"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#peakGradient)"/>
        <!-- Mountain silhouettes -->
        <polygon points="0,300 150,150 300,200 400,180 400,400 0,400" fill="rgba(0,0,0,${0.2 + (1-sentimentValue) * 0.3})" opacity="0.6"/>
        <polygon points="50,350 200,200 350,250 400,230 400,400 0,400" fill="rgba(0,0,0,${0.1 + (1-sentimentValue) * 0.2})" opacity="0.4"/>
      `,
      
      'Shadowfen': `
        <!-- Dark swamp environment -->
        <defs>
          <radialGradient id="shadowGradient" cx="50%" cy="80%" r="120%">
            <stop offset="0%" stop-color="${this.interpolateColor('#1A237E', '#000051', 1-sentimentValue)}"/>
            <stop offset="50%" stop-color="${this.interpolateColor('#0D47A1', '#001970', 1-sentimentValue)}"/>
            <stop offset="100%" stop-color="${this.interpolateColor('#000000', '#121212', 1-sentimentValue)}"/>
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill="url(#shadowGradient)"/>
        <!-- Twisted trees -->
        <path d="M100,400 Q95,350 90,300 Q85,250 100,200" stroke="rgba(76,175,80,${0.3 + sentimentValue * 0.4})" stroke-width="8" fill="none"/>
        <path d="M300,400 Q310,360 320,320 Q315,280 300,240" stroke="rgba(76,175,80,${0.3 + sentimentValue * 0.4})" stroke-width="6" fill="none"/>
      `,
      
      'Crystal Caverns': `
        <!-- Crystalline cave system -->
        <defs>
          <radialGradient id="crystalGradient" cx="30%" cy="20%" r="100%">
            <stop offset="0%" stop-color="${this.interpolateColor('#E1F5FE', '#B3E5FC', sentimentValue)}"/>
            <stop offset="50%" stop-color="${this.interpolateColor('#0277BD', '#0288D1', sentimentValue)}"/>
            <stop offset="100%" stop-color="${this.interpolateColor('#01579B', '#0277BD', sentimentValue)}"/>
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill="url(#crystalGradient)"/>
        <!-- Crystal formations -->
        <polygon points="50,350 70,280 90,350" fill="rgba(255,255,255,${0.4 + sentimentValue * 0.4})" opacity="0.7"/>
        <polygon points="300,320 330,250 360,320" fill="rgba(255,255,255,${0.4 + sentimentValue * 0.4})" opacity="0.6"/>
        <polygon points="150,380 180,300 210,380" fill="rgba(255,255,255,${0.4 + sentimentValue * 0.4})" opacity="0.8"/>
      `,
      
      'Ethereal Plains': `
        <!-- Mystical grasslands -->
        <defs>
          <linearGradient id="plainsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${this.interpolateColor('#E8F5E8', '#F1F8E9', sentimentValue)}"/>
            <stop offset="60%" stop-color="${this.interpolateColor('#81C784', '#AED581', sentimentValue)}"/>
            <stop offset="100%" stop-color="${this.interpolateColor('#2E7D32', '#388E3C', sentimentValue)}"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#plainsGradient)"/>
        <!-- Grass texture -->
        <rect width="400" height="400" fill="url(#atmosphericParticles)" opacity="0.3"/>
      `,
      
      'Storm Ridge': `
        <!-- Stormy mountaintop -->
        <defs>
          <radialGradient id="stormGradient" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stop-color="${this.interpolateColor('#37474F', '#263238', 1-sentimentValue)}"/>
            <stop offset="70%" stop-color="${this.interpolateColor('#263238', '#000000', 1-sentimentValue)}"/>
            <stop offset="100%" stop-color="${this.interpolateColor('#000000', '#000000', 1-sentimentValue)}"/>
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill="url(#stormGradient)"/>
        <!-- Lightning flashes -->
        <path d="M50,50 L80,120 L60,120 L90,200" stroke="rgba(255,255,255,${0.6 + sentimentValue * 0.4})" stroke-width="3" fill="none" opacity="0.8">
          <animate attributeName="opacity" values="0;1;0" dur="0.1s" repeatCount="indefinite"/>
        </path>
      `
    };

    return environments[background as keyof typeof environments] || environments['Ethereal Plains'];
  }

  private renderAdvancedWeather(weather: string, sentiment: Sentiment, phase: MarketPhase, sentimentValue: number): string {
    const volatility = phase === MarketPhase.Volatile ? 2.0 : phase === MarketPhase.Stable ? 0.3 : 1.0;
    
    const weatherEffects = {
      'Storm': `
        <!-- Realistic storm clouds -->
        <ellipse cx="150" cy="80" rx="80" ry="40" fill="rgba(55,71,79,${0.6 + volatility * 0.3})" opacity="0.8"/>
        <ellipse cx="280" cy="60" rx="70" ry="35" fill="rgba(55,71,79,${0.5 + volatility * 0.4})" opacity="0.7"/>
        <!-- Rain particles -->
        <g opacity="${0.4 + volatility * 0.4}">
          <line x1="100" y1="120" x2="95" y2="160" stroke="rgba(255,255,255,0.6)" stroke-width="1">
            <animate attributeName="y1" values="120;400" dur="${1/volatility}s" repeatCount="indefinite"/>
            <animate attributeName="y2" values="160;440" dur="${1/volatility}s" repeatCount="indefinite"/>
          </line>
          <line x1="200" y1="100" x2="190" y2="140" stroke="rgba(255,255,255,0.5)" stroke-width="1">
            <animate attributeName="y1" values="100;400" dur="${1.2/volatility}s" repeatCount="indefinite"/>
            <animate attributeName="y2" values="140;440" dur="${1.2/volatility}s" repeatCount="indefinite"/>
          </line>
        </g>
      `,
      
      'Aurora': `
        <!-- Realistic aurora borealis -->
        <path d="M 0,${100 - sentimentValue * 30} Q 100,${80 - sentimentValue * 20} 200,${100 - sentimentValue * 30} T 400,${100 - sentimentValue * 30}" 
              stroke="${sentiment >= Sentiment.Bullish ? '#4CAF50' : '#F44336'}" 
              stroke-width="${2 + sentimentValue * 3}" 
              fill="none" 
              opacity="${0.5 + sentimentValue * 0.4}"
              filter="url(#realisticGlow)">
          <animate attributeName="d" 
                   values="M 0,${100 - sentimentValue * 30} Q 100,${80 - sentimentValue * 20} 200,${100 - sentimentValue * 30} T 400,${100 - sentimentValue * 30};
                           M 0,${110 - sentimentValue * 30} Q 100,${90 - sentimentValue * 20} 200,${110 - sentimentValue * 30} T 400,${110 - sentimentValue * 30};
                           M 0,${100 - sentimentValue * 30} Q 100,${80 - sentimentValue * 20} 200,${100 - sentimentValue * 30} T 400,${100 - sentimentValue * 30}" 
                   dur="${4 + sentimentValue * 2}s" 
                   repeatCount="indefinite"/>
        </path>
      `,
      
      'Mist': `
        <!-- Realistic mist effects -->
        <rect width="400" height="400" fill="rgba(255,255,255,${0.1 + (1-sentimentValue) * 0.2})" filter="url(#atmosphericScatter)"/>
        <ellipse cx="200" cy="300" rx="150" ry="50" fill="rgba(255,255,255,${0.2 + (1-sentimentValue) * 0.3})" opacity="0.4">
          <animate attributeName="rx" values="150;180;150" dur="${6 + sentimentValue * 2}s" repeatCount="indefinite"/>
        </ellipse>
      `,
      
      'Eclipse': `
        <!-- Solar eclipse with corona -->
        <circle cx="300" cy="100" r="45" fill="rgba(0,0,0,0.9)"/>
        <circle cx="300" cy="100" r="50" fill="none" stroke="rgba(255,255,255,${0.4 + sentimentValue * 0.4})" stroke-width="2" opacity="0.6"/>
        <circle cx="300" cy="100" r="60" fill="none" stroke="rgba(255,255,255,${0.2 + sentimentValue * 0.3})" stroke-width="1" opacity="0.4"/>
      `,
      
      'Clear': `
        <!-- Clear sky with subtle atmosphere -->
        <rect width="400" height="400" fill="url(#atmosphericParticles)" opacity="${0.1 + sentimentValue * 0.2}"/>
      `
    };

    return weatherEffects[weather as keyof typeof weatherEffects] || weatherEffects['Clear'];
  }

  private renderPhotorealisticCreature(character: string, colors: any, anatomy: any, sentiment: Sentiment, sentimentValue: number): string {
    if (character === 'Bull') {
      return `
        <!-- Bull torso with realistic proportions -->
        <ellipse cx="0" cy="0" rx="${70 * anatomy.shoulderWidth}" ry="${50 * anatomy.chestExpansion}" 
                 fill="url(#skinGradient)" 
                 filter="url(#textureDetail)"
                 transform="rotate(${anatomy.postureAngle})"/>
        
        <!-- Bull head with detailed anatomy -->
        <ellipse cx="0" cy="-60" rx="${40 * (1 + anatomy.jawClench * 0.2)}" ry="${35 * (1 + anatomy.jawClench * 0.1)}" 
                 fill="url(#skinGradient)" 
                 filter="url(#directionalLight)"/>
        
        <!-- Realistic bull horns with material properties -->
        <path d="M -25,-85 Q -30,-105 -20,-110" 
              stroke="${colors.hornBase}" 
              stroke-width="${10 + sentimentValue * 4}" 
              stroke-linecap="round"
              filter="url(#rimLight)"/>
        <path d="M 25,-85 Q 30,-105 20,-110" 
              stroke="${colors.hornBase}" 
              stroke-width="${10 + sentimentValue * 4}" 
              stroke-linecap="round"
              filter="url(#rimLight)"/>
        <!-- Horn tips with metallic shine -->
        <circle cx="-20" cy="-110" r="3" fill="${colors.hornTip}" opacity="${0.8 + sentimentValue * 0.2}"/>
        <circle cx="20" cy="-110" r="3" fill="${colors.hornTip}" opacity="${0.8 + sentimentValue * 0.2}"/>
        
        <!-- Nostrils with dynamic flare -->
        <ellipse cx="-8" cy="-45" rx="${2 + anatomy.nostrilFlare * 3}" ry="${3 + anatomy.nostrilFlare * 2}" fill="${colors.skinShadow}"/>
        <ellipse cx="8" cy="-45" rx="${2 + anatomy.nostrilFlare * 3}" ry="${3 + anatomy.nostrilFlare * 2}" fill="${colors.skinShadow}"/>
      `;
    } else {
      return `
        <!-- Bear torso with muscular definition -->
        <ellipse cx="0" cy="0" rx="${65 * anatomy.shoulderWidth}" ry="${55 * anatomy.chestExpansion}" 
                 fill="url(#skinGradient)" 
                 filter="url(#textureDetail)"
                 transform="rotate(${anatomy.postureAngle})"/>
        
        <!-- Bear head with fierce proportions -->
        <ellipse cx="0" cy="-50" rx="${35 * (1 + anatomy.jawClench * 0.3)}" ry="${30 * (1 + anatomy.jawClench * 0.2)}" 
                 fill="url(#skinGradient)" 
                 filter="url(#directionalLight)"/>
        
        <!-- Realistic bear ears -->
        <ellipse cx="-22" cy="-75" rx="8" ry="12" fill="${colors.furBase}" filter="url(#textureDetail)"/>
        <ellipse cx="22" cy="-75" rx="8" ry="12" fill="${colors.furBase}" filter="url(#textureDetail)"/>
        <ellipse cx="-22" cy="-75" rx="4" ry="6" fill="${colors.furShadow}"/>
        <ellipse cx="22" cy="-75" rx="4" ry="6" fill="${colors.furShadow}"/>
        
        <!-- Powerful bear claws -->
        <path d="M -50,35 L ${-45 - anatomy.muscleBulk * 5},${65 + anatomy.muscleBulk * 10}" 
              stroke="${colors.clawBase}" 
              stroke-width="${4 + (1-sentimentValue) * 6}" 
              stroke-linecap="round"
              filter="url(#rimLight)"/>
        <path d="M 50,35 L ${45 + anatomy.muscleBulk * 5},${65 + anatomy.muscleBulk * 10}" 
              stroke="${colors.clawBase}" 
              stroke-width="${4 + (1-sentimentValue) * 6}" 
              stroke-linecap="round"
              filter="url(#rimLight)"/>
        
        <!-- Snout detail -->
        <ellipse cx="0" cy="-35" rx="12" ry="8" fill="${colors.furShadow}"/>
      `;
    }
  }

  private renderMuscleDefinition(character: string, colors: any, anatomy: any, sentiment: Sentiment, sentimentValue: number): string {
    const muscleTension = anatomy.muscleBulk;
    
    return `
      <!-- Shoulder muscles -->
      <ellipse cx="-35" cy="-20" rx="${15 + muscleTension * 8}" ry="${10 + muscleTension * 5}" 
               fill="url(#muscleGradient)" 
               opacity="${0.6 + muscleTension * 0.3}"
               filter="url(#muscleDefinition)"/>
      <ellipse cx="35" cy="-20" rx="${15 + muscleTension * 8}" ry="${10 + muscleTension * 5}" 
               fill="url(#muscleGradient)" 
               opacity="${0.6 + muscleTension * 0.3}"
               filter="url(#muscleDefinition)"/>
      
      <!-- Chest muscles -->
      <ellipse cx="0" cy="-10" rx="${25 + muscleTension * 10}" ry="${12 + muscleTension * 6}" 
               fill="url(#muscleGradient)" 
               opacity="${0.5 + muscleTension * 0.4}"
               filter="url(#muscleDefinition)"/>
      
      <!-- Arm muscles -->
      <ellipse cx="-45" cy="10" rx="${12 + muscleTension * 6}" ry="${20 + muscleTension * 8}" 
               fill="url(#muscleGradient)" 
               opacity="${0.4 + muscleTension * 0.3}"
               filter="url(#muscleDefinition)"/>
      <ellipse cx="45" cy="10" rx="${12 + muscleTension * 6}" ry="${20 + muscleTension * 8}" 
               fill="url(#muscleGradient)" 
               opacity="${0.4 + muscleTension * 0.3}"
               filter="url(#muscleDefinition)"/>
      
      <!-- Muscle texture overlay -->
      <rect x="-70" y="-40" width="140" height="100" 
            fill="url(#muscleTexture)" 
            opacity="${0.2 + muscleTension * 0.3}"/>
    `;
  }

  private renderDetailedExpression(expression: string, colors: any, anatomy: any, sentiment: Sentiment, sentimentValue: number): string {
    const expressionIntensity = anatomy.eyeIntensity;
    const browTension = anatomy.browFurrow;
    
    return `
      <!-- Detailed brow area -->
      <path d="M -20,-65 Q -10,${-70 - browTension * 8} 0,-65 Q 10,${-70 - browTension * 8} 20,-65" 
            stroke="${colors.skinShadow || colors.furShadow}" 
            stroke-width="${2 + browTension * 3}" 
            fill="none"/>
      
      <!-- Expression wrinkles -->
      <path d="M -15,-60 Q -8,${-58 - browTension * 4} 0,-60" 
            stroke="${colors.skinShadow || colors.furShadow}" 
            stroke-width="1" 
            opacity="${0.3 + browTension * 0.4}" 
            fill="none"/>
      <path d="M 0,-60 Q 8,${-58 - browTension * 4} 15,-60" 
            stroke="${colors.skinShadow || colors.furShadow}" 
            stroke-width="1" 
            opacity="${0.3 + browTension * 0.4}" 
            fill="none"/>
    `;
  }

  private renderSkinTexture(character: string, colors: any, anatomy: any, sentiment: Sentiment, sentimentValue: number): string {
    return `
      <!-- Base skin/fur texture -->
      <rect x="-80" y="-90" width="160" height="120" 
            fill="url(#skinTexture)" 
            opacity="${0.4 + sentimentValue * 0.3}"/>
      
      <!-- Breathing animation -->
      <rect x="-70" y="-20" width="140" height="60" 
            fill="url(#skinTexture)" 
            opacity="${0.2 + anatomy.breathingRate * 0.1}">
        <animate attributeName="opacity" 
                 values="${0.2 + anatomy.breathingRate * 0.1};${0.4 + anatomy.breathingRate * 0.2};${0.2 + anatomy.breathingRate * 0.1}" 
                 dur="${anatomy.breathingRate}s" 
                 repeatCount="indefinite"/>
      </rect>
    `;
  }

  private renderRealisticEyes(character: string, colors: any, anatomy: any, sentiment: Sentiment, sentimentValue: number): string {
    const eyeSize = 8 + anatomy.eyeIntensity * 4;
    const pupilSize = eyeSize * (0.3 + anatomy.eyeIntensity * 0.3);
    
    return `
      <!-- Left eye detailed structure -->
      <ellipse cx="-15" cy="-55" rx="${eyeSize}" ry="${eyeSize * 0.8}" 
               fill="white" 
               filter="url(#directionalLight)"/>
      <circle cx="-15" cy="-55" r="${eyeSize * 0.7}" 
              fill="${colors.eyeIris}" 
              opacity="0.9"/>
      <circle cx="-15" cy="-55" r="${pupilSize}" 
              fill="${colors.eyePupil}"/>
      <!-- Eye reflection -->
      <circle cx="${-15 + eyeSize * 0.3}" cy="${-55 - eyeSize * 0.3}" r="${eyeSize * 0.2}" 
              fill="${colors.eyeReflection}" 
              opacity="0.8"/>
      <!-- Bloodshot effect for high volatility -->
      <circle cx="-15" cy="-55" r="${eyeSize}" 
              fill="none" 
              stroke="${colors.eyeBloodshot}" 
              stroke-width="1" 
              opacity="0.6"/>
      
      <!-- Right eye detailed structure -->
      <ellipse cx="15" cy="-55" rx="${eyeSize}" ry="${eyeSize * 0.8}" 
               fill="white" 
               filter="url(#directionalLight)"/>
      <circle cx="15" cy="-55" r="${eyeSize * 0.7}" 
              fill="${colors.eyeIris}" 
              opacity="0.9"/>
      <circle cx="15" cy="-55" r="${pupilSize}" 
              fill="${colors.eyePupil}"/>
      <!-- Eye reflection -->
      <circle cx="${15 + eyeSize * 0.3}" cy="${-55 - eyeSize * 0.3}" r="${eyeSize * 0.2}" 
              fill="${colors.eyeReflection}" 
              opacity="0.8"/>
      <!-- Bloodshot effect for high volatility -->
      <circle cx="15" cy="-55" r="${eyeSize}" 
              fill="none" 
              stroke="${colors.eyeBloodshot}" 
              stroke-width="1" 
              opacity="0.6"/>
    `;
  }

  private renderEnergyField(aura: string, colors: any, anatomy: any, sentiment: Sentiment, phase: MarketPhase, sentimentValue: number): string {
    const volatility = phase === MarketPhase.Volatile ? 2.0 : phase === MarketPhase.Stable ? 0.3 : 1.0;
    const auraRadius = 80 + sentimentValue * 40;
    
    const auraEffects = {
      'Fire': `
        <!-- Fire aura with realistic flames -->
        <circle cx="0" cy="0" r="${auraRadius}" 
                fill="url(#energyField)" 
                opacity="${0.4 + sentimentValue * 0.4}"
                filter="url(#realisticGlow)">
          <animate attributeName="r" 
                   values="${auraRadius * 0.8};${auraRadius * 1.2};${auraRadius * 0.8}" 
                   dur="${2 / volatility}s" 
                   repeatCount="indefinite"/>
        </circle>
        <!-- Flame particles -->
        <circle cx="-30" cy="-40" r="3" fill="${colors.auraCore}" opacity="0.7">
          <animate attributeName="cy" values="-40;-80;-40" dur="${1.5 / volatility}s" repeatCount="indefinite"/>
        </circle>
        <circle cx="30" cy="-40" r="2" fill="${colors.auraEdge}" opacity="0.6">
          <animate attributeName="cy" values="-40;-75;-40" dur="${1.8 / volatility}s" repeatCount="indefinite"/>
        </circle>
      `,
      
      'Ice': `
        <!-- Ice aura with crystalline effects -->
        <circle cx="0" cy="0" r="${auraRadius}" 
                fill="url(#energyField)" 
                opacity="${0.5 + sentimentValue * 0.3}"
                filter="url(#atmosphericScatter)"/>
        <!-- Ice crystals -->
        <polygon points="-40,-60 -35,-70 -30,-60 -35,-50" 
                 fill="${colors.auraCore}" 
                 opacity="${0.6 + sentimentValue * 0.3}"/>
        <polygon points="40,-50 45,-60 50,-50 45,-40" 
                 fill="${colors.auraEdge}" 
                 opacity="${0.5 + sentimentValue * 0.4}"/>
      `,
      
      'Lightning': `
        <!-- Lightning aura with electric bolts -->
        <circle cx="0" cy="0" r="${auraRadius}" 
                fill="url(#energyField)" 
                opacity="${0.3 + sentimentValue * 0.5}"
                filter="url(#realisticGlow)"/>
        <!-- Electric bolts -->
        <path d="M -50,-30 L -30,-50 L -25,-40 L -10,-60" 
              stroke="${colors.auraCore}" 
              stroke-width="2" 
              fill="none" 
              opacity="${0.7 + volatility * 0.3}">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.2s" repeatCount="indefinite"/>
        </path>
        <path d="M 50,-20 L 30,-40 L 35,-30 L 15,-50" 
              stroke="${colors.auraEdge}" 
              stroke-width="1.5" 
              fill="none" 
              opacity="${0.6 + volatility * 0.4}">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="0.3s" repeatCount="indefinite"/>
        </path>
      `,
      
      'Earth': `
        <!-- Earth aura with organic patterns -->
        <circle cx="0" cy="0" r="${auraRadius}" 
                fill="url(#energyField)" 
                opacity="${0.4 + sentimentValue * 0.4}"
                filter="url(#textureDetail)"/>
        <!-- Organic growth patterns -->
        <path d="M -40,-20 Q -30,-40 -20,-20 Q -10,-40 0,-20" 
              stroke="${colors.auraCore}" 
              stroke-width="3" 
              fill="none" 
              opacity="${0.5 + sentimentValue * 0.3}"/>
      `,
      
      'Void': `
        <!-- Void aura with dark energy -->
        <circle cx="0" cy="0" r="${auraRadius}" 
                fill="url(#energyField)" 
                opacity="${0.6 + sentimentValue * 0.3}"
                filter="url(#realisticGlow)"/>
        <!-- Dark energy tendrils -->
        <path d="M 0,0 Q -50,-30 -80,-10" 
              stroke="${colors.auraCore}" 
              stroke-width="2" 
              fill="none" 
              opacity="${0.4 + volatility * 0.4}" 
              stroke-dasharray="5,5">
          <animate attributeName="stroke-dashoffset" values="0;10" dur="${3 / volatility}s" repeatCount="indefinite"/>
        </path>
      `
    };

    return auraEffects[aura as keyof typeof auraEffects] || auraEffects['Fire'];
  }

  private renderLuxuryAccessory(accessory: string, colors: any, anatomy: any, sentiment: Sentiment, sentimentValue: number): string {
    const brightness = sentimentValue;
    const metallic = `rgba(255,215,0,${0.7 + brightness * 0.3})`;
    
    const accessories = {
      'Crown': `
        <!-- Detailed crown with gems -->
        <path d="M -25,-90 L -15,-105 L 0,-95 L 15,-105 L 25,-90 L 20,-80 L -20,-80 Z" 
              fill="${metallic}" 
              filter="url(#directionalLight)"/>
        <!-- Crown gems -->
        <circle cx="-15" cy="-95" r="2" fill="${colors.auraCore}" opacity="${0.8 + brightness * 0.2}"/>
        <circle cx="0" cy="-100" r="3" fill="${colors.auraEdge}" opacity="${0.9 + brightness * 0.1}"/>
        <circle cx="15" cy="-95" r="2" fill="${colors.auraCore}" opacity="${0.8 + brightness * 0.2}"/>
      `,
      
      'Ring': `
        <!-- Luxury ring on finger -->
        <ellipse cx="0" cy="20" rx="12" ry="3" 
                 fill="${metallic}" 
                 filter="url(#rimLight)"/>
        <circle cx="0" cy="20" r="4" 
                fill="${colors.auraCore}" 
                opacity="${0.8 + brightness * 0.2}"/>
      `,
      
      'Amulet': `
        <!-- Mystical amulet -->
        <polygon points="0,-30 10,-20 5,-10 -5,-10 -10,-20" 
                 fill="${metallic}" 
                 filter="url(#directionalLight)"/>
        <circle cx="0" cy="-20" r="3" 
                fill="${colors.auraCore}" 
                opacity="${0.7 + brightness * 0.3}">
          <animate attributeName="opacity" 
                   values="${0.7 + brightness * 0.3};${0.9 + brightness * 0.1};${0.7 + brightness * 0.3}" 
                   dur="${3 + brightness * 2}s" 
                   repeatCount="indefinite"/>
        </circle>
      `,
      
      'Armor': `
        <!-- Battle armor plates -->
        <rect x="-50" y="-15" width="100" height="50" 
              fill="${metallic}" 
              opacity="${0.7 + brightness * 0.3}" 
              rx="5" 
              filter="url(#muscleDefinition)"/>
        <!-- Armor details -->
        <rect x="-45" y="-10" width="90" height="5" 
              fill="${colors.auraCore}" 
              opacity="${0.5 + brightness * 0.4}"/>
        <rect x="-45" y="5" width="90" height="5" 
              fill="${colors.auraCore}" 
              opacity="${0.5 + brightness * 0.4}"/>
      `,
      
      'Cloak': `
        <!-- Flowing cloak -->
        <path d="M -60,-40 Q -40,-30 -50,80 Q 0,90 50,80 Q 40,-30 60,-40 Q 30,-35 0,-30 Q -30,-35 -60,-40 Z" 
              fill="${colors.auraCore}" 
              opacity="${0.4 + brightness * 0.3}" 
              filter="url(#atmosphericScatter)">
          <animate attributeName="d" 
                   values="M -60,-40 Q -40,-30 -50,80 Q 0,90 50,80 Q 40,-30 60,-40 Q 30,-35 0,-30 Q -30,-35 -60,-40 Z;
                           M -65,-40 Q -45,-32 -55,85 Q 0,95 55,85 Q 45,-32 65,-40 Q 35,-37 0,-32 Q -35,-37 -65,-40 Z;
                           M -60,-40 Q -40,-30 -50,80 Q 0,90 50,80 Q 40,-30 60,-40 Q 30,-35 0,-30 Q -30,-35 -60,-40 Z" 
                   dur="${4 + brightness * 2}s" 
                   repeatCount="indefinite"/>
        </path>
      `
    };

    return accessories[accessory as keyof typeof accessories] || '';
  }

  private renderMarketMicroSignals(phase: MarketPhase, sentiment: Sentiment, sentimentValue: number): string {
    const signals = {
      [MarketPhase.Volatile]: `
        <!-- Volatile market indicators -->
        <rect x="10" y="10" width="30" height="3" 
              fill="${sentimentValue > 0.5 ? '#4CAF50' : '#F44336'}" 
              opacity="0.8">
          <animate attributeName="width" values="30;50;30" dur="0.5s" repeatCount="indefinite"/>
        </rect>
        <text x="15" y="25" font-family="monospace" font-size="8" fill="white">VOLATILE</text>
      `,
      
      [MarketPhase.Stable]: `
        <!-- Stable market indicators -->
        <rect x="10" y="10" width="30" height="3" 
              fill="#2196F3" 
              opacity="0.6"/>
        <text x="15" y="25" font-family="monospace" font-size="8" fill="white">STABLE</text>
      `,
      
      [MarketPhase.Trend]: `
        <!-- Trending market indicators -->
        <path d="M 10,20 L 40,${sentimentValue > 0.5 ? 10 : 30}" 
              stroke="${sentimentValue > 0.5 ? '#4CAF50' : '#F44336'}" 
              stroke-width="3" 
              opacity="0.7"/>
        <text x="15" y="35" font-family="monospace" font-size="8" fill="white">TREND</text>
      `,
      
      [MarketPhase.Reversal]: `
        <!-- Reversal market indicators -->
        <circle cx="25" cy="20" r="8" 
                fill="none" 
                stroke="#FF9800" 
                stroke-width="2" 
                opacity="0.8" 
                stroke-dasharray="4,4">
          <animate attributeName="stroke-dashoffset" values="0;8" dur="1s" repeatCount="indefinite"/>
        </circle>
        <text x="15" y="40" font-family="monospace" font-size="8" fill="white">REVERSAL</text>
      `,
      
      [MarketPhase.Consolidation]: `
        <!-- Consolidation market indicators -->
        <rect x="10" y="15" width="30" height="10" 
              fill="none" 
              stroke="#9C27B0" 
              stroke-width="2" 
              opacity="0.6"/>
        <text x="12" y="35" font-family="monospace" font-size="8" fill="white">CONSOLIDATION</text>
      `
    };

    return signals[phase] || '';
  }

  private renderAtmosphericParticles(atmosphere: any, sentiment: Sentiment, sentimentValue: number): string {
    return `
      <!-- Environmental particle system -->
      <rect width="400" height="400" 
            fill="url(#atmosphericParticles)" 
            opacity="${0.3 + atmosphere.dustDensity * 0.4}"/>
    `;
  }

  private renderCreatureSignature(traits: CryptoBeastTraits, colors: any, sentiment: Sentiment, sentimentValue: number): string {
    return `
      <!-- Creature identification -->
      <text x="20" y="370" 
            fill="${colors.text}" 
            font-family="serif" 
            font-size="12" 
            font-weight="bold">
        ${traits.character} • ${this.getSentimentLabel(sentiment)}
      </text>
      <text x="20" y="385" 
            fill="${colors.accent}" 
            font-family="monospace" 
            font-size="10">
        ${traits.mood} • ${traits.aura} Aura • ${traits.background}
      </text>
      <text x="380" y="385" 
            text-anchor="end" 
            fill="${colors.accent}" 
            font-family="monospace" 
            font-size="9">
        Market: ${(sentimentValue * 100).toFixed(1)}% • ${new Date().toISOString().split('T')[0]}
      </text>
    `;
  }

  // Legacy aura method - replaced by renderEnergyField
  private renderAura(aura: string, colors: any, sentiment: Sentiment, phase: MarketPhase): string {
    // This method is deprecated and replaced by renderEnergyField for photorealistic rendering
    return this.renderEnergyField(aura, colors, { muscleBulk: 0.5 }, sentiment, phase, sentiment * 0.25);
  }

  private renderExpression(expression: string, colors: any, sentiment: Sentiment): string {
    // This would contain detailed facial expression rendering
    return `<!-- Expression: ${expression} -->`;
  }

  private renderAccessory(accessory: string, colors: any, sentiment: Sentiment): string {
    const brightness = sentiment >= Sentiment.Bullish ? 1.3 : sentiment <= Sentiment.Bearish ? 0.7 : 1.0;
    
    const accessories = {
      'Crown': `<path d="M -20,-60 L 0,-75 L 20,-60 L 15,-50 L -15,-50 Z" fill="${colors.accent}" filter="url(#glow)" opacity="${brightness}"/>`,
      'Ring': `<circle cx="0" cy="10" r="8" fill="none" stroke="${colors.accent}" stroke-width="3" opacity="${brightness}"/>`,
      'Amulet': `<polygon points="0,-40 8,-30 0,-20 -8,-30" fill="${colors.accent}" opacity="${brightness}"/>`,
      'Armor': `<rect x="-40" y="0" width="80" height="40" fill="${colors.secondary}" opacity="${brightness * 0.8}" rx="5"/>`,
      'Cloak': `<path d="M -50,-30 Q 0,-35 50,-30 L 45,60 L -45,60 Z" fill="${colors.secondary}" opacity="${brightness * 0.6}"/>`
    };

    return accessories[accessory as keyof typeof accessories] || '';
  }

  private renderMarketPhaseOverlay(phase: MarketPhase, sentiment: Sentiment): string {
    const overlays = {
      [MarketPhase.Volatile]: `<rect width="400" height="400" fill="none" stroke="#FF0000" stroke-width="2" stroke-dasharray="10,5" opacity="0.3">
        <animate attributeName="stroke-dashoffset" values="0;15" dur="0.5s" repeatCount="indefinite"/>
      </rect>`,
      [MarketPhase.Stable]: `<rect width="400" height="400" fill="rgba(0,255,0,0.05)"/>`,
      [MarketPhase.Trend]: `<path d="M 0,400 L 400,0" stroke="rgba(255,255,0,0.3)" stroke-width="3"/>`,
      [MarketPhase.Reversal]: `<circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,165,0,0.3)" stroke-width="2" stroke-dasharray="20,10"/>`,
      [MarketPhase.Consolidation]: `<rect width="400" height="400" fill="rgba(128,128,128,0.1)"/>`
    };

    return overlays[phase] || '';
  }

  private getSentimentLabel(sentiment: Sentiment): string {
    const labels = {
      [Sentiment.VeryBearish]: 'Very Bearish',
      [Sentiment.Bearish]: 'Bearish', 
      [Sentiment.Neutral]: 'Neutral',
      [Sentiment.Bullish]: 'Bullish',
      [Sentiment.VeryBullish]: 'Very Bullish'
    };
    return labels[sentiment];
  }

  // Public method to generate preview SVG for frontend components
  public generatePreviewSVG(sentiment: number): string {
    return this.generateCryptoBeastSVG(sentiment);
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
    if (this.useMockMode || !this.provider) {
      return (Math.random() * 10).toFixed(4);
    }

    const providerToUse = this.provider ? new BrowserProvider(this.provider) : null;
    if (!providerToUse) {
      console.error("No provider available for getting wallet balance");
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

  getContractAddress(): string | undefined {
    return this.contractAddress;
  }

  btoaUnicode(str: string): string {
    // Use TextEncoder to encode the string to UTF-8 bytes.
    const utf8Bytes = new TextEncoder().encode(str);

    // Convert the byte array back to a string where each character
    // represents a single byte.
    const utf8String = String.fromCharCode.apply(null, Array.from(utf8Bytes));

    // Now, btoa can safely encode this byte-string.
    return btoa(utf8String);
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
}

// Export a configured instance for the frontend
export const web3Service = new Web3Service(typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_CONTRACT_ADDRESS : undefined);

// Legacy exports for compatibility
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export class Web3ServiceLegacy {
  private static instance: Web3ServiceLegacy;
  private walletAddress: string | null = null;
  private internalWeb3Service: Web3Service;

  private constructor() {
    this.internalWeb3Service = new Web3Service(); 
  }

  static getInstance(): Web3ServiceLegacy {
    if (!Web3ServiceLegacy.instance) {
      Web3ServiceLegacy.instance = new Web3ServiceLegacy();
    }
    return Web3ServiceLegacy.instance;
  }

  async connectWallet(walletType: 'metamask' | 'walletconnect' | 'coinbase'): Promise<WalletInfo> {
    const wallet = await this.internalWeb3Service.connectWallet();
    this.walletAddress = wallet.address;
    
    return {
      address: wallet.address,
      balance: wallet.balance,
      chainId: 1,
    };
  }

  async disconnectWallet(): Promise<void> {
    await this.internalWeb3Service.disconnectWallet();
    this.walletAddress = null;
  }

  async mintNFT(metadata: NFTMetadata): Promise<string> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    const result = await this.internalWeb3Service.mintNFT(metadata.name, 0.5, 0.1);
    if (!result.success) {
      throw new Error(result.error || 'Minting failed');
    }
    
    return result.transactionHash || '';
  }

  async getWalletBalance(address: string): Promise<string> {
    return await this.internalWeb3Service.getWalletBalance(address);
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