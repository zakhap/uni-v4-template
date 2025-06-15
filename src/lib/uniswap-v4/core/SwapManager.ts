/**
 * SwapManager - Orchestrates all swap operations for Uniswap V4
 */

import { PublicClient, WalletClient, parseEther } from "viem";
import { encodeBuyData, encodeSellData, getPoolKey } from "../../onchain/uniswap";
import { UNIVERSAL_ROUTER_ADDRESS, PERMIT2_ADDRESS, CONTENTMENT_COIN_ADDRESS } from "../contracts/addresses";
import { calculateMinAmountOut, calculateGasWithBuffer, createDeadline } from "../utils/calculations";
import { 
  SwapParams, 
  SwapData, 
  SwapResult, 
  PermitData, 
  TradeType, 
  SwapStatus 
} from "../types";

// Permit2 ABI for nonce function
const PERMIT2_ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [
      { internalType: "uint160", name: "amount", type: "uint160" },
      { internalType: "uint48", name: "expiration", type: "uint48" },
      { internalType: "uint48", name: "nonce", type: "uint48" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Universal Router ABI for execute function
const UNIVERSAL_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "bytes", name: "commands", type: "bytes" },
      { internalType: "bytes[]", name: "inputs", type: "bytes[]" },
      { internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

export class SwapManager {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient;
  }

  /**
   * Sets the wallet client for transaction signing
   */
  setWalletClient(walletClient: WalletClient): void {
    this.walletClient = walletClient;
  }

  /**
   * Validates chain and wallet before executing swaps
   */
  private async validateSwapPreconditions(): Promise<void> {
    if (!this.walletClient) {
      throw new Error("No wallet connected");
    }

    const currentChain = await this.walletClient.getChainId();
    if (currentChain !== 8453) {
      throw new Error("Please switch to the Base network");
    }
  }

  /**
   * Executes a buy swap (ETH -> Token)
   */
  async executeBuySwap(params: SwapParams): Promise<SwapResult> {
    try {
      await this.validateSwapPreconditions();
      
      const minAmountOut = calculateMinAmountOut(params.minAmountOut, params.slippagePercent);
      const { commands, inputs, value } = encodeBuyData(
        params.tokenAddress, 
        params.amountIn, 
        minAmountOut
      );

      // Estimate gas
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [commands, inputs, createDeadline()],
        value,
        account: await this.walletClient!.getAddresses().then(addresses => addresses[0])
      });

      const gasLimit = calculateGasWithBuffer(gasEstimate);

      // Execute transaction
      const hash = await this.walletClient!.writeContract({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [commands, inputs, createDeadline()],
        gas: gasLimit,
        value,
      } as any);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        hash,
        success: receipt.status === "success",
        error: receipt.status !== "success" ? "Transaction failed" : undefined
      };

    } catch (error) {
      return {
        hash: "0x0" as `0x${string}`,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Executes a sell swap (Token -> ETH) with Permit2
   */
  async executeSellSwap(params: SwapParams, userAddress: `0x${string}`): Promise<SwapResult> {
    try {
      await this.validateSwapPreconditions();

      // Get current nonce from Permit2 contract
      const [, , nonce] = await this.publicClient.readContract({
        address: PERMIT2_ADDRESS,
        abi: PERMIT2_ABI,
        functionName: "allowance",
        args: [userAddress, CONTENTMENT_COIN_ADDRESS, UNIVERSAL_ROUTER_ADDRESS],
      });

      // Create permit signature
      const deadline = createDeadline(10); // 10 minutes
      const permitMessage = {
        details: {
          token: CONTENTMENT_COIN_ADDRESS,
          amount: parseEther(params.amountIn),
          expiration: deadline,
          nonce,
        },
        spender: UNIVERSAL_ROUTER_ADDRESS,
        sigDeadline: deadline,
      };

      const signature = await this.walletClient!.signTypedData({
        domain: {
          name: 'Permit2',
          chainId: 8453, // Base chain ID
          verifyingContract: PERMIT2_ADDRESS,
        },
        types: {
          PermitSingle: [
            { name: 'details', type: 'PermitDetails' },
            { name: 'spender', type: 'address' },
            { name: 'sigDeadline', type: 'uint256' },
          ],
          PermitDetails: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint160' },
            { name: 'expiration', type: 'uint48' },
            { name: 'nonce', type: 'uint48' },
          ],
        },
        primaryType: 'PermitSingle',
        message: permitMessage,
      } as any);

      const permit: PermitData = {
        signature,
        details: {
          token: CONTENTMENT_COIN_ADDRESS,
          amount: parseEther(params.amountIn),
          expiration: Number(deadline),
          nonce: Number(nonce)
        },
        sigDeadline: deadline
      };

      const minAmountOut = calculateMinAmountOut(params.minAmountOut, params.slippagePercent);
      const { commands, inputs, value } = encodeSellData(
        params.tokenAddress, 
        params.amountIn, 
        permit, 
        minAmountOut
      );

      // Try to estimate gas, fallback to high limit if it fails
      let gasLimit: bigint;
      try {
        const gasEstimate = await this.publicClient.estimateContractGas({
          address: UNIVERSAL_ROUTER_ADDRESS,
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, createDeadline()],
          value,
          account: userAddress
        });
        gasLimit = calculateGasWithBuffer(gasEstimate);
      } catch {
        // Fallback to high gas limit if estimation fails
        gasLimit = BigInt(3000000);
      }

      // Execute transaction
      const hash = await this.walletClient!.writeContract({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [commands, inputs, createDeadline()],
        gas: gasLimit,
        value,
      } as any);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        hash,
        success: receipt.status === "success",
        error: receipt.status !== "success" ? "Transaction failed" : undefined
      };

    } catch (error) {
      return {
        hash: "0x0" as `0x${string}`,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Main swap execution method that routes to buy or sell
   */
  async executeSwap(params: SwapParams, userAddress: `0x${string}`): Promise<SwapResult> {
    if (params.isBuying) {
      return this.executeBuySwap(params);
    } else {
      return this.executeSellSwap(params, userAddress);
    }
  }
}