import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { HowToModal } from './HowToModal';
import Image from 'next/image';
export const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use neutral colors
  const backgroundColor = '#3B82F6'; // blue-600
  const borderColor = '#2563EB'; // blue-700
  const bgWithOpacity = `${backgroundColor}20`; // 20 is hex for ~12% opacity

  return (
    <>
      <header 
        className={`p-2 sm:p-4 pt-4 sm:pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-4 border-b transition-all duration-300`}
        style={{
          backgroundColor: bgWithOpacity,
          borderColor: borderColor
        }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            className={`px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base text-white rounded-md transition-colors font-medium backdrop-blur-sm cursor-pointer w-full sm:w-auto`}
            style={{
              backgroundColor: backgroundColor,
              borderColor: borderColor,
              boxShadow: `0 1px 3px ${borderColor}40`
            }}
            onClick={() => setIsModalOpen(true)}
          >
            What is this?
          </button>
        </div>
        <div className="flex items-center">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              if (!ready) {
                return null;
              }
              return (
                <div className="w-full">
                  {(() => {
                    if (!mounted) {
                      return null;
                    }
                    if (!account) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="w-full px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base text-white rounded-md transition-colors font-medium cursor-pointer backdrop-blur-sm"
                          style={{
                            backgroundColor: backgroundColor,
                            borderColor: borderColor,
                            boxShadow: `0 1px 3px ${borderColor}40`
                          }}
                        >
                          Connect
                        </button>
                      );
                    }
                    if (chain?.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base text-white rounded-md transition-colors font-medium backdrop-blur-sm cursor-pointer w-full bg-red-500/70 hover:bg-red-500/80"
                        >
                          Wrong Network
                        </button>
                      );
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openChainModal}
                          className="flex cursor-pointer items-center gap-2 px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base text-white rounded-md transition-colors font-medium backdrop-blur-sm"
                          style={{
                            backgroundColor: backgroundColor,
                            borderColor: borderColor,
                            boxShadow: `0 1px 3px ${borderColor}40`
                          }}
                        >
                          {chain?.hasIcon && chain?.iconUrl && (
                            <div className="w-3 h-3 sm:w-4 sm:h-4 relative">
                              <Image
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          {chain?.name ?? 'Unknown Network'}
                        </button>
                        <button
                          onClick={openAccountModal}
                          style={{
                            backgroundColor: backgroundColor,
                            borderColor: borderColor,
                            boxShadow: `0 1px 3px ${borderColor}40`
                          }}
                          className="px-3 cursor-pointer sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base text-white rounded-md transition-colors font-medium backdrop-blur-sm"
                        >
                          {account.displayName}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </header>

      <HowToModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}; 