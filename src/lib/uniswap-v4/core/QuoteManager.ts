/**
 * QuoteManager - Handles price quoting for Uniswap V4 swaps
 */

import { PublicClient, parseEther } from "viem";
import { V4_QUOTER_ADDRESS } from "../contracts/addresses";
import { getPoolKey } from "../../onchain/uniswap";
import { QuoteParams, QuoteResult } from "../types";

// V4 Quoter ABI
const V4_QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" }
            ],
            name: "poolKey",
            type: "tuple"
          },
          { name: "zeroForOne", type: "bool" },
          { name: "exactAmount", type: "uint128" },
          { name: "hookData", type: "bytes" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export class QuoteManager {
  private publicClient: PublicClient;

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient;
  }

  /**
   * Gets a price quote for a swap
   */
  async getQuote(params: QuoteParams): Promise<QuoteResult | null> {
    try {
      const result = await this.publicClient.simulateContract({
        address: V4_QUOTER_ADDRESS,
        abi: V4_QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [params] as any
      });

      const [amountOut, gasEstimate] = result.result;
      
      return {
        amountOut,
        gasEstimate
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }

  /**
   * Gets a quote for buying tokens with ETH
   */
  async getBuyQuote(amountIn: string): Promise<QuoteResult | null> {
    if (!amountIn || Number(amountIn) <= 0) {
      return null;
    }

    const poolKey = getPoolKey();
    const exactAmountInWei = parseEther(amountIn);

    const params: QuoteParams = {
      poolKey,
      zeroForOne: true, // ETH -> Token
      exactAmount: exactAmountInWei,
      hookData: "0x"
    };

    return this.getQuote(params);
  }

  /**
   * Gets a quote for selling tokens for ETH
   */
  async getSellQuote(amountIn: string): Promise<QuoteResult | null> {
    if (!amountIn || Number(amountIn) <= 0) {
      return null;
    }

    const poolKey = getPoolKey();
    const exactAmountInWei = parseEther(amountIn);

    const params: QuoteParams = {
      poolKey,
      zeroForOne: false, // Token -> ETH
      exactAmount: exactAmountInWei,
      hookData: "0x"
    };

    return this.getQuote(params);
  }

  /**
   * Gets a quote based on trade direction
   */
  async getSwapQuote(amountIn: string, isBuying: boolean): Promise<QuoteResult | null> {
    if (isBuying) {
      return this.getBuyQuote(amountIn);
    } else {
      return this.getSellQuote(amountIn);
    }
  }

  /**
   * Continuously updates quotes (useful for real-time price updates)
   */
  createQuoteSubscription(
    amountIn: string,
    isBuying: boolean,
    onQuoteUpdate: (quote: QuoteResult | null) => void,
    intervalMs: number = 5000
  ): () => void {
    const updateQuote = async () => {
      const quote = await this.getSwapQuote(amountIn, isBuying);
      onQuoteUpdate(quote);
    };

    // Initial quote
    updateQuote();

    // Set up interval
    const interval = setInterval(updateQuote, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}