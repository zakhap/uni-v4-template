import { useContext, useState, useEffect, useMemo } from "react";
import { UserContext } from "../providers/UserProvider";
import { getWalletClient, publicClient } from "../lib/onchain/provider";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { CONTENTMENT_COIN_ADDRESS } from "../lib/uniswap-v4/contracts/addresses";
import { ANGER_COLOR, ANGER_BORDER, CONTENT_COLOR, CONTENT_BORDER, HAPPY_COLOR, HAPPY_BORDER } from "../lib/constants";
import { showSwapToast } from './Toasts';
import { useMood } from '../contexts/MoodContext';

// Import the new managers
import { SwapManager } from "../lib/uniswap-v4/core/SwapManager";
import { QuoteManager } from "../lib/uniswap-v4/core/QuoteManager";

const SwapComponent = ({}) => {
  const { address } = useAccount();
  const { ethBalance, tokenBalance } = useContext(UserContext);
  const { currentMood } = useMood();

  const [inputValue, setInputValue] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [isBuying, setIsBuying] = useState(true);
  const [expectedOutput, setExpectedOutput] = useState(null);

  // Initialize managers
  const swapManager = useMemo(() => new SwapManager(publicClient), []);
  const quoteManager = useMemo(() => new QuoteManager(publicClient), []);

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
      const quote = await quoteManager.getSwapQuote(value, isBuying);
      setExpectedOutput(quote?.amountOut || null);
    } catch (error) {
      console.error('Error simulating swap:', error);
      setExpectedOutput(null);
    }
  };

  const handleBuy = async () => {
    if (!inputValue || Number(inputValue) <= 0) return;
    
    setIsSwapping(true);
    showSwapToast({
      type: 'loading',
      amount: inputValue,
      symbol: "CONTENT",
      message: `Swapping ${inputValue} ETH for CONTENT...`
    });

    try {
      const walletClient = await getWalletClient();
      if (!walletClient) throw new Error("No wallet connected");

      // Set wallet client for the swap manager
      swapManager.setWalletClient(walletClient);

      // Calculate minimum amount out with 10% slippage
      const minAmountOut = expectedOutput 
        ? expectedOutput * BigInt(9) / BigInt(10)
        : BigInt(0);

      const swapParams = {
        tokenAddress: CONTENTMENT_COIN_ADDRESS,
        amountIn: inputValue,
        minAmountOut,
        isBuying: true,
        slippagePercent: 10
      };

      showSwapToast({
        type: 'loading',
        message: 'Calculating gas needed...',
        duration: Infinity
      });

      showSwapToast({
        type: 'loading',
        message: 'Submitting transaction...',
        duration: Infinity
      });

      const result = await swapManager.executeSwap(swapParams, address);

      if (result.success) {
        showSwapToast({
          type: 'buy',
          amount: inputValue,
          symbol: "CONTENT",
          txHash: result.hash
        });
        setInputValue("");
        setExpectedOutput(null);
      } else {
        throw new Error(result.error || "Transaction failed");
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

      // Set wallet client for the swap manager
      swapManager.setWalletClient(walletClient);

      showSwapToast({
        type: 'loading',
        message: 'Please grant permission for swap...',
        duration: Infinity
      });

      // Calculate minimum amount out with 10% slippage
      const minAmountOut = expectedOutput 
        ? expectedOutput * BigInt(9) / BigInt(10)
        : BigInt(0);

      const swapParams = {
        tokenAddress: CONTENTMENT_COIN_ADDRESS,
        amountIn: inputValue,
        minAmountOut,
        isBuying: false,
        slippagePercent: 10
      };

      showSwapToast({
        type: 'loading',
        message: 'Calculating gas needed...',
        duration: Infinity
      });

      showSwapToast({
        type: 'loading',
        message: 'Submitting transaction...',
        duration: Infinity
      });

      const result = await swapManager.executeSwap(swapParams, address);

      if (result.success) {
        showSwapToast({
          type: 'sell',
          amount: inputValue,
          symbol: "CONTENT",
          txHash: result.hash
        });
        setInputValue("");
        setExpectedOutput(null);
      } else {
        throw new Error(result.error || "Transaction failed");
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