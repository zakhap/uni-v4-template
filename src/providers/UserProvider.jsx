import React, { createContext, useState, useEffect, useCallback } from "react";
import { getEthBalance, getTokenBalance } from "../lib/onchain/read";
import { formatEther, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { USDC_ADDRESS } from "../lib/constants";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { address, isConnected } = useAccount();

  const [ethBalance, setEthBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [timeout, setTimeoutState] = useState(null);

  const loadUserBalance = useCallback(async () => {
    clearTimeout(timeout);

    // Start new timeout in 5 seconds
    setTimeoutState(setTimeout(loadUserBalance, 5000));

    if (!isConnected || !address) {
      setLoading(false);
      setEthBalance(0);
      setTokenBalance(0);
      return;
    }

    try {
      const ethBalance = await getEthBalance(address);
      setEthBalance(formatEther(ethBalance));

      const tokenBalance = await getTokenBalance(USDC_ADDRESS, address);
      // USDC has 6 decimals, not 18
      setTokenBalance(formatUnits(tokenBalance, 6));
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    loadUserBalance();

    return () => {
      clearTimeout(timeout);
    };
  }, [loadUserBalance]);

  return (
    <UserContext.Provider value={{ ethBalance, tokenBalance, loading }}>
      {children}
    </UserContext.Provider>
  );
};
