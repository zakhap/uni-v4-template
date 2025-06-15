/**
 * TransactionBuilder - Builds transaction objects for Uniswap V4 swaps
 */

import { PublicClient, parseEther, encodeFunctionData } from "viem";
import { encodeBuyData, encodeSellData } from "../../onchain/uniswap";
import { UNIVERSAL_ROUTER_ADDRESS } from "../contracts/addresses";
import { calculateMinAmountOut, calculateGasWithBuffer, createDeadline } from "../utils/calculations";
import { 
  SwapParams, 
  SwapData, 
  SwapTransaction, 
  PermitData 
} from "../types";

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

export class TransactionBuilder {
  private publicClient: PublicClient;

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient;
  }

  /**
   * Builds a buy transaction (ETH -> Token)
   */
  async buildBuyTransaction(
    params: SwapParams, 
    userAddress: `0x${string}`
  ): Promise<SwapTransaction> {
    const minAmountOut = calculateMinAmountOut(params.minAmountOut, params.slippagePercent);
    const { commands, inputs, value } = encodeBuyData(
      params.tokenAddress, 
      params.amountIn, 
      minAmountOut
    );

    const deadline = createDeadline();

    // Estimate gas
    const gasEstimate = await this.publicClient.estimateContractGas({
      address: UNIVERSAL_ROUTER_ADDRESS,
      abi: UNIVERSAL_ROUTER_ABI,
      functionName: "execute",
      args: [commands, inputs, deadline],
      value,
      account: userAddress
    });

    const gasLimit = calculateGasWithBuffer(gasEstimate);

    // Encode transaction data
    const data = encodeFunctionData({
      abi: UNIVERSAL_ROUTER_ABI,
      functionName: "execute",
      args: [commands, inputs, deadline]
    });

    return {
      to: UNIVERSAL_ROUTER_ADDRESS,
      data,
      value,
      gasLimit
    };
  }

  /**
   * Builds a sell transaction (Token -> ETH) with Permit2
   */
  async buildSellTransaction(
    params: SwapParams, 
    permit: PermitData,
    userAddress: `0x${string}`
  ): Promise<SwapTransaction> {
    const minAmountOut = calculateMinAmountOut(params.minAmountOut, params.slippagePercent);
    const { commands, inputs, value } = encodeSellData(
      params.tokenAddress, 
      params.amountIn, 
      permit, 
      minAmountOut
    );

    const deadline = createDeadline();

    // Try to estimate gas, fallback to high limit if it fails
    let gasLimit: bigint;
    try {
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [commands, inputs, deadline],
        value,
        account: userAddress
      });
      gasLimit = calculateGasWithBuffer(gasEstimate);
    } catch {
      // Fallback to high gas limit if estimation fails
      gasLimit = BigInt(3000000);
    }

    // Encode transaction data
    const data = encodeFunctionData({
      abi: UNIVERSAL_ROUTER_ABI,
      functionName: "execute",
      args: [commands, inputs, deadline]
    });

    return {
      to: UNIVERSAL_ROUTER_ADDRESS,
      data,
      value,
      gasLimit
    };
  }

  /**
   * Builds a swap transaction based on trade direction
   */
  async buildSwapTransaction(
    params: SwapParams,
    userAddress: `0x${string}`,
    permit?: PermitData
  ): Promise<SwapTransaction> {
    if (params.isBuying) {
      return this.buildBuyTransaction(params, userAddress);
    } else {
      if (!permit) {
        throw new Error("Permit data required for sell transactions");
      }
      return this.buildSellTransaction(params, permit, userAddress);
    }
  }

  /**
   * Estimates gas for a swap without building the full transaction
   */
  async estimateSwapGas(
    params: SwapParams,
    userAddress: `0x${string}`,
    permit?: PermitData
  ): Promise<bigint> {
    const minAmountOut = calculateMinAmountOut(params.minAmountOut, params.slippagePercent);
    
    let swapData: SwapData;
    if (params.isBuying) {
      swapData = encodeBuyData(params.tokenAddress, params.amountIn, minAmountOut);
    } else {
      if (!permit) {
        throw new Error("Permit data required for sell gas estimation");
      }
      swapData = encodeSellData(params.tokenAddress, params.amountIn, permit, minAmountOut);
    }

    const deadline = createDeadline();

    try {
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [swapData.commands, swapData.inputs, deadline],
        value: swapData.value,
        account: userAddress
      });

      return calculateGasWithBuffer(gasEstimate);
    } catch {
      // Return high gas limit if estimation fails
      return BigInt(3000000);
    }
  }

  /**
   * Validates transaction parameters before building
   */
  validateSwapParams(params: SwapParams): void {
    if (!params.tokenAddress || params.tokenAddress === "0x") {
      throw new Error("Invalid token address");
    }
    
    if (!params.amountIn || Number(params.amountIn) <= 0) {
      throw new Error("Invalid amount input");
    }

    if (params.minAmountOut < 0) {
      throw new Error("Invalid minimum amount out");
    }

    if (params.slippagePercent && (params.slippagePercent < 0 || params.slippagePercent > 100)) {
      throw new Error("Invalid slippage percentage");
    }
  }
}