import { useState, useCallback } from "react";
import { formatEther } from "viem";
import { ANGER_COLOR, ANGER_BORDER, CONTENT_COLOR, CONTENT_BORDER, HAPPY_COLOR, HAPPY_BORDER } from "../lib/constants";
import { showSwapToast } from './Toasts';
import { useMood } from '../contexts/MoodContext';

// Import from the unified Uniswap V4 library
import { 
  useSwap, 
  useQuote, 
  useEthBalance, 
  useTokenBalance,
  CONTENTMENT_COIN_ADDRESS 
} from "../lib/uniswap-v4";

const SwapComponent = ({}) => {
  const { currentMood } = useMood();

  const [inputValue, setInputValue] = useState("");
  const [isBuying, setIsBuying] = useState(true);

  // Use the new hooks
  const { quote, isLoading: isQuoting } = useQuote(inputValue, isBuying, {
    enabled: !!inputValue && Number(inputValue) > 0
  });

  const ethBalance = useEthBalance();
  const tokenBalance = useTokenBalance(CONTENTMENT_COIN_ADDRESS);

  const { executeSwap, isSwapping } = useSwap({
    onSwapStart: (params) => {
      showSwapToast({
        type: 'loading',
        amount: params.amountIn,
        symbol: "CONTENT",
        message: `Swapping ${params.amountIn} ${params.isBuying ? 'ETH' : 'CONTENT'}...`
      });
    },
    onSwapSuccess: (result) => {
      showSwapToast({
        type: isBuying ? 'buy' : 'sell',
        amount: inputValue,
        symbol: "CONTENT",
        txHash: result.hash
      });
      setInputValue("");
    },
    onSwapError: (error) => {
      showSwapToast({
        type: 'error',
        message: `Failed to swap: ${error}`
      });
    }
  });

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
    setInputValue(e.target.value);
  };

  const handleSwap = useCallback(async () => {
    if (!inputValue || Number(inputValue) <= 0) return;

    // Calculate minimum amount out with 10% slippage
    const minAmountOut = quote?.amountOut 
      ? quote.amountOut * BigInt(9) / BigInt(10)
      : BigInt(0);

    const swapParams = {
      tokenAddress: CONTENTMENT_COIN_ADDRESS,
      amountIn: inputValue,
      minAmountOut,
      isBuying,
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

    await executeSwap(swapParams);
  }, [inputValue, quote, isBuying, executeSwap]);

  // Get the current balance based on trade direction
  const currentBalance = isBuying ? ethBalance : tokenBalance;
  const balanceSymbol = isBuying ? "Ξ" : " CONTENT";

  // Check if user has insufficient balance
  const hasInsufficientBalance = inputValue && Number(inputValue) > 0 && 
    Number(inputValue) > Number(currentBalance.formattedBalance);

  return (
    <div className="space-y-2 sm:space-y-3">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{isBuying ? "Buy" : "Sell"} $CONTENT</h2>

      {/* Trade Type Toggle */}
      <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg">
        <button
          onClick={() => {
            setIsBuying(true);
            setInputValue("");
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
            Balance: {currentBalance.isLoading ? '...' : `${currentBalance.formattedBalance}${balanceSymbol}`}
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
                isQuoting ? "..." :
                quote?.amountOut
                  ? isBuying 
                    ? Math.ceil(Number(formatEther(quote.amountOut))).toString()
                    : Number(formatEther(quote.amountOut)).toPrecision(3).toString()
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
        onClick={handleSwap}
        disabled={
          isSwapping || 
          !inputValue || 
          Number(inputValue) <= 0 || 
          hasInsufficientBalance ||
          currentBalance.isLoading
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
          : currentBalance.isLoading
            ? "Loading balance..."
            : hasInsufficientBalance
              ? "Insufficient balance"
              : isBuying ? "Buy" : "Sell"
        }
      </button>
    </div>
  );
};

export default SwapComponent;