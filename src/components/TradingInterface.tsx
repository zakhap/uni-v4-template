import React, { useState } from 'react';
import { TradeModal } from './TradeModal';

export const TradingInterface: React.FC = () => {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

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