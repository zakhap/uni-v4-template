import React, { createContext, useState, useEffect, useCallback } from "react";
import { getEthBalance, getTokenBalance } from "../lib/onchain/read";
import { formatEther, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { USDC_ADDRESS } from "../lib/constants";

interface UserContextType {
  ethBalance: string;
  tokenBalance: string;
  loading: boolean;
}

export const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { address, isConnected } = useAccount();

  const [ethBalance, setEthBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [timeout, setTimeoutState] = useState<NodeJS.Timeout | null>(null);

  const loadUserBalance = useCallback(async () => {
    if (timeout) clearTimeout(timeout);

    // Start new timeout in 5 seconds
    setTimeoutState(setTimeout(loadUserBalance, 5000));

    if (!isConnected || !address) {
      setLoading(false);
      setEthBalance("0");
      setTokenBalance("0");
      return;
    }

    try {
      const ethBalance = await getEthBalance(address);
      setEthBalance(formatEther(ethBalance));

      const tokenBalance = await getTokenBalance(USDC_ADDRESS, address);
      // USDC has 6 decimals, not 18
      setTokenBalance(formatUnits(typeof tokenBalance === 'bigint' ? tokenBalance : BigInt(0), 6));
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    loadUserBalance();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [loadUserBalance]);

  return (
    <UserContext.Provider value={{ ethBalance, tokenBalance, loading }}>
      {children}
    </UserContext.Provider>
  );
};
