/**
 * useBalance - React hook for token and ETH balance management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { getTokenBalance, getEthBalance } from '../../onchain/read';

interface UseBalanceReturn {
  /** Balance in wei */
  balance: bigint;
  /** Formatted balance as string */
  formattedBalance: string;
  /** Whether balance is being fetched */
  isLoading: boolean;
  /** Balance error if any */
  error: string | null;
  /** Manually refresh the balance */
  refetch: () => Promise<void>;
}

interface UseBalanceOptions {
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Whether to fetch balance immediately */
  enabled?: boolean;
  /** Number of decimal places for formatting */
  decimals?: number;
  /** Callback fired when balance updates */
  onBalanceUpdate?: (balance: bigint) => void;
  /** Callback fired when balance error occurs */
  onError?: (error: string) => void;
}

/**
 * Hook for getting token balance
 */
export function useTokenBalance(
  tokenAddress: `0x${string}`,
  options: UseBalanceOptions = {}
): UseBalanceReturn {
  const { address } = useAccount();
  const {
    refreshInterval = 0,
    enabled = true,
    decimals = 4,
    onBalanceUpdate,
    onError
  } = options;

  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance function
  const fetchBalance = useCallback(async () => {
    if (!address || !enabled) {
      setBalance(BigInt(0));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getTokenBalance(tokenAddress, address);
      const balanceAsBigInt = typeof result === 'bigint' ? result : BigInt(result || 0);
      setBalance(balanceAsBigInt);
      onBalanceUpdate?.(balanceAsBigInt);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get token balance';
      setError(errorMessage);
      setBalance(BigInt(0));
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, tokenAddress, enabled, onBalanceUpdate, onError]);

  // Effect for initial fetch and dependency changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Effect for auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && enabled && address) {
      const interval = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, refreshInterval, enabled, address]);

  // Formatted balance
  const formattedBalance = useMemo(() => {
    return Number(formatEther(balance)).toFixed(decimals);
  }, [balance, decimals]);

  return {
    balance,
    formattedBalance,
    isLoading,
    error,
    refetch: fetchBalance
  };
}

/**
 * Hook for getting ETH balance
 */
export function useEthBalance(options: UseBalanceOptions = {}): UseBalanceReturn {
  const { address } = useAccount();
  const {
    refreshInterval = 0,
    enabled = true,
    decimals = 4,
    onBalanceUpdate,
    onError
  } = options;

  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance function
  const fetchBalance = useCallback(async () => {
    if (!address || !enabled) {
      setBalance(BigInt(0));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getEthBalance(address);
      const balanceAsBigInt = typeof result === 'bigint' ? result : BigInt(result || 0);
      setBalance(balanceAsBigInt);
      onBalanceUpdate?.(balanceAsBigInt);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get ETH balance';
      setError(errorMessage);
      setBalance(BigInt(0));
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, enabled, onBalanceUpdate, onError]);

  // Effect for initial fetch and dependency changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Effect for auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && enabled && address) {
      const interval = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, refreshInterval, enabled, address]);

  // Formatted balance
  const formattedBalance = useMemo(() => {
    return Number(formatEther(balance)).toFixed(decimals);
  }, [balance, decimals]);

  return {
    balance,
    formattedBalance,
    isLoading,
    error,
    refetch: fetchBalance
  };
}

/**
 * Hook for getting multiple balances at once
 */
export function useBalances(
  tokenAddresses: `0x${string}`[],
  options: UseBalanceOptions = {}
) {
  const ethBalance = useEthBalance(options);
  
  // Get token balances for each address - use a stable key approach
  const tokenBalance1 = useTokenBalance(tokenAddresses[0] || '0x0', { ...options, enabled: tokenAddresses.length > 0 });
  const tokenBalance2 = useTokenBalance(tokenAddresses[1] || '0x0', { ...options, enabled: tokenAddresses.length > 1 });
  const tokenBalance3 = useTokenBalance(tokenAddresses[2] || '0x0', { ...options, enabled: tokenAddresses.length > 2 });

  const tokenBalances = useMemo(() => {
    const balances = [];
    if (tokenAddresses.length > 0) balances.push(tokenBalance1);
    if (tokenAddresses.length > 1) balances.push(tokenBalance2);
    if (tokenAddresses.length > 2) balances.push(tokenBalance3);
    return balances;
  }, [tokenAddresses.length, tokenBalance1, tokenBalance2, tokenBalance3]);

  // Combined loading state
  const isLoading = ethBalance.isLoading || tokenBalances.some(b => b.isLoading);
  
  // Combined error state
  const error = ethBalance.error || tokenBalances.find(b => b.error)?.error || null;

  // Refetch all balances
  const refetchAll = useCallback(async () => {
    await Promise.all([
      ethBalance.refetch(),
      ...tokenBalances.map(b => b.refetch())
    ]);
  }, [ethBalance, tokenBalances]);

  return {
    ethBalance,
    tokenBalances,
    isLoading,
    error,
    refetchAll
  };
}

/**
 * Hook that checks if user has sufficient balance for a transaction
 */
export function useBalanceCheck(
  tokenAddress: `0x${string}` | 'ETH',
  amount: string
) {
  const ethBalance = useEthBalance({ enabled: tokenAddress === 'ETH' });
  const tokenBalance = useTokenBalance(
    tokenAddress as `0x${string}`, 
    { enabled: tokenAddress !== 'ETH' }
  );

  const balance = tokenAddress === 'ETH' ? ethBalance : tokenBalance;
  
  const hasInsufficientBalance = useMemo(() => {
    if (!amount || Number(amount) <= 0) return false;
    
    try {
      const amountWei = BigInt(Math.floor(Number(amount) * 1e18));
      return balance.balance < amountWei;
    } catch {
      return false;
    }
  }, [balance.balance, amount]);

  const balanceStatus = useMemo(() => {
    if (balance.isLoading) return 'loading';
    if (balance.error) return 'error';
    if (hasInsufficientBalance) return 'insufficient';
    return 'sufficient';
  }, [balance.isLoading, balance.error, hasInsufficientBalance]);

  return {
    ...balance,
    hasInsufficientBalance,
    balanceStatus
  };
}