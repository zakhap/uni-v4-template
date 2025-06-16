# Uniswap V4 Library - Complete API Guide

A comprehensive guide to using the Uniswap V4 library for ETH/USDC trading on Base network.

## Table of Contents

- [Quick Start](#quick-start)
- [React Hooks API](#react-hooks-api)
- [Core Managers API](#core-managers-api)
- [Types & Interfaces](#types--interfaces)
- [Utilities](#utilities)
- [Contract Information](#contract-information)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Quick Start

### Installation

```typescript
// Single import for everything
import { 
  useSwap, 
  useQuote, 
  useEthBalance,
  USDC_ADDRESS 
} from './lib/uniswap-v4';
```

### Basic Swap Component

```tsx
import React, { useState } from 'react';
import { formatEther } from 'viem';
import { 
  useSwap, 
  useQuote, 
  useEthBalance, 
  useTokenBalance,
  USDC_ADDRESS 
} from './lib/uniswap-v4';

export function SwapWidget() {
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);

  // Real-time price quotes
  const { quote, isLoading: quoteLoading } = useQuote(amount, isBuying);
  
  // Balance tracking
  const ethBalance = useEthBalance();
  const tokenBalance = useTokenBalance(USDC_ADDRESS);
  
  // Swap execution
  const { executeSwap, isSwapping } = useSwap({
    onSwapSuccess: (result) => {
      console.log('✅ Swap successful!', result.hash);
      setAmount(''); // Clear input
    },
    onSwapError: (error) => {
      console.error('❌ Swap failed:', error);
    }
  });

  const handleSwap = async () => {
    const minAmountOut = quote?.amountOut 
      ? quote.amountOut * BigInt(90) / BigInt(100) // 10% slippage
      : BigInt(0);

    await executeSwap({
      tokenAddress: USDC_ADDRESS,
      amountIn: amount,
      minAmountOut,
      isBuying,
      slippagePercent: 10
    });
  };

  const currentBalance = isBuying ? ethBalance : tokenBalance;
  const hasInsufficientBalance = amount && 
    Number(amount) > Number(currentBalance.formattedBalance);

  return (
    <div className="swap-widget">
      <h2>{isBuying ? 'Buy' : 'Sell'} CONTENT Token</h2>
      
      {/* Trade Direction Toggle */}
      <div className="trade-toggle">
        <button 
          onClick={() => setIsBuying(true)}
          className={isBuying ? 'active' : ''}
        >
          Buy
        </button>
        <button 
          onClick={() => setIsBuying(false)}
          className={!isBuying ? 'active' : ''}
        >
          Sell
        </button>
      </div>

      {/* Amount Input */}
      <div className="input-section">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />
        <span>{isBuying ? 'ETH' : 'CONTENT'}</span>
      </div>

      {/* Expected Output */}
      <div className="output-section">
        <div>Expected Output:</div>
        <div>
          {quoteLoading ? '...' : 
           quote ? `${formatEther(quote.amountOut)} ${isBuying ? 'CONTENT' : 'ETH'}` : 
           '0.0'}
        </div>
      </div>

      {/* Balance Display */}
      <div className="balance">
        Balance: {currentBalance.isLoading ? '...' : 
                 `${currentBalance.formattedBalance} ${isBuying ? 'ETH' : 'CONTENT'}`}
      </div>

      {/* Swap Button */}
      <button 
        onClick={handleSwap}
        disabled={
          isSwapping || 
          !amount || 
          hasInsufficientBalance ||
          currentBalance.isLoading
        }
      >
        {isSwapping ? 'Swapping...' :
         hasInsufficientBalance ? 'Insufficient Balance' :
         isBuying ? 'Buy CONTENT' : 'Sell CONTENT'}
      </button>
    </div>
  );
}
```

## React Hooks API

### 🔄 Swap Hooks

#### `useSwap(options?)`

Main hook for executing swaps with comprehensive callback support.

```typescript
const { executeSwap, swapStatus, isSwapping, lastResult, reset } = useSwap({
  onSwapStart: (params) => console.log('Starting swap...', params),
  onSwapSuccess: (result) => console.log('Swap successful!', result.hash),
  onSwapError: (error) => console.error('Swap failed:', error),
  onStatusChange: (status) => console.log('Status:', status)
});

// Execute a swap
await executeSwap({
  tokenAddress: '0x90DD085b85600a66041500f2973066dd62e74900',
  amountIn: '1.0',
  minAmountOut: BigInt(900), // With slippage
  isBuying: true,
  slippagePercent: 10
});
```

**Parameters:**
- `options.onSwapStart?` - Called when swap begins
- `options.onSwapSuccess?` - Called on successful swap
- `options.onSwapError?` - Called on swap failure  
- `options.onStatusChange?` - Called on status updates

**Returns:**
- `executeSwap` - Function to execute swaps
- `swapStatus` - Current status (`PENDING` | `CONFIRMING` | `SUCCESS` | `FAILED`)
- `isSwapping` - Boolean indicating if swap is in progress
- `lastResult` - Result of the last swap attempt
- `reset` - Function to reset swap state

#### `useBuySwap(tokenAddress, options?)`

Specialized hook for ETH → Token swaps.

```typescript
const { executeBuy, isSwapping } = useBuySwap(USDC_ADDRESS, {
  onSwapSuccess: (result) => showToast('Buy successful!')
});

await executeBuy('1.0', BigInt(900), 10); // amount, minOut, slippage%
```

#### `useSellSwap(tokenAddress, options?)`

Specialized hook for Token → ETH swaps.

```typescript
const { executeSell, isSwapping } = useSellSwap(USDC_ADDRESS, {
  onSwapSuccess: (result) => showToast('Sell successful!')
});

await executeSell('1000', BigInt(900000000000000000), 10); // tokens, minETH, slippage%
```

### 💰 Quote Hooks

#### `useQuote(amountIn, isBuying, options?)`

Get real-time price quotes with auto-refresh capability.

```typescript
const { quote, isLoading, error, refetch, clear } = useQuote('1.0', true, {
  refreshInterval: 5000, // Refresh every 5 seconds
  enabled: true,
  onQuoteUpdate: (quote) => console.log('New quote:', quote),
  onError: (error) => console.error('Quote error:', error)
});

if (quote) {
  console.log('Expected output:', formatEther(quote.amountOut));
  console.log('Gas estimate:', quote.gasEstimate.toString());
}
```

**Parameters:**
- `amountIn` - Input amount as string (e.g., "1.0")
- `isBuying` - Direction: true for ETH→Token, false for Token→ETH
- `options.refreshInterval?` - Auto-refresh interval in ms (0 = disabled)
- `options.enabled?` - Whether to fetch quotes (default: true)
- `options.onQuoteUpdate?` - Called when quote updates
- `options.onError?` - Called on quote errors

**Returns:**
- `quote` - Latest quote result with `amountOut` and `gasEstimate`
- `isLoading` - Whether quote is being fetched
- `error` - Error message if quote failed
- `refetch` - Function to manually refresh quote
- `clear` - Function to clear current quote

#### `useBuyQuote(amountIn, options?)` & `useSellQuote(amountIn, options?)`

Direction-specific quote hooks.

```typescript
// Get buy quotes (ETH → CONTENT)
const buyQuote = useBuyQuote('1.0', { refreshInterval: 3000 });

// Get sell quotes (CONTENT → ETH)  
const sellQuote = useSellQuote('1000', { refreshInterval: 3000 });
```

#### `useQuoteStream(amountIn, isBuying, intervalMs?)`

Real-time streaming quotes with automatic updates.

```typescript
const { quote, isLoading } = useQuoteStream('1.0', true, 2000); // Update every 2s
```

#### `useQuoteComparison(amountIn, options?)`

Compare buy vs sell quotes to find the best rates.

```typescript
const { buyQuote, sellQuote, comparison, isLoading } = useQuoteComparison('1.0');

if (comparison) {
  console.log('Spread:', comparison.spreadPercent + '%');
  console.log('Better deal:', comparison.betterDeal); // 'buy' or 'sell'
}
```

### 💳 Balance Hooks

#### `useEthBalance(options?)`

Track ETH balance with auto-refresh.

```typescript
const { balance, formattedBalance, isLoading, error, refetch } = useEthBalance({
  refreshInterval: 10000, // Refresh every 10 seconds
  decimals: 4, // Format to 4 decimal places
  onBalanceUpdate: (balance) => console.log('New ETH balance:', balance)
});

console.log('ETH Balance:', formattedBalance); // "1.2345"
```

#### `useTokenBalance(tokenAddress, options?)`

Track ERC20 token balance.

```typescript
const tokenBalance = useTokenBalance(USDC_ADDRESS, {
  refreshInterval: 10000,
  decimals: 0, // Show whole tokens
  onBalanceUpdate: (balance) => console.log('New token balance:', balance)
});
```

#### `useBalances(tokenAddresses, options?)`

Track multiple token balances simultaneously.

```typescript
const { ethBalance, tokenBalances, isLoading, refetchAll } = useBalances([
  USDC_ADDRESS,
  '0xOtherTokenAddress'
], {
  refreshInterval: 15000
});
```

#### `useBalanceCheck(tokenAddress, amount)`

Check if user has sufficient balance for a transaction.

```typescript
const { hasInsufficientBalance, balanceStatus } = useBalanceCheck(
  USDC_ADDRESS, 
  '100'
);

// balanceStatus: 'loading' | 'error' | 'insufficient' | 'sufficient'
```

## Core Managers API

For advanced use cases or non-React environments, use the low-level managers directly.

### SwapManager

```typescript
import { SwapManager } from './lib/uniswap-v4';

const swapManager = new SwapManager(publicClient);
swapManager.setWalletClient(walletClient);

// Execute a buy swap
const result = await swapManager.executeBuySwap({
  tokenAddress: USDC_ADDRESS,
  amountIn: '1.0',
  minAmountOut: BigInt(900),
  isBuying: true,
  slippagePercent: 10
});

if (result.success) {
  console.log('Swap successful:', result.hash);
} else {
  console.error('Swap failed:', result.error);
}
```

### QuoteManager

```typescript
import { QuoteManager } from './lib/uniswap-v4';

const quoteManager = new QuoteManager(publicClient);

// Get a buy quote
const quote = await quoteManager.getBuyQuote('1.0');
if (quote) {
  console.log('Expected CONTENT tokens:', formatEther(quote.amountOut));
}

// Get a sell quote
const sellQuote = await quoteManager.getSellQuote('1000');
if (sellQuote) {
  console.log('Expected ETH:', formatEther(sellQuote.amountOut));
}

// Create a quote subscription for real-time updates
const unsubscribe = quoteManager.createQuoteSubscription(
  '1.0', 
  true, // isBuying
  (quote) => console.log('Quote update:', quote),
  5000 // 5 second interval
);

// Clean up when done
unsubscribe();
```

### TransactionBuilder

```typescript
import { TransactionBuilder } from './lib/uniswap-v4';

const txBuilder = new TransactionBuilder(publicClient);

// Build a transaction without executing
const transaction = await txBuilder.buildBuyTransaction(
  {
    tokenAddress: USDC_ADDRESS,
    amountIn: '1.0',
    minAmountOut: BigInt(900),
    isBuying: true,
    slippagePercent: 10
  },
  userAddress
);

console.log('Transaction data:', transaction.data);
console.log('Gas limit:', transaction.gasLimit);

// Just estimate gas
const gasEstimate = await txBuilder.estimateSwapGas(swapParams, userAddress);
```

## Types & Interfaces

### Core Types

```typescript
import type { 
  SwapParams,
  SwapResult,
  QuoteResult,
  PoolKey,
  PermitData,
  TradeType,
  SwapStatus
} from './lib/uniswap-v4';

// Swap parameters
interface SwapParams {
  tokenAddress: `0x${string}`;
  amountIn: string;
  minAmountOut: bigint;
  isBuying: boolean;
  slippagePercent?: number;
}

// Swap result
interface SwapResult {
  hash: `0x${string}`;
  success: boolean;
  error?: string;
  amountOut?: bigint;
}

// Quote result
interface QuoteResult {
  amountOut: bigint;
  gasEstimate: bigint;
}

// Trade direction
enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL'
}

// Swap status
enum SwapStatus {
  PENDING = 'PENDING',
  CONFIRMING = 'CONFIRMING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}
```

## Utilities

### Calculation Utilities

```typescript
import { 
  calculateMinAmountOut,
  parseAmount,
  calculateGasWithBuffer,
  createDeadline
} from './lib/uniswap-v4';

// Calculate slippage-protected minimum output
const minOut = calculateMinAmountOut(expectedOutput, 10); // 10% slippage

// Parse amount string to wei
const amountWei = parseAmount('1.5'); // Returns BigInt

// Add buffer to gas estimate
const gasWithBuffer = calculateGasWithBuffer(gasEstimate, 30); // 30% buffer

// Create transaction deadline
const deadline = createDeadline(30); // 30 minutes from now
```

### Encoding Utilities

```typescript
import { 
  encodeBuyCommands,
  encodeSwapParams,
  encodePermit2Data
} from './lib/uniswap-v4';

// Encode Universal Router commands
const buyCommands = encodeBuyCommands();
const swapParams = encodeSwapParams(poolKey, true, '1.0', BigInt(900));
```

## Contract Information

### Addresses (Base Network)

```typescript
import { 
  UNIVERSAL_ROUTER_ADDRESS,
  PERMIT2_ADDRESS,
  V4_QUOTER_ADDRESS,
  USDC_ADDRESS,
  ADDRESSES // Object with all addresses
} from './lib/uniswap-v4';

console.log('Universal Router:', UNIVERSAL_ROUTER_ADDRESS);
console.log('All addresses:', ADDRESSES);
```

### ABIs

```typescript
import { 
  ERC20_ABI,
  TOKEN_ABI,
  STATE_VIEW_ABI
} from './lib/uniswap-v4';

// Use with viem contracts
const contract = getContract({
  address: tokenAddress,
  abi: ERC20_ABI,
  publicClient
});
```

### Commands & Actions

```typescript
import { 
  V4_SWAP,
  PERMIT2_PERMIT,
  Actions,
  COMMANDS
} from './lib/uniswap-v4';

console.log('Swap command:', V4_SWAP); // 0x10
console.log('Available actions:', Actions);
```

## Error Handling

### Hook Error Handling

```typescript
const { executeSwap } = useSwap({
  onSwapError: (error) => {
    // Handle specific error types
    if (error.includes('insufficient')) {
      showToast('Insufficient balance');
    } else if (error.includes('slippage')) {
      showToast('Price impact too high');
    } else {
      showToast('Swap failed: ' + error);
    }
  }
});

// Quote errors
const { quote, error } = useQuote(amount, isBuying, {
  onError: (error) => {
    console.error('Quote failed:', error);
    // Fallback to cached quote or disable swap
  }
});
```

### Manager Error Handling

```typescript
try {
  const result = await swapManager.executeSwap(params, userAddress);
  if (!result.success) {
    throw new Error(result.error);
  }
} catch (error) {
  if (error.message.includes('User rejected')) {
    // User cancelled transaction
  } else if (error.message.includes('insufficient funds')) {
    // Not enough balance
  } else {
    // Other error
  }
}
```

## Best Practices

### 1. Always Use Slippage Protection

```typescript
// ❌ Bad: No slippage protection
const minAmountOut = BigInt(0);

// ✅ Good: 10% slippage protection
const minAmountOut = quote?.amountOut 
  ? calculateMinAmountOut(quote.amountOut, 10)
  : BigInt(0);
```

### 2. Handle Loading States

```typescript
// ✅ Show appropriate loading states
const { quote, isLoading: quoteLoading } = useQuote(amount, isBuying);
const { isSwapping } = useSwap();

return (
  <button disabled={quoteLoading || isSwapping}>
    {quoteLoading ? 'Getting quote...' :
     isSwapping ? 'Swapping...' :
     'Swap'}
  </button>
);
```

### 3. Validate Inputs

```typescript
// ✅ Validate before swapping
const isValidAmount = amount && Number(amount) > 0;
const hasBalance = !hasInsufficientBalance;
const hasQuote = !!quote;

const canSwap = isValidAmount && hasBalance && hasQuote && !isSwapping;
```

### 4. Use Error Boundaries

```typescript
// ✅ Wrap swap components in error boundaries
function SwapErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong with the swap widget</div>}
      onError={(error) => console.error('Swap widget error:', error)}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 5. Optimize Re-renders

```typescript
// ✅ Memoize expensive computations
const swapParams = useMemo(() => ({
  tokenAddress: USDC_ADDRESS,
  amountIn: amount,
  minAmountOut: calculateMinAmountOut(quote?.amountOut || BigInt(0), 10),
  isBuying,
  slippagePercent: 10
}), [amount, quote?.amountOut, isBuying]);

// ✅ Use callback for event handlers
const handleSwap = useCallback(async () => {
  await executeSwap(swapParams);
}, [executeSwap, swapParams]);
```

## Migration Guide

### From Manual Implementation

**Before:**
```typescript
// Multiple scattered imports
import { getPoolKey } from '../onchain/uniswap';
import { V4_QUOTER_ADDRESS } from '../contracts/addresses';
import { publicClient } from '../provider';
// + 10 more imports...

// Manual state management
const [quote, setQuote] = useState(null);
const [isLoading, setIsLoading] = useState(false);

// Manual quote fetching
const fetchQuote = async () => {
  setIsLoading(true);
  try {
    const result = await publicClient.simulateContract({
      address: V4_QUOTER_ADDRESS,
      abi: V4_QUOTER_ABI,
      functionName: 'quoteExactInputSingle',
      args: [params]
    });
    setQuote(result.result[0]);
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

**After:**
```typescript
// Single import
import { useQuote } from './lib/uniswap-v4';

// Declarative hook usage
const { quote, isLoading } = useQuote(amount, isBuying);
```

### From Other Libraries

The Uniswap V4 library provides a complete replacement for manual Uniswap integration:

- **Replaces**: Manual contract calls, transaction building, gas estimation
- **Provides**: Type-safe hooks, automatic error handling, real-time quotes
- **Benefits**: Reduced code, better UX, easier testing, future-proof

### Breaking Changes

None! The library maintains backward compatibility while providing modern APIs.

---

## 🎯 Quick Reference

| Use Case | Hook | Manager | Utility |
|----------|------|---------|---------|
| Execute swaps | `useSwap()` | `SwapManager` | - |
| Get price quotes | `useQuote()` | `QuoteManager` | - |
| Track balances | `useEthBalance()` | - | - |
| Calculate slippage | - | - | `calculateMinAmountOut()` |
| Build transactions | - | `TransactionBuilder` | `encodeBuyData()` |
| Stream real-time data | `useQuoteStream()` | `createQuoteSubscription()` | - |

**💡 Recommendation**: Use React hooks for UI components, managers for advanced logic, utilities for calculations.