import { parseEther } from "viem";
import {
  USDC_ADDRESS,
  encodeBuyCommands,
  encodeSellCommands,
  encodeSwapActions,
  encodeSwapParams,
  encodeSettleParams,
  encodeTakeParams,
  encodeRouterInputs,
  encodePermit2Data,
  encodePoolId,
  parseAmount,
  getSwapDirection,
  type PoolKey,
  type PermitData,
  type SwapData
} from "../uniswap-v4";
import { POOL_FEE } from "../constants";

export function encodeBuyData(contractAddress: string, amountIn: string, minAmountOut: bigint = BigInt(0)): SwapData {
  console.log("Contract address:", contractAddress);
  
  const poolKey = getPoolKey();
  const parsedAmountIn = parseAmount(amountIn);
  const zeroForOne = getSwapDirection(true); // true for buying (ETH -> Token)
  
  console.log("Pool key:", poolKey);
  
  // Encode all components using utility functions
  const commands = encodeBuyCommands();
  const actions = encodeSwapActions();
  const swapParams = encodeSwapParams(poolKey, zeroForOne, amountIn, minAmountOut);
  const settleParams = encodeSettleParams(poolKey.currency0, parsedAmountIn);
  const takeParams = encodeTakeParams(poolKey.currency1, BigInt(0));
  
  console.log("Swap params:", swapParams);
  console.log("Settle params:", settleParams);
  console.log("Take params:", takeParams);
  
  const inputs = encodeRouterInputs(actions, [swapParams, settleParams, takeParams]);

  return {
    commands,
    inputs: [inputs],
    value: parsedAmountIn // When buying, we send ETH
  };
}

export function encodeSellData(
  contractAddress: string,
  amountIn: string,
  permit: PermitData,
  minAmountOut: bigint = BigInt(0)
): SwapData {
  const poolKey = getPoolKey();
  const parsedAmountIn = parseAmount(amountIn);
  const zeroForOne = getSwapDirection(false); // false for selling (Token -> ETH)

  // Encode all components using utility functions
  const commands = encodeSellCommands();
  const actions = encodeSwapActions();
  const permitInputs = encodePermit2Data(permit);
  const swapParams = encodeSwapParams(poolKey, zeroForOne, amountIn, minAmountOut);
  const settleParams = encodeSettleParams(poolKey.currency1, parsedAmountIn);
  const takeParams = encodeTakeParams(poolKey.currency0, BigInt(0));
  
  const swapInputs = encodeRouterInputs(actions, [swapParams, settleParams, takeParams]);

  return {
    commands,
    inputs: [permitInputs, swapInputs],
    value: BigInt(0) // When selling, we don't send ETH
  };
} 

export function getPoolKey(): PoolKey {
  return {
    currency0: '0x0000000000000000000000000000000000000000', // ETH
    currency1: USDC_ADDRESS,
    fee: POOL_FEE, // 3000 (0.3%)
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000' // No hooks for basic ETH/USDC pool
  } as const;
}

export function toId(poolKey: PoolKey): `0x${string}` {
  return encodePoolId(poolKey);
}