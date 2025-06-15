/**
 * useSwap - React hook for executing Uniswap V4 swaps
 */

import { useState, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { getWalletClient, publicClient } from '../../onchain/provider';
import { SwapManager } from '../core/SwapManager';
import { 
  SwapParams, 
  SwapResult, 
  SwapStatus,
  TradeType 
} from '../types';

interface UseSwapReturn {
  /** Execute a swap transaction */
  executeSwap: (params: SwapParams) => Promise<SwapResult>;
  /** Current swap status */
  swapStatus: SwapStatus;
  /** Whether a swap is currently in progress */
  isSwapping: boolean;
  /** Last swap result */
  lastResult: SwapResult | null;
  /** Reset swap state */
  reset: () => void;
}

interface UseSwapOptions {
  /** Callback fired when swap starts */
  onSwapStart?: (params: SwapParams) => void;
  /** Callback fired when swap succeeds */
  onSwapSuccess?: (result: SwapResult) => void;
  /** Callback fired when swap fails */
  onSwapError?: (error: string) => void;
  /** Callback fired when swap status changes */
  onStatusChange?: (status: SwapStatus) => void;
}

export function useSwap(options: UseSwapOptions = {}): UseSwapReturn {
  const { address } = useAccount();
  const [swapStatus, setSwapStatus] = useState<SwapStatus>(SwapStatus.PENDING);
  const [lastResult, setLastResult] = useState<SwapResult | null>(null);

  // Initialize swap manager
  const swapManager = useMemo(() => new SwapManager(publicClient as any), []);

  // Derived state
  const isSwapping = swapStatus === SwapStatus.CONFIRMING;

  // Update status and fire callback
  const updateStatus = useCallback((status: SwapStatus) => {
    setSwapStatus(status);
    options.onStatusChange?.(status);
  }, [options.onStatusChange]);

  // Execute swap function
  const executeSwap = useCallback(async (params: SwapParams): Promise<SwapResult> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Update status to confirming
      updateStatus(SwapStatus.CONFIRMING);
      options.onSwapStart?.(params);

      // Get wallet client
      const walletClient = await getWalletClient();
      if (!walletClient) {
        throw new Error('Failed to get wallet client');
      }

      // Set wallet client for swap manager
      swapManager.setWalletClient(walletClient);

      // Execute the swap
      const result = await swapManager.executeSwap(params, address);
      setLastResult(result);

      if (result.success) {
        updateStatus(SwapStatus.SUCCESS);
        options.onSwapSuccess?.(result);
      } else {
        updateStatus(SwapStatus.FAILED);
        options.onSwapError?.(result.error || 'Swap failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failedResult: SwapResult = {
        hash: '0x0' as `0x${string}`,
        success: false,
        error: errorMessage
      };

      setLastResult(failedResult);
      updateStatus(SwapStatus.FAILED);
      options.onSwapError?.(errorMessage);

      return failedResult;
    }
  }, [address, swapManager, updateStatus, options]);

  // Reset function
  const reset = useCallback(() => {
    setSwapStatus(SwapStatus.PENDING);
    setLastResult(null);
  }, []);

  return {
    executeSwap,
    swapStatus,
    isSwapping,
    lastResult,
    reset
  };
}

/**
 * Specialized hook for buy swaps (ETH -> Token)
 */
export function useBuySwap(tokenAddress: `0x${string}`, options: UseSwapOptions = {}) {
  const baseSwap = useSwap(options);

  const executeBuy = useCallback(
    async (amountIn: string, minAmountOut: bigint, slippagePercent: number = 10) => {
      const params: SwapParams = {
        tokenAddress,
        amountIn,
        minAmountOut,
        isBuying: true,
        slippagePercent
      };

      return baseSwap.executeSwap(params);
    },
    [baseSwap.executeSwap, tokenAddress]
  );

  return {
    ...baseSwap,
    executeBuy
  };
}

/**
 * Specialized hook for sell swaps (Token -> ETH)
 */
export function useSellSwap(tokenAddress: `0x${string}`, options: UseSwapOptions = {}) {
  const baseSwap = useSwap(options);

  const executeSell = useCallback(
    async (amountIn: string, minAmountOut: bigint, slippagePercent: number = 10) => {
      const params: SwapParams = {
        tokenAddress,
        amountIn,
        minAmountOut,
        isBuying: false,
        slippagePercent
      };

      return baseSwap.executeSwap(params);
    },
    [baseSwap.executeSwap, tokenAddress]
  );

  return {
    ...baseSwap,
    executeSell
  };
}