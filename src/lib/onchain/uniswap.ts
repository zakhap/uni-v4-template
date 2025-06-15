import { parseEther } from "viem";
import {
  CONTENTMENT_HOOK_ADDRESS,
  CONTENTMENT_COIN_ADDRESS,
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
    currency1: CONTENTMENT_COIN_ADDRESS,
    fee: 0, // 0%
    tickSpacing: 60,
    hooks: CONTENTMENT_HOOK_ADDRESS
  } as const;
}

export function toId(poolKey: PoolKey): `0x${string}` {
  return encodePoolId(poolKey);
}