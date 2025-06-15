import { publicClient } from "./provider";
import { ERC20_ABI } from "../uniswap-v4/contracts/abis";

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

export async function isNFTHolder(tokenAddress, userAddress) {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [
            { name: "account", type: "address" },
            { name: "id", type: "uint256" }
          ],
          name: "balanceOf",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        }
      ],
      functionName: "balanceOf",
      args: [userAddress, 1n],
    });

    return balance > 0;
  } catch (error) {
    console.error(`Error checking if user ${userAddress} is an NFT holder of ${tokenAddress}:`, error);
    return false;
  }
}

