/**
 * Pool-related type definitions for Uniswap V4
 */

// Core pool key structure
export interface PoolKey {
  /** First currency in the pair (typically ETH = 0x0000...) */
  currency0: `0x${string}`;
  /** Second currency in the pair */
  currency1: `0x${string}`;
  /** Fee tier (0 for 0%, 500 for 0.05%, 3000 for 0.3%, etc.) */
  fee: number;
  /** Spacing between ticks */
  tickSpacing: number;
  /** Hook contract address */
  hooks: `0x${string}`;
}

// Pool configuration for creation
export interface PoolConfig {
  /** Token A address */
  tokenA: `0x${string}`;
  /** Token B address */
  tokenB: `0x${string}`;
  /** Fee percentage in basis points */
  feeBps: number;
  /** Tick spacing for price ranges */
  tickSpacing: number;
  /** Optional hook contract */
  hookAddress?: `0x${string}`;
  /** Initial price (sqrt price X96) */
  initialPrice?: bigint;
}

// Pool state information
export interface PoolState {
  /** Current sqrt price X96 */
  sqrtPriceX96: bigint;
  /** Current tick */
  tick: number;
  /** Protocol fee */
  protocolFee: number;
  /** LP fee */
  lpFee: number;
}

// Pool liquidity information
export interface PoolLiquidity {
  /** Total liquidity in the pool */
  liquidity: bigint;
  /** Token 0 reserves */
  reserve0: bigint;
  /** Token 1 reserves */
  reserve1: bigint;
}

// Pool metadata
export interface PoolMetadata {
  /** Pool ID (keccak256 hash of pool key) */
  poolId: `0x${string}`;
  /** Pool key */
  poolKey: PoolKey;
  /** Token 0 symbol */
  token0Symbol: string;
  /** Token 1 symbol */
  token1Symbol: string;
  /** Pool creation block */
  createdAtBlock?: number;
  /** Pool creation timestamp */
  createdAt?: number;
}

// Tick range for liquidity positions
export interface TickRange {
  /** Lower tick boundary */
  tickLower: number;
  /** Upper tick boundary */
  tickUpper: number;
}

// Pool events
export interface PoolEvent {
  /** Event type */
  type: 'swap' | 'mint' | 'burn' | 'collect';
  /** Block number */
  blockNumber: number;
  /** Transaction hash */
  transactionHash: `0x${string}`;
  /** Event timestamp */
  timestamp: number;
  /** Event-specific data */
  data: Record<string, any>;
}

// Pool constants
export const POOL_CONSTANTS = {
  /** Maximum tick value */
  MAX_TICK: 887272,
  /** Minimum tick value */
  MIN_TICK: -887272,
  /** Q96 constant for sqrt price calculations */
  Q96: 2n ** 96n,
  /** Zero address for ETH */
  ETH_ADDRESS: '0x0000000000000000000000000000000000000000' as const,
} as const;