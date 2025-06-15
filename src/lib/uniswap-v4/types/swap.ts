/**
 * Swap-related type definitions for Uniswap V4
 */

// Swap direction and parameters
export interface SwapParams {
  /** Token address being swapped */
  tokenAddress: `0x${string}`;
  /** Amount to swap (as string, e.g. "1.5") */
  amountIn: string;
  /** Minimum amount out with slippage protection */
  minAmountOut: bigint;
  /** True for buying (ETH->Token), false for selling (Token->ETH) */
  isBuying: boolean;
  /** Slippage tolerance percentage (e.g., 10 for 10%) */
  slippagePercent?: number;
}

// Result of swap data encoding
export interface SwapData {
  /** Encoded Universal Router commands */
  commands: `0x${string}`;
  /** Encoded input parameters */
  inputs: `0x${string}`[];
  /** ETH value to send with transaction */
  value: bigint;
}

// Quote parameters for price estimation
export interface QuoteParams {
  /** Pool key configuration */
  poolKey: {
    currency0: `0x${string}`;
    currency1: `0x${string}`;
    fee: number;
    tickSpacing: number;
    hooks: `0x${string}`;
  };
  /** Swap direction (true for currency0->currency1) */
  zeroForOne: boolean;
  /** Exact input amount in wei */
  exactAmount: bigint;
  /** Hook data (usually empty) */
  hookData: `0x${string}`;
}

// Quote result from V4 Quoter
export interface QuoteResult {
  /** Expected output amount */
  amountOut: bigint;
  /** Gas estimate for the swap */
  gasEstimate: bigint;
}

// Permit2 signature data
export interface PermitData {
  /** EIP-712 signature */
  signature: `0x${string}`;
  /** Permit details */
  details: {
    /** Token being permitted */
    token: `0x${string}`;
    /** Amount being permitted */
    amount: bigint;
    /** Permit expiration timestamp */
    expiration: number;
    /** Nonce for replay protection */
    nonce: number;
  };
  /** Signature deadline */
  sigDeadline: bigint;
}

// Swap transaction parameters
export interface SwapTransaction {
  /** Target contract address */
  to: `0x${string}`;
  /** Transaction data */
  data: `0x${string}`;
  /** ETH value to send */
  value: bigint;
  /** Gas limit */
  gasLimit: bigint;
}

// Swap execution result
export interface SwapResult {
  /** Transaction hash */
  hash: `0x${string}`;
  /** Was swap successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Actual amount received */
  amountOut?: bigint;
}

// Trade type enum
export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL'
}

// Swap status enum
export enum SwapStatus {
  PENDING = 'PENDING',
  CONFIRMING = 'CONFIRMING', 
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}