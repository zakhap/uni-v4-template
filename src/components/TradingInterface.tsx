import React, { useState } from 'react';
import { TradeModal } from './TradeModal';
import { useEthPrice } from '../contexts/EthPriceContext';

export const TradingInterface: React.FC = () => {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const { ethPrice, loading: priceLoading, error: priceError } = useEthPrice();

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-4 w-full">
      <div className="w-full flex-grow flex items-center justify-center relative min-h-[300px]">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-800">
            Uniswap V4 Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-md">
            Trade ETH and USDC using Uniswap V4 on Base network
          </p>
          
          {/* ETH Price Display */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-sm mx-auto">
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
      </div>
      
      <div className="flex flex-col items-center space-y-3 mt-2">
        <button
          onClick={() => setIsTradeModalOpen(true)}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          Start Trading
        </button>
      </div>
      
      {/* Trade Modal */}
      <TradeModal 
        isOpen={isTradeModalOpen} 
        onClose={() => setIsTradeModalOpen(false)} 
      />
    </div>
  );
};