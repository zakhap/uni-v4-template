
interface HowToModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToModal = ({ isOpen, onClose }: HowToModalProps) => {
  // Use neutral colors
  const backgroundColor = '#3B82F6'; // blue-600
  const borderColor = '#2563EB'; // blue-700
  
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

        <h3 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6">Uniswap V4 Demo</h3>
        
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
              <li>- This is a demonstration of Uniswap V4 trading on Base network</li>
              <li>- Trade between native ETH and USDC tokens</li>
              <li>- Connect your wallet to get real-time price quotes</li>
              <li>- All trades execute through Uniswap V4 protocol</li>
              <li>- Includes slippage protection and transaction cost estimates</li>
            </ul>
          </div>

          <div 
            className="p-3 sm:p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${backgroundColor}90`, // 90 is hex for ~56% opacity (increased from 37%)
              borderColor: borderColor 
            }}
          >
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-white">Get Started:</h3>
            <p className="text-white/80 text-sm sm:text-base">
              Click &quot;Start Trading&quot; to open the swap interface and begin trading ETH/USDC.
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