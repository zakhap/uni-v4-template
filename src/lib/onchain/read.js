import { publicClient } from "./provider";
import { ERC20_ABI } from "../uniswap-v4";

export async function getTokenBalance(tokenAddress, userAddress) {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    });

    return balance;
  } catch (error) {
    console.error(`Error getting balance for token ${tokenAddress}:`, error);
    return 0;
  }
}

export async function getEthBalance(userAddress) {
  try {
    const balance = await publicClient.getBalance({
      address: userAddress,
    });

    return balance;
  } catch (error) {
    console.error(`Error getting ETH balance for address ${userAddress}:`, error);
    return 0n;
  }
}

// Removed isNFTHolder function - not needed for ETH/USDC demo

