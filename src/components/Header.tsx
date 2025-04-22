import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react';
import { HowToModal } from './HowToModal';
import Image from 'next/image';
import { useMood } from '../contexts/MoodContext';
import {
  ANGER_COLOR,
  ANGER_BORDER,
  CONTENT_COLOR,
  CONTENT_BORDER,
  HAPPY_COLOR,
  HAPPY_BORDER,
  CONTENTMENT_COIN_ADDRESS,
  STATE_VIEW_ADDRESS
} from '../lib/constants';
import { toId, getPoolKey } from "../lib/onchain/uniswap";
import { useEthPrice } from '../contexts/EthPriceContext';
import { publicClient } from '../lib/onchain/provider';
import { STATE_VIEW_ABI } from '../lib/abi';
import { formatEther } from 'viem';
export const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentMood, loading } = useMood();
  const [price, setPrice] = useState<string | null>(null);
  const { ethPrice } = useEthPrice();

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const poolKey = getPoolKey();
        const poolId = toId(poolKey);
        const result = await publicClient.readContract({
          address: STATE_VIEW_ADDRESS,
          abi: STATE_VIEW_ABI,
          functionName: 'getSlot0',
          args: [poolId]
        });

        const [sqrtPriceX96] = result as [bigint];
        
        // Calculate price from sqrtPriceX96
        // price = (Q192 * (10 ** decimals)) / (sqrtPriceX96 * sqrtPriceX96)
        // Q192 = 2**192
        const Q192 = 2 ** 192;
        const DECIMALS = 18;
        const pricePerToken = (BigInt(Q192) * (10n ** BigInt(DECIMALS))) / (BigInt(sqrtPriceX96) * BigInt(sqrtPriceX96));
        
        // Calculate market cap in ETH
        // Total supply is 1 billion tokens with 18 decimals
        const TOTAL_SUPPLY = 1_000_000_000n * (10n ** 18n);
        
        // Calculate market cap in ETH
        const marketCap = (pricePerToken * TOTAL_SUPPLY) / (10n ** 18n);
        
        // Convert to USD if ETH price is available
        const marketCapEth = Number(formatEther(marketCap));
        if (ethPrice) {
          const marketCapUsd = marketCapEth * ethPrice;
          setPrice(`$${marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
        } else {
          setPrice(`${marketCapEth.toFixed(2)} ETH`);
        }
      } catch (error) {
        console.error('Error fetching price:', error);
        setPrice(null);
      }
    };

    // Fetch immediately
    fetchPrice();

    // Then fetch every 5 seconds
    const interval = setInterval(fetchPrice, 5000);

    // Cleanup interval on unmount or when selectedSpawn changes
    return () => clearInterval(interval);
  }, [ethPrice]);
  
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
  
  // Add slight transparency to the background color for better UI
  const bgWithOpacity = `${backgroundColor}20`; // 20 is hex for ~12% opacity
  
  const buttonClass = `px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base text-white rounded-md transition-colors font-medium backdrop-blur-sm bg-black/80 hover:bg-black/70 border border-${borderColor} cursor-pointer`;

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

          <button
            className={`px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base text-white rounded-md transition-colors font-medium backdrop-blur-sm cursor-pointer w-full sm:w-auto`}
            style={{
              backgroundColor: backgroundColor,
              borderColor: borderColor,
              boxShadow: `0 1px 3px ${borderColor}40`
            }}
            onClick={() => window.open(`https://opensea.io/item/base/${CONTENTMENT_COIN_ADDRESS}/1`, '_blank')}
          >
            View NFT
          </button>
          <button
            className={`px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-base text-white rounded-md transition-colors font-medium backdrop-blur-sm cursor-pointer w-full sm:w-auto`}
            style={{
              backgroundColor: backgroundColor,
              borderColor: borderColor,
              boxShadow: `0 1px 3px ${borderColor}40`
            }}
            onClick={() => window.open(`https://www.geckoterminal.com/base/pools/${toId(getPoolKey())}`)}
          >
            View Chart
          </button>
          {price && (
            <button
              className={`py-1.5 sm:py-2 text-xs sm:text-base rounded-md transition-colors font-medium backdrop-blur-sm w-full sm:w-auto`}
              style={{
                color: borderColor,
              }}
            >
              MC: {price}
            </button>
          )}
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