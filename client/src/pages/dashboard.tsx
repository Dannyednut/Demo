import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SentimentChart } from "../components/ui/sentiment-chart";
import { NftPreview } from "../components/ui/nft-preview";
import { MarketStats } from "../components/ui/market-stats";
import { ContractStatus } from "../components/ui/contract-status";
import { useWebSocket } from "../hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Palette, Gem, Wallet, Shield } from "lucide-react";
import type { SentimentData, MarketActivity, Collection } from "@shared/schema";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"; // or your own component

import { Web3Service } from "@/lib/web3";

// Create a frontend-specific instance of Web3Service with VITE_CONTRACT_ADDRESS

const web3Service = new Web3Service(import.meta.env.VITE_CONTRACT_ADDRESS);

export default function Dashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [mintingProgress, setMintingProgress] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [nftForm, setNftForm] = useState({ name: "", description: "" });
  const { toast } = useToast();
  const { data: realtimeData } = useWebSocket('/ws');

  const { data: marketData } = useQuery<SentimentData>({
    queryKey: ['/api/market/overview'],
    refetchInterval: 30000,
  });
  const { data: recentActivity = [] } = useQuery<MarketActivity[]>({
    queryKey: ['/api/market/activity'],
    refetchInterval: 10000,
  });
  const { data: topCollections = [] } = useQuery<Collection[]>({
    queryKey: ['/api/collections/top'],
    refetchInterval: 60000,
  });
  const currentMarketData = realtimeData?.data || marketData;

  useEffect(() => {
    const connect = async () => {
      try {
        
        const wallet = await web3Service.connectWallet();
        setWalletAddress(wallet?.address || null);
        if (wallet?.address) {
          toast({
            title: "Wallet Connected",
            description: `Connected to ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
          });
        }
      } catch (err) {
        console.error("Wallet connection failed:", err);
        toast({
          title: "Connection Failed",
          description: "Unable to connect to wallet.",
          variant: "destructive",
        });
      }
    };
    connect();
  }, [toast]);

  const handleMintNft = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!nftForm.name || !nftForm.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);

    try {
      setMintingProgress(25);
      //Update contract sentiment
      const res = await web3Service.updateSentiment(
        currentMarketData?.marketSentiment
      )
      if (res.success) {
          console.log("Sentiment Updated")
      }else {
          console.log("Unknown error: Unable to update sentiment before mint");
      }
    
      setMintingProgress(50);
      // const result = await web3Service.mintNFT({
      //   name: nftForm.name,
      //   description: nftForm.description,
      //   attributes: {
      //     background: "Cosmic Blue",
      //     pattern: "Neural Network",
      //     mood: "Optimistic",
      //     energy: "High"
      //   }
      // });
      const result = await web3Service.mintNFT(
        nftForm.name,
        currentMarketData?.marketSentiment || 0.5,
        0.01 + (currentMarketData?.marketSentiment || 0.5) * 0.49
      )
      setMintingProgress(75);
      
      if (result.success) {
        setMintingProgress(100);
        toast({
          title: "NFT Minted Successfully!",
          description: `Token ID: ${result.tokenId}`,
        });
        setNftForm({ name: "", description: "" });
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      toast({
        title: "Minting failed",
        description: "There was an error minting your NFT",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setMintingProgress(0), 2000);
      setIsMinting(false);
    }
  };

  const getSentimentText = (sentiment: number) => {
    if (sentiment > 0.7) return "Bullish";
    if (sentiment > 0.5) return "Neutral";
    return "Bearish";
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.7) return "text-green-400";
    if (sentiment > 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="relative z-50 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 crypto-gradient rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SN</span>
                </div>
                <span className="text-xl font-bold gradient-text">
                  SentimentNFT
                </span>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-slate-300 hover:text-green-400 transition-colors duration-200">Dashboard</a>
              <a href="#" className="text-slate-300 hover:text-green-400 transition-colors duration-200">Analytics</a>
              <a href="#" className="text-slate-300 hover:text-green-400 transition-colors duration-200">Mint NFT</a>
              <a href="#" className="text-slate-300 hover:text-green-400 transition-colors duration-200">Collection</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                disabled//onClick={() => setIsWalletModalOpen(true)}
                className="glass-card border-green-400/30 hover:border-green-400 text-green-400 hover:bg-green-400/10"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="glass-card border-blue-400/30 hover:border-blue-400 text-blue-400 hover:bg-blue-400/10"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Status
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  side="bottom"
                  align="end"
                  className="w-[400px] p-4 bg-slate-900 border border-blue-400/30 rounded-xl shadow-xl glass-card"
                >
                  <ContractStatus />
                </PopoverContent>
            </Popover>

            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Overview */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="glass-card hover:neon-glow transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Market Sentiment</p>
                    <p className={`text-2xl font-bold ${getSentimentColor(currentMarketData?.marketSentiment || 0.6)}`}>
                      {getSentimentText(currentMarketData?.marketSentiment || 0.6)}
                    </p>
                  </div>
                  <div className="w-12 h-12 crypto-gradient rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:neon-glow transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">NFTs Minted</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {currentMarketData?.nftsMinted?.toLocaleString() || "1,247"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:neon-glow transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Active Traders</p>
                    <p className="text-2xl font-bold text-pink-400">
                      {currentMarketData?.activeTraders?.toLocaleString() || "8,429"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:neon-glow transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Volume (24h)</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {currentMarketData?.volume24h?.toFixed(1) || "342.8"} ETH
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-green-400 rounded-full flex items-center justify-center">
                    <Gem className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* NFT Minting Interface */}
          <div className="xl:col-span-2 space-y-6">
            {/* NFT Preview Section */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 gradient-text">
                  Dynamic NFT Preview
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* NFT Preview */}
                  <div className="space-y-4">
                    <NftPreview sentiment={currentMarketData?.marketSentiment || 0.6} />
                    
                    {/* NFT Attributes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass-card p-3 rounded-lg">
                        <p className="text-slate-400 text-xs">Background</p>
                        <p className="text-white text-sm font-medium">Cosmic Blue</p>
                      </div>
                      <div className="glass-card p-3 rounded-lg">
                        <p className="text-slate-400 text-xs">Pattern</p>
                        <p className="text-white text-sm font-medium">Neural Network</p>
                      </div>
                      <div className="glass-card p-3 rounded-lg">
                        <p className="text-slate-400 text-xs">Mood</p>
                        <p className="text-white text-sm font-medium">Optimistic</p>
                      </div>
                      <div className="glass-card p-3 rounded-lg">
                        <p className="text-slate-400 text-xs">Energy</p>
                        <p className="text-white text-sm font-medium">High</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Minting Controls */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">NFT Name</label>
                      <Input
                        placeholder="Enter NFT name"
                        value={nftForm.name}
                        onChange={(e) => setNftForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-green-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">Description</label>
                      <Textarea
                        placeholder="Describe your sentiment-based NFT..."
                        rows={3}
                        value={nftForm.description}
                        onChange={(e) => setNftForm(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-green-400 resize-none"
                      />
                    </div>
                    
                    {/* Dynamic pricing info */}
                    <div className="glass-card p-4 rounded-lg bg-slate-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm">Auto-Calculated Mint Price</span>
                        <span className="text-xs text-slate-400">Based on Market Sentiment</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-lg">
                          {(() => {
                            const sentiment = currentMarketData?.marketSentiment || 0.5;
                            //const sentimentMultiplier = 1 + (sentiment * 2);
                            const basePrice = 0.01 + (sentiment * 0.49);
                            return Number((basePrice).toFixed(4));
                          })()} ETH
                        </span>
                        <div className="text-right">
                          <div className={`text-sm ${getSentimentColor(currentMarketData?.marketSentiment || 0.5)}`}>
                            {getSentimentText(currentMarketData?.marketSentiment || 0.5)} Market
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Minting Progress */}
                    {isMinting && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Minting Progress</span>
                          <span className="text-green-400">{mintingProgress}%</span>
                        </div>
                        <Progress value={mintingProgress} className="h-2" />
                        <p className="text-xs text-slate-400">
                          {mintingProgress === 25 && "Generating NFT metadata..."}
                          {mintingProgress === 50 && "Uploading to IPFS..."}
                          {mintingProgress === 75 && "Interacting with smart contract..."}
                          {mintingProgress === 100 && "NFT minted successfully!"}
                        </p>
                      </div>
                    )}
                    
                    <Button
                      onClick={handleMintNft}
                      disabled={isMinting}
                      className="w-full py-4 crypto-gradient hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 text-white font-semibold"
                    >
                      {isMinting ? "Minting..." : "Mint Dynamic NFT"} 🚀
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Sentiment Evolution Chart */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Sentiment Evolution</h3>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="border-green-400/30 text-green-400">24H</Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">7D</Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">30D</Badge>
                  </div>
                </div>
                <div className="h-64">
                  <SentimentChart />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar Content */}
          <div className="space-y-6">
            <MarketStats marketData={currentMarketData} />
            
            {/* Recent NFT Activity */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
                
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                      <img
                        src="https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40"
                        alt="NFT"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium capitalize">{activity.action}</p>
                        <p className="text-slate-400 text-xs">{activity.nftName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 text-sm">{activity.price?.toFixed(2)} ETH</p>
                        <p className="text-slate-400 text-xs">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : "Now"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Top Collections */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Top Collections</h3>
                <div className="space-y-3">
                  {topCollections.map((collection, index) => (
                    <div key={collection.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${index === 0 ? 'crypto-gradient' : 'bg-slate-600'} rounded-full flex items-center justify-center text-xs font-bold`}>
                          {index + 1}
                        </div>
                        <span className="text-white">{collection.name}</span>
                      </div>
                      <span className={`text-sm ${index === 0 ? 'text-green-400' : index === 1 ? 'text-blue-400' : 'text-purple-400'}`}>
                        {collection.volume.toFixed(0)} ETH
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      /> */}
    </div>
  );
}
