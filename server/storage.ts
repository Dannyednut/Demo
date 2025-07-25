import { 
  type User, 
  type InsertUser, 
  type Nft, 
  type InsertNft,
  type SentimentData,
  type InsertSentimentData,
  type MarketActivity,
  type InsertMarketActivity,
  type Collection,
  type InsertCollection
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // NFT methods
  getNft(id: string): Promise<Nft | undefined>;
  getNftsByOwner(ownerAddress: string): Promise<Nft[]>;
  createNft(nft: InsertNft): Promise<Nft>;
  updateNftSentiment(id: string, sentiment: number): Promise<void>;
  getAllNfts(): Promise<Nft[]>;
  
  // Sentiment data methods
  getLatestSentimentData(): Promise<SentimentData | undefined>;
  getSentimentDataHistory(hours: number): Promise<SentimentData[]>;
  createSentimentData(data: InsertSentimentData): Promise<SentimentData>;
  
  // Market activity methods
  getRecentActivity(limit: number): Promise<MarketActivity[]>;
  createMarketActivity(activity: InsertMarketActivity): Promise<MarketActivity>;
  
  // Collection methods
  getTopCollections(limit: number): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollectionVolume(id: string, volume: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private nfts: Map<string, Nft>;
  private sentimentData: SentimentData[];
  private marketActivity: MarketActivity[];
  private collections: Map<string, Collection>;

  constructor() {
    this.users = new Map();
    this.nfts = new Map();
    this.sentimentData = [];
    this.marketActivity = [];
    this.collections = new Map();
    
    // Initialize with some data
    this.initializeData();
  }

  private initializeData() {
    // Initialize collections
    const initialCollections = [
      { name: "SentimentNFT", volume: 1247, floorPrice: 0.05, totalItems: 10000 },
      { name: "Crypto Emotions", volume: 892, floorPrice: 0.03, totalItems: 5000 },
      { name: "Neural Arts", volume: 634, floorPrice: 0.08, totalItems: 2500 },
    ];
    
    initialCollections.forEach(collection => {
      const id = randomUUID();
      this.collections.set(id, { ...collection, id });
    });

    // Initialize sentiment data with realistic values
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const baseValue = 0.6 + (Math.sin(i * 0.5) * 0.2);
      const noise = (Math.random() - 0.5) * 0.1;
      const sentiment = Math.max(0, Math.min(1, baseValue + noise));
      
      this.sentimentData.push({
        id: randomUUID(),
        timestamp,
        marketSentiment: sentiment,
        btcPrice: 43247 + (Math.random() - 0.5) * 1000,
        ethPrice: 2543 + (Math.random() - 0.5) * 100,
        solPrice: 98.32 + (Math.random() - 0.5) * 10,
        volume24h: 342.8 + (Math.random() - 0.5) * 50,
        activeTraders: 8429 + Math.floor((Math.random() - 0.5) * 1000),
        nftsMinted: 1247 + Math.floor(Math.random() * 100),
      });
    }

    // Initialize recent activity
    const activities = [
      { action: "minted", nftName: "Cosmic Sentiment #1247", price: 0.05 },
      { action: "transferred", nftName: "Neural Dreams #892", price: 0.12 },
      { action: "listed", nftName: "Quantum Mood #445", price: 0.08 },
      { action: "sold", nftName: "Emotion Wave #723", price: 0.15 },
      { action: "bid_placed", nftName: "Sentiment Storm #156", price: 0.09 },
      { action: "minted", nftName: "Market Pulse #934", price: 0.06 },
    ];

    activities.forEach((activity, index) => {
      this.marketActivity.push({
        id: randomUUID(),
        ...activity,
        nftId: randomUUID(),
        fromAddress: "0x1234567890123456789012345678901234567890",
        toAddress: "0x0987654321098765432109876543210987654321",
        timestamp: new Date(now.getTime() - (index * 5 * 60 * 1000)), // 5 minutes apart
      });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      walletAddress: insertUser.walletAddress || null
    };
    this.users.set(id, user);
    return user;
  }

  async getNft(id: string): Promise<Nft | undefined> {
    return this.nfts.get(id);
  }

  async getNftsByOwner(ownerAddress: string): Promise<Nft[]> {
    return Array.from(this.nfts.values()).filter(
      nft => nft.ownerAddress === ownerAddress
    );
  }

  async createNft(insertNft: InsertNft): Promise<Nft> {
    const id = randomUUID();
    
    // Calculate mint price based on current market sentiment
    const latestSentiment = await this.getLatestSentimentData();
    const baseSentiment = latestSentiment?.marketSentiment || 0.5;
    
    // Dynamic pricing based on sentiment (0.01 to 0.5 ETH range)
    const sentimentMultiplier = 1 + (baseSentiment * 2); // 1x to 3x multiplier
    const basePrice = 0.01 + (baseSentiment * 0.49); // 0.01 to 0.5 ETH
    const finalPrice = Number((basePrice * sentimentMultiplier).toFixed(4));
    
    // Determine rarity tier based on sentiment
    let rarityTier = "common";
    if (baseSentiment > 0.8) rarityTier = "legendary";
    else if (baseSentiment > 0.6) rarityTier = "ultra_rare";
    else if (baseSentiment > 0.4) rarityTier = "rare";
    
    const nft: Nft = { 
      ...insertNft,
      id,
      mintPrice: finalPrice,
      currentSentiment: baseSentiment,
      rarityTier,
      description: insertNft.description || null,
      imageUrl: insertNft.imageUrl || null,
      attributes: insertNft.attributes || {},
      createdAt: new Date(),
    };
    this.nfts.set(id, nft);
    
    // Add to market activity
    await this.createMarketActivity({
      action: "minted",
      nftId: id,
      nftName: nft.name,
      price: finalPrice,
      toAddress: nft.ownerAddress,
      fromAddress: null,
    });
    
    return nft;
  }

  async updateNftSentiment(id: string, sentiment: number): Promise<void> {
    const nft = this.nfts.get(id);
    if (nft) {
      nft.currentSentiment = sentiment;
      this.nfts.set(id, nft);
    }
  }

  async getAllNfts(): Promise<Nft[]> {
    return Array.from(this.nfts.values());
  }

  async getLatestSentimentData(): Promise<SentimentData | undefined> {
    return this.sentimentData[this.sentimentData.length - 1];
  }

  async getSentimentDataHistory(hours: number): Promise<SentimentData[]> {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.sentimentData
      .filter(data => data.timestamp && data.timestamp >= cutoff)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async createSentimentData(insertData: InsertSentimentData): Promise<SentimentData> {
    const data: SentimentData = {
      ...insertData,
      id: randomUUID(),
      timestamp: new Date(),
      btcPrice: insertData.btcPrice || null,
      ethPrice: insertData.ethPrice || null,
      solPrice: insertData.solPrice || null,
      volume24h: insertData.volume24h || null,
      activeTraders: insertData.activeTraders || null,
      nftsMinted: insertData.nftsMinted || null,
    };
    this.sentimentData.push(data);
    return data;
  }

  async getRecentActivity(limit: number): Promise<MarketActivity[]> {
    return this.marketActivity
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createMarketActivity(insertActivity: InsertMarketActivity): Promise<MarketActivity> {
    const activity: MarketActivity = {
      ...insertActivity,
      id: randomUUID(),
      timestamp: new Date(),
      nftId: insertActivity.nftId || null,
      price: insertActivity.price || null,
      fromAddress: insertActivity.fromAddress || null,
      toAddress: insertActivity.toAddress || null,
    };
    this.marketActivity.unshift(activity);
    return activity;
  }

  async getTopCollections(limit: number): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = randomUUID();
    const collection: Collection = { 
      ...insertCollection, 
      id,
      volume: insertCollection.volume || 0,
      floorPrice: insertCollection.floorPrice || null,
      totalItems: insertCollection.totalItems || null
    };
    this.collections.set(id, collection);
    return collection;
  }

  async updateCollectionVolume(id: string, volume: number): Promise<void> {
    const collection = this.collections.get(id);
    if (collection) {
      collection.volume = volume;
      this.collections.set(id, collection);
    }
  }
}

export const storage = new MemStorage();
