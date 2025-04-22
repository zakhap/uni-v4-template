import React, { useState } from 'react';
import { useMood } from '../contexts/MoodContext';
import { TradeModal } from './TradeModal';

import {
  ANGER_COLOR,
  ANGER_BORDER,
  CONTENT_COLOR,
  CONTENT_BORDER,
  HAPPY_COLOR,
  HAPPY_BORDER
} from '../lib/constants';

// Helper function to format seconds into hours, minutes, seconds
const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return "...";
  
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const ContentmentCoin: React.FC = () => {
  const { moodSvg, loading, error, refetchMood, currentMood, timeUntilContent } = useMood();
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  
  // Get mood-based colors
  let backgroundColor = CONTENT_COLOR;
  let borderColor = CONTENT_BORDER;
  
  if (currentMood === 'Happy') {
    backgroundColor = HAPPY_COLOR;
    borderColor = HAPPY_BORDER;
  } else if (currentMood === 'Angry') {
    backgroundColor = ANGER_COLOR;
    borderColor = ANGER_BORDER;
  }

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-4 w-full">
      <div className="w-full flex-grow flex items-center justify-center relative min-h-[300px]">
        {
          loading ? (
            <p className="text-gray-500">Loading mood...</p>
          ) : error ? (
              <div className="text-center text-red-500">
                 <p>Error fetching mood:</p>
                 <p className="text-sm mt-1">{error}</p>
                 <button 
                    onClick={refetchMood}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                 >
                    Retry
                 </button>
              </div>
          ) : moodSvg ? (
            <div 
               className="w-full h-full max-w-xl max-h-xl" 
               dangerouslySetInnerHTML={{ __html: moodSvg }} 
            />
          ) : (
            <p className="text-gray-500">No mood SVG available.</p>
          )
        }
      </div>
      
      <div className="flex flex-col items-center space-y-3 mt-2">
        <p className="text-center text-gray-600 font-medium">CURRENT MOOD: {currentMood?.toUpperCase()} {currentMood && currentMood !== 'Content' && timeUntilContent !== null && `(${formatTimeRemaining(timeUntilContent)})`}</p>
        
        <button
          onClick={() => setIsTradeModalOpen(true)}
          style={{
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            boxShadow: `0 1px 3px ${borderColor}40`
          }}
          className="px-6 py-2 text-white rounded-md transition-colors font-medium text-sm border hover:opacity-90"
        >
          Trade Now
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
