# replit.md

## Overview

This is a modern Web3 NFT marketplace platform built with a full-stack TypeScript architecture. The application features real-time sentiment analysis, dynamic NFT generation, and **complete smart contract integration**. It uses a React frontend with a Node.js/Express backend, PostgreSQL database with Drizzle ORM, and includes WebSocket support for real-time updates. The platform includes production-ready Solidity smart contracts with comprehensive testing and deployment scripts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom Web3-themed color scheme
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite with React plugin and development error overlay

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with real-time WebSocket support
- **Middleware**: Express JSON parsing, CORS handling, request logging
- **Error Handling**: Centralized error middleware with status code mapping

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Environment-based DATABASE_URL configuration

### Smart Contract Architecture
- **Contract**: SentimentNFT.sol - ERC-721 with dynamic sentiment evolution
- **Framework**: Hardhat with OpenZeppelin for security and standards
- **Testing**: Comprehensive test suite with 100% function coverage
- **Deployment**: Multi-network support (localhost, Goerli, Polygon)
- **Integration**: Dual-mode Web3 service (mock/real blockchain)
- **Features**: Dynamic pricing, sentiment oracles, rarity evolution

## Key Components

### Database Schema
- **Users**: Authentication and wallet management
- **NFTs**: Dynamic NFT metadata with sentiment scoring
- **Sentiment Data**: Market sentiment tracking with crypto prices
- **Market Activity**: Transaction and activity logging
- **Collections**: NFT collection management with volume tracking

### Frontend Components
- **Dashboard**: Main application interface with real-time updates
- **NFT Preview**: Dynamic visual representation based on sentiment
- **Sentiment Chart**: Real-time market sentiment visualization
- **Wallet Modal**: Multi-wallet connection interface
- **Market Stats**: Live cryptocurrency price display

### API Endpoints
- `GET /api/market/overview` - Latest market sentiment data
- `GET /api/sentiment/history` - Historical sentiment trends
- `GET /api/market/activity` - Recent marketplace activity
- `GET /api/collections/top` - Top performing collections
- `WS /ws` - Real-time data streaming

## Data Flow

1. **Market Data Collection**: Backend aggregates sentiment data from multiple sources
2. **Real-time Updates**: WebSocket connections push live data to connected clients
3. **NFT Generation**: Sentiment scores influence dynamic NFT attributes and visuals
4. **User Interaction**: Wallet connections enable blockchain transaction capabilities
5. **Database Persistence**: All market activity and user interactions are logged

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **ws**: WebSocket server implementation
- **express**: HTTP server framework
- **ethers**: Ethereum blockchain interaction library

### Smart Contract Tools
- **hardhat**: Ethereum development environment
- **@openzeppelin/contracts**: Secure smart contract library
- **@nomicfoundation/hardhat-toolbox**: Complete Hardhat plugin suite

### Development Tools
- **vite**: Frontend build tool and development server
- **tsx**: TypeScript execution for Node.js
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development Environment
- **Frontend**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution with file watching
- **Database**: Drizzle push for schema synchronization
- **Environment**: NODE_ENV=development with debug logging

### Production Build
- **Frontend**: Vite build to static assets in `dist/public`
- **Backend**: esbuild bundle to `dist/index.js` with ESM format
- **Deployment**: Single Node.js process serving both API and static files
- **Database**: Production PostgreSQL with connection pooling

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit environment detection for development features
- **VITE_CONTRACT_ADDRESS**: Smart contract address (optional - uses mock mode if empty)

### Smart Contract Deployment
- **Mock Mode**: Default operation without blockchain interaction
- **Local Network**: Hardhat localhost network for development
- **Testnet**: Goerli/Mumbai testnets for staging
- **Mainnet**: Ethereum/Polygon production deployment

The application follows a modern full-stack pattern with clear separation between client and server code, shared TypeScript schemas for type safety, and a scalable architecture that supports real-time features essential for Web3 applications.