import { encodeAbiParameters, encodePacked, parseEther, keccak256 } from "viem";
import { V4_SWAP, PERMIT2_PERMIT, Actions, UNIVERSAL_ROUTER_ADDRESS, CONTENTMENT_HOOK_ADDRESS, CONTENTMENT_COIN_ADDRESS } from "../constants";

export function encodeBuyData(contractAddress: string, amountIn: string, minAmountOut: bigint = BigInt(0)) {
  // Encode the Universal Router command for buying (ETH -> Spawn)
  const commands = encodePacked(["uint8"], [V4_SWAP]);

  console.log("Contract address:", contractAddress);

  // Encode V4Router actions
  const actions = encodePacked(
    ["uint8", "uint8", "uint8"],
    [Actions.SWAP_EXACT_IN_SINGLE, Actions.SETTLE_ALL, Actions.TAKE_ALL]
  );

  // For ETH->SPAWN: zeroForOne = true (ETH is currency0)
  const zeroForOne = true;

  // Parse amount based on token decimals
  const parsedAmountIn = parseEther(amountIn);

  const poolKey = getPoolKey();

  console.log("Pool key:", poolKey);

  // Encode ExactInputSingleParams
  const swapParams = encodeAbiParameters(
    [
      {
        name: "poolKey",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" }
        ]
      },
      { name: "zeroForOne", type: "bool" },
      { name: "amountIn", type: "uint128" },
      { name: "amountOutMinimum", type: "uint256" },
      { name: "hookData", type: "bytes" }
    ],
    [poolKey, zeroForOne, parsedAmountIn, minAmountOut, "0x"]
  );

  // Encode settle params
  const settleParams = encodeAbiParameters(
    [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    [poolKey.currency0, parsedAmountIn]
  );

  // Encode take params
  const takeParams = encodeAbiParameters(
    [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    [poolKey.currency1, BigInt(0)]
  );

  console.log("Swap params:", swapParams);
  console.log("Settle params:", settleParams);
  console.log("Take params:", takeParams);

  // Combine all params
  const inputs = encodeAbiParameters(
    [
      { name: "actions", type: "bytes" },
      { name: "params", type: "bytes[]" }
    ],
    [actions, [swapParams, settleParams, takeParams]]
  );

  return {
    commands,
    inputs: [inputs],
    value: parsedAmountIn // When buying, we send ETH
  };
}

export function encodeSellData(
  contractAddress: string,
  amountIn: string,
  permit: {
    signature: `0x${string}`,
    details: {
      token: `0x${string}`,
      amount: bigint,
      expiration: number,
      nonce: number
    },
    sigDeadline: bigint
  },
  minAmountOut: bigint = BigInt(0)
) {
  const poolKey = getPoolKey();

  // Encode the Universal Router commands for selling (SPAWN -> ETH)
  const commands = encodePacked(["uint8", "uint8"], [PERMIT2_PERMIT, V4_SWAP]);

  // Encode V4Router actions
  const actions = encodePacked(
    ["uint8", "uint8", "uint8"],
    [Actions.SWAP_EXACT_IN_SINGLE, Actions.SETTLE_ALL, Actions.TAKE_ALL]
  );

  // For SPAWN->ETH: zeroForOne = false (ETH is currency0)
  const zeroForOne = false;

  // Parse amount based on token decimals
  const parsedAmountIn = parseEther(amountIn);

  // Encode permit data
  const permitInputs = encodeAbiParameters(
    [
      {
        name: "permitSingle",
        type: "tuple",
        components: [
          {
            name: "details",
            type: "tuple",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint160" },
              { name: "expiration", type: "uint48" },
              { name: "nonce", type: "uint48" }
            ]
          },
          { name: "spender", type: "address" },
          { name: "sigDeadline", type: "uint256" }
        ]
      },
      { name: "signature", type: "bytes" }
    ],
    [
      {
        details: {
          token: permit.details.token,
          amount: permit.details.amount,
          expiration: permit.details.expiration,
          nonce: permit.details.nonce
        },
        spender: UNIVERSAL_ROUTER_ADDRESS,
        sigDeadline: permit.sigDeadline
      },
      permit.signature
    ]
  );

  // Encode ExactInputSingleParams
  const swapParams = encodeAbiParameters(
    [
      {
        name: "poolKey",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" }
        ]
      },
      { name: "zeroForOne", type: "bool" },
      { name: "amountIn", type: "uint128" },
      { name: "amountOutMinimum", type: "uint256" },
      { name: "hookData", type: "bytes" }
    ],
    [poolKey, zeroForOne, parsedAmountIn, minAmountOut, "0x"]
  );

  // Encode settle params
  const settleParams = encodeAbiParameters(
    [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    [poolKey.currency1, parsedAmountIn]
  );

  // Encode take params
  const takeParams = encodeAbiParameters(
    [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    [poolKey.currency0, BigInt(0)]
  );

  // Combine all params for swap
  const swapInputs = encodeAbiParameters(
    [
      { name: "actions", type: "bytes" },
      { name: "params", type: "bytes[]" }
    ],
    [actions, [swapParams, settleParams, takeParams]]
  );

  return {
    commands,
    inputs: [permitInputs, swapInputs],
    value: BigInt(0) // When selling, we don't send ETH
  };
} 


export function getPoolKey() {
    // Pool key for a ETH/SPAWN pool
    const POOL_KEY = {
        currency0: '0x0000000000000000000000000000000000000000', // ETH
        currency1: CONTENTMENT_COIN_ADDRESS,
        fee: 0, // 0%
        tickSpacing: 60,
        hooks: CONTENTMENT_HOOK_ADDRESS
    } as const;

    return POOL_KEY;
}

export function toId(poolKey: {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
}): `0x${string}` {
  // Encode the pool key as a tuple
  const encodedKey = encodeAbiParameters(
    [
      {
        name: 'key',
        type: 'tuple',
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' }
        ]
      }
    ],
    [poolKey]
  );
  
  // Hash the encoded key (0xa0 = 160 bytes = 5 slots of 32 bytes)
  return keccak256(encodedKey as `0x${string}`);
}
