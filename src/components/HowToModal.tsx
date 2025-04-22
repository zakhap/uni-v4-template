import { useMood } from '../contexts/MoodContext';
import {
  ANGER_COLOR,
  ANGER_BORDER,
  CONTENT_COLOR,
  CONTENT_BORDER,
  HAPPY_COLOR,
  HAPPY_BORDER
} from '../lib/constants';

interface HowToModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToModal = ({ isOpen, onClose }: HowToModalProps) => {
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
        className="relative text-white backdrop-blur-sm rounded-xl shadow-2xl max-w-2xl w-full mx-2 sm:mx-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto transition-all duration-300 border"
        style={{ 
          backgroundColor: `${backgroundColor}80`, // 80 is hex for 50% opacity (increased from 25%)
          borderColor: borderColor
        }}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white/60 hover:text-white/90 transition-colors"
        >
          ✕
        </button>

        <h3 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6">Con·tent·ment: The state of being satisfied and happy.</h3>
        
        <div className="space-y-6 text-white/90">
          <div 
            className="p-3 sm:p-4 rounded-lg space-y-2 border"
            style={{ 
              backgroundColor: `${backgroundColor}90`, // 90 is hex for ~56% opacity (increased from 37%)
              borderColor: borderColor 
            }}
          >
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-white">How it works:</h3>
            <ul className="space-y-2 text-white/80 text-sm sm:text-base">
              <li>- The token is happy when the last trade was a buy, angry when the last trade was a sell, and content when the token is not traded for a while</li>
              <li>- Holding the ERC20 token will also give you an ERC1155 NFT displaying the current mood automatically</li>
              <li>- This project also uses a custom Uniswap v4 hook that takes a variable creator fee based on trader profit</li>
              <li>- Traders that make a profit pay a higher creator fee, and traders that lose money pay nothing (Linearly between 0% and 10% from 1x to 2x)</li>
              <li>- This is a proof of concept to see if this is a better way to reward creators than the current model on launchpads like Zora/Clanker</li>
            </ul>
          </div>

          <div 
            className="p-3 sm:p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${backgroundColor}90`, // 90 is hex for ~56% opacity (increased from 37%)
              borderColor: borderColor 
            }}
          >
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-white">The Choice:</h3>
            <p className="text-white/80 text-sm sm:text-base">
              Will you buy the token to make it happy? Or sell it to make it angry?
            </p>
          </div>

          <div className="mt-4 sm:mt-6 flex justify-center">
            <button
              onClick={onClose}
              style={{
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                boxShadow: `0 1px 3px ${borderColor}40`
              }}
              className="text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base border"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 