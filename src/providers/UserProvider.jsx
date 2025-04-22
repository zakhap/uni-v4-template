import React, { createContext, useState, useEffect, useCallback } from "react";
import { getEthBalance, getTokenBalance, isNFTHolder } from "../lib/onchain/read";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { CONTENTMENT_COIN_ADDRESS } from "../lib/constants";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { address, isConnected } = useAccount();

  const [ethBalance, setEthBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [holdsNFT, setHoldsNFT] = useState(false);
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

      const tokenBalance = await getTokenBalance(CONTENTMENT_COIN_ADDRESS, address);
      setTokenBalance(formatEther(tokenBalance));

      const holdsNFT = await isNFTHolder(CONTENTMENT_COIN_ADDRESS, address);
      console.log("holdsNFT", holdsNFT);
      setHoldsNFT(holdsNFT);
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
