# SentimentNFT Platform Deployment Guide

This guide covers deploying the complete SentimentNFT platform, including both the web application and smart contracts.

## Quick Start (Demo Mode)

The platform runs in **mock mode** by default, providing a full demonstration without requiring blockchain setup:

1. **Clone and Setup**
   ```bash
   npm install
   npm run dev
   ```

2. **View the Demo**
   - Open the running application
   - Connect wallet (mock wallets provided)
   - Mint NFTs with dynamic sentiment-based pricing
   - Watch real-time sentiment evolution

## Smart Contract Deployment

### Option 1: Local Development Network

1. **Start Local Blockchain**
   ```bash
   cd contracts
   npm install
   npx hardhat node
   ```

2. **Deploy Contract**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Configure Frontend**
   ```bash
   # Copy the deployed contract address and set:
   export VITE_CONTRACT_ADDRESS=0x_your_contract_address_here
   ```

4. **Restart Application**
   ```bash
   npm run dev
   ```

### Option 2: Testnet Deployment (Recommended for Testing)

1. **Setup Wallet & RPC**
   - Create a wallet with testnet ETH
   - Get API keys from Infura/Alchemy
   - Configure `.env` in contracts directory:
   ```bash
   PRIVATE_KEY=your_private_key_here
   GOERLI_RPC_URL=https://eth-goerli.alchemyapi.io/v2/YOUR-API-KEY
   ```

2. **Deploy to Goerli**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network goerli
   ```

3. **Verify Contract**
   ```bash
   npx hardhat verify --network goerli DEPLOYED_ADDRESS
   ```

4. **Update Frontend Configuration**
   ```bash
   export VITE_CONTRACT_ADDRESS=deployed_contract_address
   ```

### Option 3: Production Deployment

1. **Audit Contract** (Required for mainnet)
   - Professional smart contract audit
   - Security review and penetration testing
   - Gas optimization analysis

2. **Deploy to Mainnet**
   ```bash
   # Ethereum Mainnet
   npx hardhat run scripts/deploy.js --network mainnet

   # Or Polygon (lower gas fees)
   npx hardhat run scripts/deploy.js --network polygon
   ```

3. **Setup Oracle System**
   - Deploy sentiment oracle infrastructure
   - Configure real-time data feeds
   - Set up monitoring and alerting

## Web Application Deployment

### Option 1: Replit Deployment

1. **Use Built-in Deployment**
   - Click "Deploy" in Replit interface
   - Automatic SSL and domain configuration
   - Zero-configuration deployment

2. **Environment Variables**
   ```bash
   DATABASE_URL=your_postgresql_url
   VITE_CONTRACT_ADDRESS=your_contract_address
   NODE_ENV=production
   ```

### Option 2: Manual Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Deploy Static Files**
   - Upload `dist/public` to CDN/static hosting
   - Configure reverse proxy for API routes

3. **Deploy Backend**
   ```bash
   # Start production server
   node dist/index.js
   ```

## Platform Configuration

### Sentiment Oracle Setup

For production deployment, integrate real market data:

```javascript
// Example oracle integration
const sentimentSources = [
  'https://api.coingecko.com/api/v3/simple/price',
  'https://api.lunarcrush.com/v2/market/sentiment',
  'https://api.alternative.me/fng/'
];

async function updateMarketSentiment() {
  const sentiment = await aggregateSentimentData(sentimentSources);
  await contract.updateSentiment(sentiment * 1000); // Convert to 0-1000 scale
}
```

### Database Configuration

```sql
-- Production database setup
CREATE DATABASE sentimentnft_prod;
CREATE USER sentimentnft WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sentimentnft_prod TO sentimentnft;
```

### Monitoring & Analytics

1. **Smart Contract Events**
   ```bash
   # Monitor NFT minting events
   contract.on('NFTMinted', (tokenId, to, sentiment, price) => {
     console.log(`NFT ${tokenId} minted for ${price} ETH`);
   });
   ```

2. **Application Metrics**
   - User engagement tracking
   - Minting volume analytics
   - Sentiment correlation analysis
   - Performance monitoring

## Security Checklist

### Smart Contract Security
- [ ] Professional audit completed
- [ ] Access controls verified
- [ ] Reentrancy protection enabled
- [ ] Gas optimization implemented
- [ ] Oracle data validation
- [ ] Emergency pause mechanism
- [ ] Multisig wallet for ownership

### Application Security
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] API rate limiting enabled
- [ ] Input validation implemented
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Security headers configured

## Maintenance

### Regular Tasks
- Monitor sentiment oracle accuracy
- Update smart contract oracle permissions
- Backup database regularly
- Monitor gas costs and optimize
- Track user feedback and usage patterns
- Update frontend for new wallet integrations

### Emergency Procedures
- Oracle malfunction: Manual sentiment updates
- High gas costs: Recommend transaction timing
- Contract issues: Emergency pause and investigation
- Database issues: Restore from backup

## Support Resources

- **Smart Contract Documentation**: `/contracts/README.md`
- **API Documentation**: Available in development mode at `/api/docs`
- **Frontend Components**: Documented in `/client/src/components`
- **Database Schema**: `/shared/schema.ts`

## Cost Estimates

### Development (Testnet)
- **Gas Costs**: ~$5-20 USD for deployment and testing
- **Infrastructure**: Free (Replit + test networks)

### Production (Mainnet)
- **Smart Contract Deployment**: $50-200 USD (depending on gas prices)
- **Monthly Oracle Operations**: $100-500 USD
- **Application Hosting**: $20-100 USD/month
- **Database**: $25-200 USD/month (depending on scale)

The platform is designed to scale from a demo to production with minimal configuration changes, making it perfect for rapid prototyping and deployment.