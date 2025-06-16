import React from 'react';
import SwapComponent from './SwapComponent';
import { useEthPrice } from '../contexts/EthPriceContext';

export const TradingInterface: React.FC = () => {
  const { ethPrice, loading: priceLoading, error: priceError } = useEthPrice();
  
  // Use same styling as modal but for embedded widget
  const backgroundColor = '#3B82F6'; // blue-600
  const borderColor = '#2563EB'; // blue-700

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-4 w-full max-w-md mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-800">
          Uniswap V4 Demo
        </h1>
        <p className="text-lg text-gray-600">
          Trade ETH and USDC using Uniswap V4 on Base network
        </p>
        
        {/* ETH Price Display */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Current ETH Price</div>
          <div className="text-2xl font-bold text-blue-800">
            {priceLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : priceError ? (
              <span className="text-red-600 text-sm">Failed to load</span>
            ) : ethPrice ? (
              <span>${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            ) : (
              <span className="text-gray-500">--</span>
            )}
          </div>
          {ethPrice && !priceLoading && !priceError && (
            <div className="text-xs text-blue-500 mt-1">
              Updates every 10 seconds
            </div>
          )}
        </div>
      </div>
      
      {/* Trading Widget */}
      <div className="w-full">
        <div 
          className="text-white backdrop-blur-sm rounded-xl shadow-2xl w-full p-4 sm:p-6 border"
          style={{ 
            backgroundColor: `${backgroundColor}40`,
            borderColor: borderColor
          }}
        >
          <SwapComponent />
        </div>
      </div>
    </div>
  );
};