import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Types for toast components
interface SwapToastProps {
  type: 'loading' | 'error' | 'buy' | 'sell';
  amount?: string;
  symbol?: string;
  txHash?: string;
  message?: string;
  duration?: number;
}

interface SpawnToastProps {
  message: string;
  onDismiss: () => void;
}

interface MoodToastProps {
  mood: string;
  previousMood: string | null;
}

const baseToastClasses = "bg-black/90 backdrop-blur-sm text-white rounded-lg shadow-2xl p-4 border border-white/10 relative overflow-hidden";

export const SwapToast = ({ type, amount, symbol, txHash, message, duration = 5000 }: SwapToastProps) => {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (duration === Infinity) return;

    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      }
    };
    requestAnimationFrame(updateProgress);
  }, [duration]);

  return (
    <div className={baseToastClasses}>
      {duration !== Infinity && (
        <div 
          className="absolute bottom-0 left-0 h-0.5 bg-white/20"
          style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
        />
      )}

      <div className="flex flex-col gap-2">        
        <p className="text-sm font-medium">
          {type === 'loading' && message}
          {type === 'error' && 'Failed to swap. Please try again.'}
          {type === 'buy' && `Successfully swapped ETH for ${symbol}!`}
          {type === 'sell' && `Successfully swapped ${symbol} for ETH!`}
        </p>
      </div>
    </div>
  );
};

interface CopyToastProps {
  type: 'address' | 'tx';
  value: string;
}

export const CopyToast = ({ type, value }: CopyToastProps) => {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, []);

  return (
    <div className={baseToastClasses}>
      {/* Progress bar */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-white/20"
        style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
      />

      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          {type === 'address' ? 'Address Copied!' : 'Transaction Hash Copied!'}
        </p>
        <span className="text-blue-500">📋</span>
      </div>
      <p className="font-mono text-xs text-white/60 mt-1">
        {value.slice(0, 6)}...{value.slice(-4)}
      </p>
    </div>
  );
};

// Add the missing SpawnToast component
export const SpawnToast = ({ message, onDismiss }: SpawnToastProps) => {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2500;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, []);

  return (
    <div className={baseToastClasses} onClick={onDismiss}>
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-white/20"
        style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
      />

      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

// New MoodToast component (simplified for demo)
export const MoodToast = ({ mood, previousMood }: MoodToastProps) => {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, []);

  const style = {
    background: 'rgba(59, 130, 246, 0.8)', // blue-600 with 80% opacity
    border: '1px solid #2563EB', // blue-700
  };
  
  const progressBarStyle = {
    width: `${progress}%`, 
    transition: 'width 100ms linear',
    background: 'rgba(37, 99, 235, 0.5)', // blue-700 with 50% opacity
  };

  const baseClasses = "backdrop-blur-sm text-white rounded-lg shadow-2xl p-4 relative overflow-hidden";

  return (
    <div className={baseClasses} style={style}>
      <div 
        className="absolute bottom-0 left-0 h-0.5"
        style={progressBarStyle}
      />

      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          Trade completed successfully!
        </p>
        <span>✅</span>
      </div>
    </div>
  );
};

// Helper functions to show toasts
export const showSpawnToast = (props: Omit<SpawnToastProps, 'onDismiss'>) => {
  toast.custom((t) => (
    <SpawnToast {...props} onDismiss={() => toast.dismiss(t.id)} />
  ), { duration: 3000 });
};

export const showSwapToast = (props: SwapToastProps) => {
  const duration = props.duration ?? (props.type === 'loading' ? Infinity : 3000);
  return toast.custom(
    (t) => <SwapToast {...props} duration={duration} />,
    { 
      duration,
      id: 'swap-toast'
    }
  );
};

export const showCopyToast = (props: CopyToastProps) => {
  toast.custom(() => <CopyToast {...props} />, { duration: 2000 });
};

// Simplified helper function to show success toast
export const showMoodToast = (props: MoodToastProps) => {
  toast.custom(() => <MoodToast {...props} />, { 
    duration: 3000,
    id: 'success-toast' 
  });
}; 