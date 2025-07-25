import { Card, CardContent } from "@/components/ui/card";
import type { SentimentData } from "@shared/schema";

interface MarketStatsProps {
  marketData?: SentimentData;
}

export function MarketStats({ marketData }: MarketStatsProps) {
  const cryptoData = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      price: marketData?.btcPrice || 43247,
      change: "+2.4%",
      positive: true
    },
    {
      name: "Ethereum", 
      symbol: "ETH",
      price: marketData?.ethPrice || 2543,
      change: "+5.2%",
      positive: true
    },
    {
      name: "Solana",
      symbol: "SOL", 
      price: marketData?.solPrice || 98.32,
      change: "-1.8%",
      positive: false
    }
  ];

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Market Data</h3>
        
        <div className="space-y-4">
          {cryptoData.map((crypto) => (
            <div key={crypto.symbol} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 crypto-gradient rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {crypto.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{crypto.name}</p>
                  <p className="text-slate-400 text-sm">{crypto.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">
                  ${crypto.price.toLocaleString()}
                </p>
                <p className={`text-sm ${crypto.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {crypto.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}