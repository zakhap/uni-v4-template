# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on http://localhost:3000)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`

## Project Architecture

### Core Structure
This is a Next.js + React application called "UniV4 Demo" - a web3 dApp for trading ETH and USDC using Uniswap V4 on Base network.

### Key Components
- **TradingInterface** (`src/components/TradingInterface.tsx`): Main landing page with trading button
- **SwapComponent** (`src/components/SwapComponent.jsx`): Core swap functionality using Uniswap V4
- **TradeModal** (`src/components/TradeModal.tsx`): Modal containing the swap interface
- **Layout** (`src/components/Layout.tsx`): App shell with header and overall structure

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Web3**: wagmi 2.x, viem, RainbowKit for wallet connections
- **Styling**: Tailwind CSS, CSS modules
- **Network**: Base network (Layer 2)

### Uniswap V4 Integration
The project includes a comprehensive Uniswap V4 library at `src/lib/uniswap-v4/` with:
- **React Hooks**: `useSwap`, `useQuote`, `useEthBalance`, `useTokenBalance` for trading operations
- **Core Managers**: `SwapManager`, `QuoteManager`, `TransactionBuilder` for low-level operations
- **Contract Integration**: Pre-configured addresses and ABIs for Base network
- **Token Address**: USDC_ADDRESS exported from the library
- **Pool Configuration**: Uses 3000 fee tier for ETH/USDC pool

### Contract Interaction
- Uses wagmi's hooks for contract interactions
- Trading between native ETH and USDC tokens
- Real-time price quotes and balance updates

### State Management Patterns
- **Custom Hooks**: Encapsulated trading logic in the Uniswap V4 library
- **Toast Notifications**: User feedback for swaps and transactions
- **EthPriceContext**: ETH price tracking (retained for potential future use)

### Key Files to Understand
- `src/lib/uniswap-v4/API_GUIDE.md`: Complete documentation for the trading system
- `src/lib/constants.ts`: Contract addresses and configuration
- `src/lib/abi.ts`: Contract ABI definitions
- `wagmi.ts`: Web3 configuration for Base network