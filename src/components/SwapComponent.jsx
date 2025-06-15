import { useContext, useState, useEffect } from "react";
import { UserContext } from "../providers/UserProvider";
import { getWalletClient, publicClient } from "../lib/onchain/provider";
import { parseEther, formatEther } from "viem";
import { useAccount } from "wagmi";
import { UNIVERSAL_ROUTER_ADDRESS, PERMIT2_ADDRESS, V4_QUOTER_ADDRESS, CONTENTMENT_COIN_ADDRESS, CONTENTMENT_HOOK_ADDRESS } from "../lib/uniswap-v4/contracts/addresses";
import { ANGER_COLOR, ANGER_BORDER, CONTENT_COLOR, CONTENT_BORDER, HAPPY_COLOR, HAPPY_BORDER } from "../lib/constants";
import { encodeBuyData, encodeSellData, getPoolKey } from "../lib/onchain/uniswap";
import { ERC20_ABI } from "../lib/uniswap-v4/contracts/abis";
import { showSwapToast } from './Toasts';
import { useMood } from '../contexts/MoodContext';

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
];

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
];

const SwapComponent = ({}) => {
  const { address } = useAccount();
  const { ethBalance, tokenBalance } = useContext(UserContext);
  const { currentMood } = useMood();

  const [inputValue, setInputValue] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [isBuying, setIsBuying] = useState(true);
  const [expectedOutput, setExpectedOutput] = useState(null);

  // Determine background and border colors based on mood
  let backgroundColor = CONTENT_COLOR;
  let borderColor = CONTENT_BORDER;
  
  if (currentMood === 'Happy') {
    backgroundColor = HAPPY_COLOR;
    borderColor = HAPPY_BORDER;
  } else if (currentMood === 'Angry') {
    backgroundColor = ANGER_COLOR;
    borderColor = ANGER_BORDER;
  }

  const poolKey = getPoolKey();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    simulateSwap(value);
  };

  const simulateSwap = async (value) => {
    if (!value || Number(value) <= 0) {
      setExpectedOutput(null);
      return;
    }

    try {
      const exactAmountInWei = parseEther(value);
      console.log("Pool key:", poolKey);
      const result = await publicClient.simulateContract({
        address: V4_QUOTER_ADDRESS,
        abi: V4_QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          poolKey: poolKey,
          zeroForOne: isBuying,
          exactAmount: exactAmountInWei,
          hookData: "0x"
        }]
      });
            
      // Store the raw BigInt amount
      const [amountOut] = result.result;
      setExpectedOutput(amountOut);
    } catch (error) {
      console.error('Error simulating swap:', error);
      setExpectedOutput(null);
    }
  };

  const handleBuy = async () => {
    if (!inputValue || Number(inputValue) <= 0) return;
    
    setIsSwapping(true);
    const toastId = showSwapToast({
      type: 'loading',
      amount: inputValue,
      symbol: "CONTENT",
      message: `Swapping ${inputValue} ETH for CONTENT...`
    });

    try {
      const walletClient = await getWalletClient();
      if (!walletClient) throw new Error("No wallet connected");

      const currentChain = await walletClient.getChainId();
      if (currentChain !== 8453) {
        showSwapToast({
          type: 'error',
          message: 'Please switch to the Base network'
        });
        return;
      }

      // Calculate minimum amount out with 10% slippage
      const minAmountOut = expectedOutput 
        ? expectedOutput * BigInt(9) / BigInt(10)  // Calculate 90% of the BigInt value
        : BigInt(0);

      // Get swap data for buying CONTENT token with ETH
      const { commands, inputs, value } = encodeBuyData(CONTENTMENT_COIN_ADDRESS, inputValue, minAmountOut);

      // First simulate the transaction to catch any errors early
      showSwapToast({
        type: 'loading',
        message: 'Calculating gas needed...',
        duration: Infinity
      });

      // Calculate gas estimate with simulation
      const gasEstimate = await publicClient.estimateContractGas({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: [
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
        ],
        functionName: "execute",
        args: [
          commands,
          inputs,
          BigInt(Math.floor(Date.now() / 1000) + 1800) // 30 min deadline
        ],
        value,
        account: address
      });

      // Add a 30% buffer to the gas estimate to be safe
      const gasLimit = gasEstimate * BigInt(130) / BigInt(100);

      // Execute swap through Universal Router with the calculated gas limit
      showSwapToast({
        type: 'loading',
        message: 'Submitting transaction...',
        duration: Infinity
      });

      const hash = await walletClient.writeContract({
        address: UNIVERSAL_ROUTER_ADDRESS,
        abi: [
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
        ],
        functionName: "execute",
        args: [
          commands,
          inputs,
          BigInt(Math.floor(Date.now() / 1000) + 1800) // 30 min deadline
        ],
        gas: gasLimit, // Use our buffered gas estimate
        value,
      });
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        showSwapToast({
          type: 'buy',
          amount: inputValue,
          symbol: "CONTENT",
          txHash: hash
        });
        setInputValue("");
        setExpectedOutput(null);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error buying tokens:", error);
      showSwapToast({
        type: 'error',
        message: `Failed to swap: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSell = async () => {
    if (!inputValue || Number(inputValue) <= 0) return;
    
    setIsSwapping(true);

    try {
      const walletClient = await getWalletClient();
      if (!walletClient) throw new Error("No wallet connected");

      const currentChain = await walletClient.getChainId();
      if (currentChain !== 8453) {
        showSwapToast({
          type: 'error',
          message: 'Please switch to the Base network'
        });
        return;
      }

      // Get current nonce from Permit2 contract
      const [, , nonce] = await publicClient.readContract({
        address: PERMIT2_ADDRESS,
        abi: PERMIT2_ABI,
        functionName: "allowance",
        args: [address, CONTENTMENT_COIN_ADDRESS, UNIVERSAL_ROUTER_ADDRESS],
      });

      // Sign Universal Router permission
      showSwapToast({
        type: 'loading',
        message: 'Please grant permission for swap...',
        duration: Infinity
      });

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 minutes
      
      const permitMessage = {
        details: {
          token: CONTENTMENT_COIN_ADDRESS,
          amount: parseEther(inputValue),
          expiration: deadline,
          nonce,
        },
        spender: UNIVERSAL_ROUTER_ADDRESS,
        sigDeadline: deadline,
      };

      const signature = await walletClient.signTypedData({
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
      });

      // Calculate minimum amount out with 10% slippage
      const minAmountOut = expectedOutput 
        ? expectedOutput * BigInt(9) / BigInt(10)
        : BigInt(0);

      // Get swap data for selling token for ETH
      const { commands, inputs, value } = encodeSellData(CONTENTMENT_COIN_ADDRESS, inputValue, {
        signature,
        details: {
          token: CONTENTMENT_COIN_ADDRESS,
          amount: parseEther(inputValue),
          expiration: Number(deadline),
          nonce: Number(nonce)
        },
        sigDeadline: deadline
      }, minAmountOut);

      // First calculate gas estimate
      showSwapToast({
        type: 'loading',
        message: 'Calculating gas needed...',
        duration: Infinity
      });

      try {
        // Calculate gas estimate with simulation
        const gasEstimate = await publicClient.estimateContractGas({
          address: UNIVERSAL_ROUTER_ADDRESS,
          abi: [
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
          ],
          functionName: "execute",
          args: [
            commands,
            inputs,
            BigInt(Math.floor(Date.now() / 1000) + 1800) // 30 min deadline
          ],
          value,
          account: address
        });

        // Add a 30% buffer to the gas estimate to be safe
        const gasLimit = gasEstimate * BigInt(130) / BigInt(100);
        console.log(`Gas estimated: ${gasEstimate}, with buffer: ${gasLimit}`);

        // Execute swap through Universal Router with the calculated gas limit
        showSwapToast({
          type: 'loading',
          message: 'Submitting transaction...',
          duration: Infinity
        });

        const hash = await walletClient.writeContract({
          address: UNIVERSAL_ROUTER_ADDRESS,
          abi: [
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
          ],
          functionName: "execute",
          args: [
            commands,
            inputs,
            BigInt(Math.floor(Date.now() / 1000) + 1800) // 30 min deadline
          ],
          gas: gasLimit, // Use our buffered gas estimate
          value,
        });

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          showSwapToast({
            type: 'sell',
            amount: inputValue,
            symbol: "CONTENT",
            txHash: hash
          });
          setInputValue("");
          setExpectedOutput(null);
        } else {
          throw new Error("Transaction failed");
        }
      } catch (estimationError) {
        console.error("Gas estimation failed:", estimationError);
        
        // If gas estimation fails, try with a very high fixed gas limit as fallback
        showSwapToast({
          type: 'loading',
          message: 'Gas estimation failed, using high gas limit...',
          duration: Infinity
        });
        
        // Hardcoded high gas limit as fallback (3 million gas)
        const highGasLimit = BigInt(3000000);
        
        const hash = await walletClient.writeContract({
          address: UNIVERSAL_ROUTER_ADDRESS,
          abi: [
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
          ],
          functionName: "execute",
          args: [
            commands,
            inputs,
            BigInt(Math.floor(Date.now() / 1000) + 1800) // 30 min deadline
          ],
          gas: highGasLimit, // Use high gas limit
          value,
        });
        
        console.log("Sell transaction with fixed gas limit:", hash);
        
        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("Sell receipt with fixed gas limit:", receipt);
        
        if (receipt.status === "success") {
          showSwapToast({
            type: 'sell',
            amount: inputValue,
            symbol: "CONTENT",
            txHash: hash
          });
          setInputValue("");
          setExpectedOutput(null);
        } else {
          throw new Error("Transaction failed even with high gas limit");
        }
      }
    } catch (error) {
      console.error("Error selling tokens:", error);
      showSwapToast({
        type: 'error',
        message: `Failed to swap: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{isBuying ? "Buy" : "Sell"} $CONTENT</h2>

      {/* Trade Type Toggle */}
      <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg">
        <button
          onClick={() => {
            setIsBuying(true);
            setInputValue("");
            setExpectedOutput(null);
          }}
          className={`flex-1 cursor-pointer py-1.5 rounded-md transition-all duration-200 text-[10px] sm:text-xs ${
            isBuying 
              ? "bg-white/10 text-white" 
              : "text-white/60 hover:text-white/80"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => {
            setIsBuying(false);
            setInputValue("");
            setExpectedOutput(null);
          }}
          className={`flex-1 cursor-pointer py-1.5 rounded-md transition-all duration-200 text-[10px] sm:text-xs ${
            !isBuying 
              ? "bg-white/10 text-white" 
              : "text-white/60 hover:text-white/80"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Input Fields */}
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex justify-between items-center text-[10px] sm:text-xs">
          <span className="text-white/60">Amount</span>
          <span className="text-white/60">
            Balance: {isBuying 
              ? `${Number(ethBalance).toFixed(4)}Ξ`
              : `${Number(tokenBalance).toFixed(0)} CONTENT`
            }
          </span>
        </div>
        
        <div className="flex flex-col gap-1 sm:gap-1.5">
          {/* Input Amount */}
          <div className="flex justify-between items-center px-2 py-1 sm:py-1.5 bg-white/5 rounded-lg">
            <input
              type="number"
              placeholder="0.0"
              min="0"
              step="0.01"
              max={isBuying ? ethBalance : tokenBalance}
              value={inputValue}
              onChange={handleInputChange}
              className="bg-transparent outline-none w-full text-white text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-white/80 text-xs sm:text-sm">
              {isBuying ? "ETH" : "CONTENT"}
            </span>
          </div>

          {/* Expected Output */}
          <div className="flex justify-between items-center px-2 py-1 sm:py-1.5 bg-white/5 rounded-lg">
            <input
              type="text"
              placeholder="0.0"
              disabled
              value={
                expectedOutput
                  ? isBuying 
                    ? Math.ceil(Number(formatEther(expectedOutput))).toString()
                    : Number(formatEther(expectedOutput)).toPrecision(3).toString()
                  : ""
              }
              className="bg-transparent outline-none w-full text-white/60 text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-white/80 text-xs sm:text-sm">
              {!isBuying ? "ETH" : "CONTENT"}
            </span>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <button 
        onClick={isBuying ? handleBuy : handleSell}
        disabled={
          isSwapping || 
          !inputValue || 
          Number(inputValue) <= 0 || 
          Number(inputValue) > Number(isBuying ? ethBalance : tokenBalance)
        }
        style={{
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          boxShadow: `0 1px 3px ${borderColor}40`
        }}
        className="w-full text-white py-1.5 sm:py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
      >
        {isSwapping 
          ? "Swapping..." 
          : Number(inputValue) > Number(isBuying ? ethBalance : tokenBalance)
            ? "Insufficient balance"
            : isBuying ? "Buy" : "Sell"
        }
      </button>
    </div>
  );
};

export default SwapComponent; 