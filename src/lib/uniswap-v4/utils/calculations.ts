/**
 * Calculation utilities for Uniswap V4 swaps
 */

import { parseEther } from "viem";

/**
 * Calculates minimum amount out with slippage protection
 * @param expectedOutput - Expected output amount in wei
 * @param slippagePercent - Slippage percentage (e.g., 10 for 10%)
 * @returns Minimum amount out with slippage applied
 */
export function calculateMinAmountOut(
  expectedOutput: bigint, 
  slippagePercent: number = 10
): bigint {
  if (!expectedOutput || expectedOutput === BigInt(0)) {
    return BigInt(0);
  }
  
  // Calculate (100 - slippage)% of expected output
  const slippageFactor = BigInt(100 - slippagePercent);
  return (expectedOutput * slippageFactor) / BigInt(100);
}

/**
 * Parses amount string to wei with proper decimals
 * @param amount - Amount as string (e.g., "1.5")
 * @returns Amount in wei as bigint
 */
export function parseAmount(amount: string): bigint {
  return parseEther(amount);
}

/**
 * Calculates gas limit with safety buffer
 * @param gasEstimate - Base gas estimate
 * @param bufferPercent - Buffer percentage (e.g., 30 for 30%)
 * @returns Gas limit with buffer applied
 */
export function calculateGasWithBuffer(
  gasEstimate: bigint, 
  bufferPercent: number = 30
): bigint {
  const bufferFactor = BigInt(100 + bufferPercent);
  return (gasEstimate * bufferFactor) / BigInt(100);
}

/**
 * Determines swap direction based on trade type
 * @param isBuying - True if buying token with ETH, false if selling token for ETH
 * @returns zeroForOne boolean for Uniswap V4 swap direction
 */
export function getSwapDirection(isBuying: boolean): boolean {
  // For ETH->Token: zeroForOne = true (ETH is currency0)
  // For Token->ETH: zeroForOne = false (ETH is currency0)
  return isBuying;
}

/**
 * Creates a transaction deadline timestamp
 * @param minutesFromNow - Minutes to add to current time
 * @returns Deadline as bigint timestamp
 */
export function createDeadline(minutesFromNow: number = 30): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + (minutesFromNow * 60));
}