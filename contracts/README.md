# SentimentNFT Smart Contract

This directory contains the smart contract implementation for the SentimentNFT platform - a dynamic NFT system that evolves based on market sentiment.

## Features

- **Dynamic Pricing**: Mint prices automatically adjust based on market sentiment (0.01-1.5 ETH range)
- **Sentiment Evolution**: NFTs evolve their attributes and rarity as market sentiment changes
- **Rarity Tiers**: Common → Rare → Ultra Rare → Legendary based on sentiment scores
- **Real-time Updates**: Oracle system updates sentiment for all existing NFTs
- **ERC-721 Compliant**: Standard NFT implementation with additional sentiment features

## Smart Contract Architecture

### Core Contract: `SentimentNFT.sol`

**Key Functions:**
- `mintNFT()` - Mint new NFTs with current sentiment-based pricing
- `updateSentiment()` - Oracle function to update global sentiment
- `getCurrentMintPrice()` - Get current dynamic mint price
- `getNFTData()` - Retrieve NFT metadata and evolution data
- `getSentimentEvolution()` - Track how an NFT's sentiment has changed

**Sentiment System:**
- Sentiment values: 0-1000 (representing 0.0-1.0)
- Price formula: `(basePrice + sentiment * 0.49 ETH) * (1 + sentiment * 2)`
- Rarity mapping: 0-400 (Common), 401-600 (Rare), 601-800 (Ultra Rare), 801-1000 (Legendary)

## Installation & Setup

### Prerequisites
```bash
npm install -g hardhat
```

### Install Dependencies
```bash
cd contracts
npm install
```

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Local Network

1. Start local Hardhat network:
```bash
npx hardhat node
```

2. Deploy contract:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Testnet

1. Set up environment variables:
```bash
# Create .env file in contracts directory
PRIVATE_KEY=your_private_key_here
GOERLI_RPC_URL=https://eth-goerli.alchemyapi.io/v2/YOUR-API-KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. Deploy to Goerli:
```bash
npx hardhat run scripts/deploy.js --network goerli
```

3. Verify contract (optional):
```bash
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS
```

## Integration with Frontend

After deployment, update the frontend configuration:

1. Copy the deployed contract address
2. Set the environment variable in your main project:
```bash
VITE_CONTRACT_ADDRESS=0x_your_deployed_address_here
```

3. The frontend will automatically detect the contract and switch from mock mode to real blockchain interaction

## Oracle Integration

The contract includes a sentiment oracle system:

1. **Set Oracle Address**: Only the contract owner can set the oracle address
2. **Update Sentiment**: The oracle calls `updateSentiment(uint256)` with values 0-1000
3. **Automatic Evolution**: All existing NFTs update their current sentiment and rarity

For production, integrate with external APIs:
- CoinGecko for crypto prices
- Twitter API for social sentiment
- News APIs for market analysis
- Fear & Greed Index

## Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks on mint function
- **Access Control**: Oracle functions protected by role-based access
- **Input Validation**: Sentiment values bounded to valid ranges
- **Overflow Protection**: Uses SafeMath for all calculations
- **Withdrawal Function**: Owner can withdraw contract funds

## Gas Optimization

- **Efficient Storage**: Packed structs to minimize storage slots
- **Batch Operations**: Update all NFTs sentiment in single transaction
- **View Functions**: Read-only functions don't consume gas
- **Event Logging**: Efficient event emission for off-chain indexing

## Testing Coverage

The test suite covers:
- Contract deployment and initialization
- Sentiment management and access control
- Dynamic pricing calculations
- NFT minting with various scenarios
- NFT evolution and rarity changes
- Error conditions and edge cases
- Gas usage optimization

Run with coverage:
```bash
npx hardhat coverage
```

## Production Deployment Checklist

- [ ] Audit smart contract code
- [ ] Test on testnet thoroughly
- [ ] Set up reliable oracle infrastructure
- [ ] Configure monitoring and alerting
- [ ] Verify contract on Etherscan
- [ ] Set up multisig wallet for contract ownership
- [ ] Document deployment parameters
- [ ] Test frontend integration
- [ ] Monitor initial transactions

## Support

For questions about the smart contract implementation, refer to:
- [OpenZeppelin Documentation](https://docs.openzeppelin.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethereum Development Documentation](https://ethereum.org/en/developers/docs/)