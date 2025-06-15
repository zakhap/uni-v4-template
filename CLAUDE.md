# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on http://localhost:3000)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`

## Project Architecture

### Core Structure
This is a Next.js + React application called "ContentmentCoin" - a web3 dApp for trading a mood-based ERC20 token on Base network. The token's visual representation changes based on trading activity.

### Key Components
- **ContentmentCoin** (`src/components/ContentmentCoin.tsx`): Main trading interface component
- **SwapComponent** (`src/components/SwapComponent.jsx`): Core swap functionality using Uniswap V4
- **Layout** (`src/components/Layout.tsx`): App shell with header and overall structure
- **MoodContext** (`src/contexts/MoodContext.tsx`): Manages token mood state (Content/Happy/Angry) and visual updates

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Web3**: wagmi 2.x, viem, RainbowKit for wallet connections
- **Styling**: Tailwind CSS, CSS modules
- **State**: React Context for mood state management
- **Network**: Base network (Layer 2)

### Uniswap V4 Integration
The project includes a comprehensive Uniswap V4 library at `src/lib/uniswap-v4/` with:
- **React Hooks**: `useSwap`, `useQuote`, `useEthBalance`, `useTokenBalance` for trading operations
- **Core Managers**: `SwapManager`, `QuoteManager`, `TransactionBuilder` for low-level operations
- **Contract Integration**: Pre-configured addresses and ABIs for Base network
- **Token Address**: CONTENTMENT_COIN_ADDRESS exported from the library

### Contract Interaction
- Uses wagmi's `useReadContracts` for batch reading contract state
- Mood system reads from token contract every 5 seconds to update UI
- SVG images are decoded from base64 data URIs returned by the contract
- Trading activity affects token mood with 5-minute cooldown periods

### State Management Patterns
- **MoodContext**: Centralized mood state with real-time updates from contract
- **Custom Hooks**: Encapsulated trading logic in the Uniswap V4 library
- **Toast Notifications**: Contextual feedback for swaps and mood changes

### Key Files to Understand
- `src/lib/uniswap-v4/API_GUIDE.md`: Complete documentation for the trading system
- `src/lib/constants.ts`: Color constants and contract addresses
- `src/lib/abi.ts`: Contract ABI definitions
- `wagmi.ts`: Web3 configuration for Base network