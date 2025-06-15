/**
 * Uniswap V4 Library - Public API
 * 
 * A comprehensive library for interacting with Uniswap V4 on Base network.
 * Provides both low-level managers and high-level React hooks for swap operations.
 */

// Core Managers
export { SwapManager } from './core/SwapManager';
export { QuoteManager } from './core/QuoteManager';
export { TransactionBuilder } from './core/TransactionBuilder';

// React Hooks
export { 
  useSwap, 
  useBuySwap, 
  useSellSwap 
} from './hooks/useSwap';

export { 
  useQuote, 
  useBuyQuote, 
  useSellQuote, 
  useQuoteStream,
  useQuoteComparison 
} from './hooks/useQuote';

export { 
  useTokenBalance, 
  useEthBalance, 
  useBalances,
  useBalanceCheck 
} from './hooks/useBalance';

// Types
export type {
  // Pool types
  PoolKey,
  PoolConfig,
  PoolState,
  PoolLiquidity,
  PoolMetadata,
  TickRange,
  PoolEvent,
  
  // Swap types
  SwapParams,
  SwapData,
  QuoteParams,
  QuoteResult,
  PermitData,
  SwapTransaction,
  SwapResult,
} from './types';

export { 
  TradeType, 
  SwapStatus,
  POOL_CONSTANTS 
} from './types';

// Contract Information
export {
  // Addresses
  UNIVERSAL_ROUTER_ADDRESS,
  PERMIT2_ADDRESS,
  V4_QUOTER_ADDRESS,
  POOL_MANAGER_ADDRESS,
  STATE_VIEW_ADDRESS,
  CONTENTMENT_COIN_ADDRESS,
  CONTENTMENT_HOOK_ADDRESS,
  ADDRESSES
} from './contracts/addresses';

export {
  // ABIs
  ERC20_ABI,
  TOKEN_ABI,
  STATE_VIEW_ABI,
  CONTENTMENT_COIN_ABI
} from './contracts/abis';

export {
  // Commands and Actions
  V4_SWAP,
  PERMIT2_PERMIT,
  Actions,
  COMMANDS
} from './contracts/commands';

// Utilities
export {
  // Encoding utilities
  encodeBuyCommands,
  encodeSellCommands,
  encodeSwapActions,
  encodeSwapParams,
  encodeSettleParams,
  encodeTakeParams,
  encodeRouterInputs,
  encodePermit2Data,
  encodePoolId
} from './utils/encoding';

export {
  // Calculation utilities
  calculateMinAmountOut,
  parseAmount,
  calculateGasWithBuffer,
  getSwapDirection,
  getSwapDirectionFromTradeType,
  createDeadline
} from './utils/calculations';

// Legacy exports for backward compatibility (these will be removed in future versions)
export { encodeBuyData, encodeSellData, getPoolKey, toId } from '../onchain/uniswap';