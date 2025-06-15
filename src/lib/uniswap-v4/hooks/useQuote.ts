/**
 * useQuote - React hook for Uniswap V4 price quoting
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuoteManager } from '../core/QuoteManager';
import { publicClient } from '../../onchain/provider';
import { QuoteResult } from '../types';

interface UseQuoteReturn {
  /** Current quote result */
  quote: QuoteResult | null;
  /** Whether a quote is being fetched */
  isLoading: boolean;
  /** Quote error if any */
  error: string | null;
  /** Manually refresh the quote */
  refetch: () => Promise<void>;
  /** Clear current quote */
  clear: () => void;
}

interface UseQuoteOptions {
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Whether to fetch quote immediately */
  enabled?: boolean;
  /** Callback fired when quote updates */
  onQuoteUpdate?: (quote: QuoteResult | null) => void;
  /** Callback fired when quote error occurs */
  onError?: (error: string) => void;
}

/**
 * Hook for getting price quotes
 */
export function useQuote(
  amountIn: string,
  isBuying: boolean,
  options: UseQuoteOptions = {}
): UseQuoteReturn {
  const {
    refreshInterval = 0,
    enabled = true,
    onQuoteUpdate,
    onError
  } = options;

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize quote manager
  const quoteManager = useMemo(() => new QuoteManager(publicClient as any), []);

  // Fetch quote function
  const fetchQuote = useCallback(async () => {
    if (!amountIn || Number(amountIn) <= 0 || !enabled) {
      setQuote(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await quoteManager.getSwapQuote(amountIn, isBuying);
      setQuote(result);
      onQuoteUpdate?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
      setError(errorMessage);
      setQuote(null);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [amountIn, isBuying, enabled, quoteManager, onQuoteUpdate, onError]);

  // Effect for initial fetch and dependency changes
  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Effect for auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && enabled && amountIn && Number(amountIn) > 0) {
      const interval = setInterval(fetchQuote, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchQuote, refreshInterval, enabled, amountIn]);

  // Clear function
  const clear = useCallback(() => {
    setQuote(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    quote,
    isLoading,
    error,
    refetch: fetchQuote,
    clear
  };
}

/**
 * Specialized hook for buy quotes (ETH -> Token)
 */
export function useBuyQuote(
  amountIn: string,
  options: UseQuoteOptions = {}
): UseQuoteReturn {
  return useQuote(amountIn, true, options);
}

/**
 * Specialized hook for sell quotes (Token -> ETH)
 */
export function useSellQuote(
  amountIn: string,
  options: UseQuoteOptions = {}
): UseQuoteReturn {
  return useQuote(amountIn, false, options);
}

/**
 * Hook that provides real-time quote streaming
 */
export function useQuoteStream(
  amountIn: string,
  isBuying: boolean,
  intervalMs: number = 5000
): UseQuoteReturn {
  return useQuote(amountIn, isBuying, {
    refreshInterval: intervalMs,
    enabled: true
  });
}

/**
 * Hook for comparing quotes between buy and sell
 */
export function useQuoteComparison(amountIn: string, options: UseQuoteOptions = {}) {
  const buyQuote = useBuyQuote(amountIn, options);
  const sellQuote = useSellQuote(amountIn, options);

  const comparison = useMemo(() => {
    if (!buyQuote.quote || !sellQuote.quote) {
      return null;
    }

    const buyOutput = buyQuote.quote.amountOut;
    const sellOutput = sellQuote.quote.amountOut;
    const spread = buyOutput > sellOutput ? buyOutput - sellOutput : sellOutput - buyOutput;
    const spreadPercent = Number((spread * BigInt(10000) / buyOutput)) / 100;

    return {
      buyQuote: buyQuote.quote,
      sellQuote: sellQuote.quote,
      spread,
      spreadPercent,
      betterDeal: buyOutput > sellOutput ? 'buy' : 'sell'
    };
  }, [buyQuote.quote, sellQuote.quote]);

  return {
    buyQuote,
    sellQuote,
    comparison,
    isLoading: buyQuote.isLoading || sellQuote.isLoading,
    error: buyQuote.error || sellQuote.error
  };
}