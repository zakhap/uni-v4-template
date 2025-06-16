import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
export const Header = () => {
  // Use neutral colors for connect button
  const backgroundColor = '#3B82F6'; // blue-600
  const borderColor = '#2563EB'; // blue-700

  return (
    <header className="p-4 flex justify-end items-center border-b border-gray-200 bg-white">
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
              <>
                {(() => {
                  if (!mounted) {
                    return null;
                  }
                  if (!account) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium cursor-pointer"
                        style={{
                          backgroundColor: backgroundColor,
                          boxShadow: `0 1px 3px ${borderColor}40`
                        }}
                      >
                        Connect Wallet
                      </button>
                    );
                  }
                  if (chain?.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium cursor-pointer bg-red-500 hover:bg-red-600"
                      >
                        Wrong Network
                      </button>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openChainModal}
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium"
                        style={{
                          backgroundColor: backgroundColor,
                          boxShadow: `0 1px 3px ${borderColor}40`
                        }}
                      >
                        {chain?.hasIcon && chain?.iconUrl && (
                          <div className="w-4 h-4 relative">
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
                          boxShadow: `0 1px 3px ${borderColor}40`
                        }}
                        className="px-4 cursor-pointer py-2 text-sm text-white rounded-lg transition-colors font-medium"
                      >
                        {account.displayName}
                      </button>
                    </div>
                  );
                })()}
              </>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}; 