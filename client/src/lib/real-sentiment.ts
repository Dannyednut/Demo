// Real-world sentiment data integration
// This replaces the mock sentiment generation with actual market data

interface SentimentSource {
  name: string;
  weight: number;
  fetchSentiment: () => Promise<number>;
}

interface CryptoPrice {
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
}

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
}

class RealSentimentService {
  private static instance: RealSentimentService;
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: any; timestamp: number }>();

  static getInstance(): RealSentimentService {
    if (!RealSentimentService.instance) {
      RealSentimentService.instance = new RealSentimentService();
    }
    return RealSentimentService.instance;
  }

  private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.warn(`Failed to fetch ${key}:`, error);
      // Return cached data if available, even if stale
      if (cached) {
        return cached.data as T;
      }
      throw error;
    }
  }

  /**
   * Fetch crypto prices from CoinGecko API
   */
  private async fetchCryptoPrices(): Promise<number> {
    return this.fetchWithCache('crypto-prices', async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,solana,polygon&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Calculate weighted sentiment based on major crypto performance
      const cryptos = [
        { symbol: 'bitcoin', weight: 0.4 },
        { symbol: 'ethereum', weight: 0.3 },
        { symbol: 'solana', weight: 0.1 },
        { symbol: 'cardano', weight: 0.1 },
        { symbol: 'polygon', weight: 0.1 }
      ];
      
      let weightedSentiment = 0;
      let totalWeight = 0;
      
      for (const crypto of cryptos) {
        const priceData = data[crypto.symbol];
        if (priceData && priceData.usd_24h_change !== undefined) {
          // Convert 24h change to sentiment (0-1 scale)
          // -10% = 0, 0% = 0.5, +10% = 1
          const change = priceData.usd_24h_change;
          const sentiment = Math.max(0, Math.min(1, 0.5 + (change / 20)));
          
          weightedSentiment += sentiment * crypto.weight;
          totalWeight += crypto.weight;
        }
      }
      
      return totalWeight > 0 ? weightedSentiment / totalWeight : 0.5;
    });
  }

  /**
   * Fetch Fear & Greed Index
   */
  private async fetchFearGreedIndex(): Promise<number> {
    return this.fetchWithCache('fear-greed', async () => {
      const response = await fetch('https://api.alternative.me/fng/');
      
      if (!response.ok) {
        throw new Error(`Fear & Greed API error: ${response.status}`);
      }
      
      const data = await response.json();
      const fearGreedValue = parseInt(data.data[0].value);
      
      // Convert 0-100 scale to 0-1 scale
      return fearGreedValue / 100;
    });
  }

  /**
   * Fetch social sentiment from news API
   */
  private async fetchNewsSentiment(): Promise<number> {
    return this.fetchWithCache('news-sentiment', async () => {
      // Example using NewsAPI (requires API key)
      // In production, you'd use a proper news sentiment analysis service
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=cryptocurrency OR bitcoin OR ethereum&sortBy=publishedAt&language=en&apiKey=${process.env.VITE_NEWS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Simple sentiment analysis based on headline keywords
      let positiveCount = 0;
      let negativeCount = 0;
      
      const positiveWords = ['surge', 'bull', 'gain', 'rise', 'profit', 'moon', 'breakthrough', 'adoption'];
      const negativeWords = ['crash', 'bear', 'fall', 'loss', 'dump', 'decline', 'fear', 'regulation'];
      
      data.articles.slice(0, 20).forEach((article: any) => {
        const text = (article.title + ' ' + article.description).toLowerCase();
        
        positiveWords.forEach(word => {
          if (text.includes(word)) positiveCount++;
        });
        
        negativeWords.forEach(word => {
          if (text.includes(word)) negativeCount++;
        });
      });
      
      const total = positiveCount + negativeCount;
      if (total === 0) return 0.5; // Neutral if no sentiment words found
      
      return positiveCount / total;
    });
  }

  /**
   * Get aggregated real-world sentiment
   */
  async getRealWorldSentiment(): Promise<{
    overall: number;
    sources: {
      crypto: number;
      fearGreed: number;
      news: number;
    };
    timestamp: number;
  }> {
    const sources: SentimentSource[] = [
      {
        name: 'crypto',
        weight: 0.5,
        fetchSentiment: () => this.fetchCryptoPrices()
      },
      {
        name: 'fearGreed',
        weight: 0.3,
        fetchSentiment: () => this.fetchFearGreedIndex()
      },
      {
        name: 'news',
        weight: 0.2,
        fetchSentiment: () => this.fetchNewsSentiment()
      }
    ];

    const results = await Promise.allSettled(
      sources.map(async source => ({
        name: source.name,
        weight: source.weight,
        sentiment: await source.fetchSentiment()
      }))
    );

    let weightedSentiment = 0;
    let totalWeight = 0;
    const sourceResults: any = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { name, weight, sentiment } = result.value;
        weightedSentiment += sentiment * weight;
        totalWeight += weight;
        sourceResults[name] = sentiment;
      } else {
        console.warn(`Failed to fetch sentiment from ${sources[index].name}:`, result.reason);
        // Use neutral sentiment for failed sources
        sourceResults[sources[index].name] = 0.5;
      }
    });

    // Fallback to neutral if all sources failed
    const overall = totalWeight > 0 ? weightedSentiment / totalWeight : 0.5;

    return {
      overall: Math.max(0, Math.min(1, overall)),
      sources: sourceResults,
      timestamp: Date.now()
    };
  }

  /**
   * Get a simple sentiment value for backward compatibility
   */
  async getSimpleSentiment(): Promise<number> {
    try {
      const sentiment = await this.getRealWorldSentiment();
      return sentiment.overall;
    } catch (error) {
      console.warn('Failed to fetch real sentiment, using fallback:', error);
      // Fallback to a more realistic simulation
      return 0.4 + (Math.random() * 0.2); // 0.4-0.6 range
    }
  }
}

export const realSentimentService = RealSentimentService.getInstance();

// Configuration for enabling real sentiment
export const SENTIMENT_CONFIG = {
  useRealData: process.env.VITE_USE_REAL_SENTIMENT === 'true',
  requiredApiKeys: {
    newsApi: process.env.VITE_NEWS_API_KEY,
    // Add other API keys as needed
  }
};