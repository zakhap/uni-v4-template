import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from '../providers/UserProvider';
import { EthPriceProvider } from '../contexts/EthPriceContext';
import { config } from '../wagmi';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <EthPriceProvider>
            <UserProvider>
              <Component {...pageProps} />
              <Toaster 
                position="bottom-right"
                  toastOptions={{
                    style: {
                      background: 'transparent',
                      padding: 0,
                      margin: 0,
                      boxShadow: 'none',
                    },
                    duration: 4000,
                    loading: {
                      style: {
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        boxShadow: 'none',
                      }
                    },
                    success: {
                      style: {
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        boxShadow: 'none',
                      },
                      iconTheme: {
                        primary: 'white',
                        secondary: 'black',
                      },
                    },
                    className: 'border-none',
                    icon: null,
                    position: 'bottom-right'
                  }}
                />
            </UserProvider>
          </EthPriceProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
