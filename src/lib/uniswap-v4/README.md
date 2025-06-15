# Uniswap V4 Library

A comprehensive TypeScript library for interacting with Uniswap V4 on Base network, providing both low-level managers and high-level React hooks.

## Features

- 🔄 **Complete Swap Operations** - Buy/sell with ETH and tokens
- 💰 **Real-time Price Quotes** - Live price feeds with auto-refresh
- 💳 **Balance Management** - ETH and token balance tracking
- 🔐 **Permit2 Integration** - Gasless token approvals
- ⚡ **React Hooks** - Ready-to-use hooks for React apps
- 🎯 **TypeScript** - Full type safety and IntelliSense
- 🧪 **Testable** - Modular architecture for easy testing

## Quick Start

### React Hooks (Recommended)

```tsx
import { useSwap, useQuote, useEthBalance } from './lib/uniswap-v4';

function SwapComponent() {
  const [amount, setAmount] = useState('');
  
  // Get real-time quotes
  const { quote, isLoading } = useQuote(amount, true); // true = buying
  
  // Get user balances
  const ethBalance = useEthBalance();
  
  // Execute swaps
  const { executeSwap, isSwapping } = useSwap({
    onSwapSuccess: (result) => console.log('Swap successful!', result.hash),
    onSwapError: (error) => console.error('Swap failed:', error)
  });
  
  const handleSwap = async () => {
    await executeSwap({
      tokenAddress: '0x90DD085b85600a66041500f2973066dd62e74900',
      amountIn: amount,
      minAmountOut: quote?.amountOut || BigInt(0),
      isBuying: true,
      slippagePercent: 10
    });
  };
  
  return (
    <div>
      <input 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to swap"
      />
      <p>Expected output: {quote ? formatEther(quote.amountOut) : '...'}</p>
      <p>ETH Balance: {ethBalance.formattedBalance}</p>
      <button onClick={handleSwap} disabled={isSwapping}>
        {isSwapping ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
}
```

### Low-level Managers

```typescript
import { SwapManager, QuoteManager, publicClient } from './lib/uniswap-v4';

// Initialize managers
const swapManager = new SwapManager(publicClient);
const quoteManager = new QuoteManager(publicClient);

// Get a quote
const quote = await quoteManager.getBuyQuote('1.0'); // 1 ETH

// Execute a swap
swapManager.setWalletClient(walletClient);
const result = await swapManager.executeBuySwap({
  tokenAddress: '0x90DD085b85600a66041500f2973066dd62e74900',
  amountIn: '1.0',
  minAmountOut: BigInt(0),
  isBuying: true,
  slippagePercent: 10
});
```

## Available Hooks

### Swap Hooks
- `useSwap()` - General swap execution with callbacks
- `useBuySwap()` - Specialized for ETH → Token swaps
- `useSellSwap()` - Specialized for Token → ETH swaps

### Quote Hooks  
- `useQuote()` - Get price quotes with auto-refresh
- `useBuyQuote()` & `useSellQuote()` - Direction-specific quotes
- `useQuoteStream()` - Real-time streaming quotes
- `useQuoteComparison()` - Compare buy vs sell rates

### Balance Hooks
- `useEthBalance()` - ETH balance tracking
- `useTokenBalance()` - ERC20 token balance tracking
- `useBalances()` - Multiple token balances
- `useBalanceCheck()` - Insufficient balance detection

## Core Managers

### SwapManager
Orchestrates swap execution with gas estimation, validation, and error handling.

### QuoteManager  
Provides real-time price quotes using Uniswap V4 Quoter contract.

### TransactionBuilder
Builds and validates transaction objects for swaps.

## Types

All major types are exported for TypeScript users:

```typescript
import type { 
  SwapParams, 
  SwapResult, 
  QuoteResult, 
  PoolKey,
  TradeType,
  SwapStatus 
} from './lib/uniswap-v4';
```

## Contract Addresses (Base Network)

- **Universal Router**: `0x6ff5693b99212da76ad316178a184ab56d299b43`
- **Permit2**: `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- **V4 Quoter**: `0xfcB683b34bA4bF29cB9eCe8D805c68132b4D4cF3`
- **Pool Manager**: `0x498581ff718922c3f8e6a244956af099b2652b2b`

## Architecture

```
uniswap-v4/
├── core/           # Low-level managers
├── hooks/          # React hooks  
├── types/          # TypeScript definitions
├── contracts/      # ABIs and addresses
├── utils/          # Encoding and calculations
└── index.ts        # Public API
```

## Requirements

- React 18+
- wagmi 2.0+
- viem 2.0+
- Base network connection