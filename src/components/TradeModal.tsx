import { useMood } from '../contexts/MoodContext';
import {
  ANGER_COLOR,
  ANGER_BORDER,
  CONTENT_COLOR,
  CONTENT_BORDER,
  HAPPY_COLOR,
  HAPPY_BORDER,
  CONTENTMENT_COIN_ADDRESS
} from '../lib/constants';
import SwapComponent from './SwapComponent';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TradeModal = ({ isOpen, onClose }: TradeModalProps) => {
  const { currentMood } = useMood();
  
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative text-white backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full mx-2 sm:mx-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 border"
        style={{ 
          backgroundColor: `${backgroundColor}40`,
          borderColor: borderColor
        }}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white/60 hover:text-white/90 transition-colors"
        >
          ✕
        </button>
        
        <div className="space-y-4">
          {/* Swap Component */}
          <SwapComponent />

        </div>
      </div>
    </div>
  );
}; 