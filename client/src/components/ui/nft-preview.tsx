interface NftPreviewProps {
  sentiment: number;
  calculatedPrice?: number;
}

export function NftPreview({ sentiment, calculatedPrice }: NftPreviewProps) {
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

  const getRarityText = (sentiment: number) => {
    if (sentiment > 0.8) return "Legendary";
    if (sentiment > 0.6) return "Ultra Rare";
    if (sentiment > 0.4) return "Rare";
    return "Common";
  };

  const getRarityColor = (sentiment: number) => {
    if (sentiment > 0.8) return "text-purple-400";
    if (sentiment > 0.6) return "text-blue-400";
    if (sentiment > 0.4) return "text-green-400";
    return "text-gray-400";
  };

  // Calculate dynamic price based on sentiment if not provided
  const getCalculatedPrice = (sentiment: number) => {
    if (calculatedPrice) return calculatedPrice;
    const sentimentMultiplier = 1 + (sentiment * 2);
    const basePrice = 0.01 + (sentiment * 0.49);
    return Number((basePrice * sentimentMultiplier).toFixed(4));
  };

  return (
    <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden animate-float">
      <img
        src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800"
        alt="Dynamic blockchain visualization"
        className="w-full h-full object-cover"
        style={{
          filter: `hue-rotate(${sentiment * 360}deg) saturate(${0.8 + sentiment * 0.4}) brightness(${0.7 + sentiment * 0.3})`
        }}
      />
      
      {/* Sentiment Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between mb-2">
            <div className="glass-card px-3 py-1 rounded-full">
              <span className={`text-sm font-medium ${getSentimentColor(sentiment)}`}>
                {getSentimentText(sentiment)}
              </span>
            </div>
            <div className="glass-card px-3 py-1 rounded-full">
              <span className={`text-sm ${getRarityColor(sentiment)}`}>
                {getRarityText(sentiment)}
              </span>
            </div>
          </div>
          
          {/* Dynamic Price Display */}
          <div className="glass-card px-3 py-2 rounded-lg w-full">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Mint Price</span>
              <span className="text-white font-bold text-lg">
                {getCalculatedPrice(sentiment)} ETH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic glow effect based on sentiment */}
      <div 
        className="absolute inset-0 rounded-xl opacity-30"
        style={{
          boxShadow: `inset 0 0 50px ${sentiment > 0.7 ? '#06FFA5' : sentiment > 0.5 ? '#FFD700' : '#FF4444'}`
        }}
      />
    </div>
  );
}