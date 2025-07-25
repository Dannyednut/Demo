# Quick Setup Guide

## Current Status: Demo Mode

Your platform is running in **demo mode** which uses:
- Mock wallet connections (fake addresses)
- Simulated market sentiment data
- No real blockchain interaction

## Enable Real Wallet Connections

### Option 1: Quick Test (Local Network)

1. **Deploy to local blockchain:**
   ```bash
   cd contracts
   npm install
   npx hardhat node
   # In new terminal:
   npx hardhat run scripts/deploy.js --network localhost
   ```

2. **Set contract address:**
   ```bash
   # Copy the contract address from deployment output
   export VITE_CONTRACT_ADDRESS=0x_your_contract_address_here
   ```

3. **Restart the app:**
   ```bash
   npm run dev
   ```

4. **Install MetaMask and connect to localhost network:**
   - Network: Localhost 8545
   - Chain ID: 1337
   - Currency: ETH

### Option 2: Real Testnet (Recommended)

1. **Get testnet ETH:**
   - Install MetaMask
   - Switch to Goerli testnet
   - Get free ETH from: https://faucet.quicknode.com/ethereum/goerli

2. **Deploy to Goerli:**
   ```bash
   cd contracts
   # Create .env file:
   echo "PRIVATE_KEY=your_metamask_private_key" > .env
   echo "GOERLI_RPC_URL=https://eth-goerli.alchemyapi.io/v2/YOUR-API-KEY" >> .env
   
   npx hardhat run scripts/deploy.js --network goerli
   ```

3. **Update frontend:**
   ```bash
   export VITE_CONTRACT_ADDRESS=deployed_contract_address
   npm run dev
   ```

## Enable Real Market Sentiment

### Option 1: Free APIs (Limited)

1. **Set environment variables:**
   ```bash
   export USE_REAL_SENTIMENT=true
   export VITE_USE_REAL_SENTIMENT=true
   ```

2. **Restart the app:**
   ```bash
   npm run dev
   ```

This uses:
- CoinGecko API (free, no key needed)
- Fear & Greed Index (free)
- Basic news sentiment (limited)

### Option 2: Full Real Data (API Keys Required)

1. **Get API keys:**
   - NewsAPI: https://newsapi.org/ (free tier available)
   - Optional: Twitter API for social sentiment
   - Optional: LunarCrush for crypto social data

2. **Configure environment:**
   ```bash
   export USE_REAL_SENTIMENT=true
   export VITE_USE_REAL_SENTIMENT=true
   export VITE_NEWS_API_KEY=your_news_api_key
   ```

3. **Restart the app:**
   ```bash
   npm run dev
   ```

## What Changes When You Enable Real Mode

### Real Wallet Connections:
- ✅ Connects to actual MetaMask/wallet extensions
- ✅ Shows real wallet balances
- ✅ Real blockchain transactions
- ✅ Actual gas fees
- ✅ Transaction confirmations on blockchain

### Real Sentiment Data:
- ✅ Live Bitcoin/Ethereum price changes
- ✅ Fear & Greed Index from crypto markets
- ✅ News sentiment analysis
- ✅ Social media sentiment (with APIs)
- ✅ Real market volatility affects NFT pricing

## Testing Both Modes

You can test the differences:

1. **Demo Mode:** No setup required, instant simulation
2. **Real Mode:** Deploy contract + enable real sentiment

The app seamlessly switches between modes based on configuration.