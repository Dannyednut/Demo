import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertNftSchema, insertSentimentDataSchema } from "@shared/schema";
import { z } from "zod";
// Import the realSentimentService
import { realSentimentService } from '@/lib/real-sentiment';
import { Web3Service } from '@/lib/web3'; // Import web3Service




export async function registerRoutes(app: Express): Promise<Server> {
  const web3Service = new Web3Service(process.env.VITE_CONTRACT_ADDRESS);
  const httpServer = createServer(app);

  // API Routes
  
  // Get market overview data
  app.get("/api/market/overview", async (req, res) => {
    try {
      const latestSentiment = await storage.getLatestSentimentData();
      res.json(latestSentiment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market overview" });
    }
  });

  // Get sentiment history
  app.get("/api/sentiment/history", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const history = await storage.getSentimentDataHistory(hours);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sentiment history" });
    }
  });

  // Get recent market activity
  app.get("/api/market/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market activity" });
    }
  });

  // Get top collections
  app.get("/api/collections/top", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const collections = await storage.getTopCollections(limit);
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top collections" });
    }
  });

  // Mint NFT
  app.post("/api/nft/mint", async (req, res) => {
    try {
      const validatedData = insertNftSchema.parse(req.body);
      const nft = await storage.createNft({
        ...validatedData,
        attributes: validatedData.attributes || {},
      });
      res.json(nft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid NFT data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to mint NFT" });
      }
    }
  });

  // Get NFT by ID
  app.get("/api/nft/:id", async (req, res) => {
    try {
      const nft = await storage.getNft(req.params.id);
      if (!nft) {
        res.status(404).json({ error: "NFT not found" });
        return;
      }
      res.json(nft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NFT" });
    }
  });

  // --- NEW: Initialize Web3Service for Oracle at startup ---
  // Ensure these environment variables are set in your .env.local file
  // e.g., ORACLE_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
  //       RPC_URL="YOUR_ETHEREUM_RPC_URL_HERE" (e.g., from Infura, Alchemy, or a local node)
  //       CONTRACT_ADDRESS="0xYourDeployedContractAddressHere" (for backend)
  if (process.env.ORACLE_PRIVATE_KEY && process.env.RPC_URL && process.env.VITE_CONTRACT_ADDRESS) {
    web3Service.initForOracle(
      process.env.ORACLE_PRIVATE_KEY,
      process.env.RPC_URL,
      process.env.VITE_CONTRACT_ADDRESS // Pass CONTRACT_ADDRESS from Node.js env
    )
      .then(() => console.log("Web3Service successfully initialized for oracle operations."))
      .catch(error => console.error("Failed to initialize Web3Service for oracle:", error));
  } else {
    console.warn("ORACLE_PRIVATE_KEY, RPC_URL, or CONTRACT_ADDRESS not set. Oracle sentiment updates will not function.");
  }
  // --- END NEW ---

  // WebSocket for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    // Send initial data
    storage.getLatestSentimentData().then(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'sentiment_update', data }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Real-time data updates with optional real sentiment
  setInterval(async () => {
    let sentiment: number;
    let btcPrice: number;
    let ethPrice: number;
    let solPrice: number;

    // Use real sentiment if enabled
    if (process.env.USE_REAL_SENTIMENT === 'true') {
      try {
        // Fetch real sentiment data and prices from the realSentimentService
        const realData = await realSentimentService.getRealWorldSentiment();
        sentiment = realData.overall;
        btcPrice = realData.btcPrice;
        ethPrice = realData.ethPrice;
        solPrice = realData.solPrice;
      } catch (error) {
        console.warn('Failed to fetch real sentiment from realSentimentService, falling back to simulation:', error);
        // Fallback to simulation if real sentiment service fails
        const baseValue = 0.6 + (Math.sin(Date.now() / 10000) * 0.2);
        const noise = (Math.random() - 0.5) * 0.1;
        sentiment = Math.max(0, Math.min(1, baseValue + noise));
        btcPrice = 43247 + (Math.random() - 0.5) * 1000;
        ethPrice = 2543 + (Math.random() - 0.5) * 100;
        solPrice = 100 + (Math.random() - 0.5) * 10; // Simulated Solana price
      }
    } else {
      // Use simulated data (default)
      const baseValue = 0.6 + (Math.sin(Date.now() / 10000) * 0.2);
      const noise = (Math.random() - 0.5) * 0.1;
      sentiment = Math.max(0, Math.min(1, baseValue + noise));
      btcPrice = 43247 + (Math.random() - 0.5) * 1000;
      ethPrice = 2543 + (Math.random() - 0.5) * 100;
      solPrice = 100 + (Math.random() - 0.5) * 10; // Simulated Solana price
    }

    // Create sentiment data to store and broadcast
    const sentimentData = await storage.createSentimentData({
      marketSentiment: sentiment,
      btcPrice: Math.round(btcPrice),
      ethPrice: Math.round(ethPrice),
      solPrice: Math.round(solPrice),
      // These values are still simulated as real-sentiment.ts doesn't provide them
      volume24h: 342.8 + (Math.random() - 0.5) * 50,
      activeTraders: 8429 + Math.floor((Math.random() - 0.5) * 1000),
      nftsMinted: 1247 + Math.floor(Math.random() * 100),
    });

    // Broadcast to all connected WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'sentiment_update',
          data: sentimentData
        }));
      }
    });
  }, 30000); // Update every 30 seconds

  return httpServer;
}
