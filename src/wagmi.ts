import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

// Configure Base chain with custom RPC
const baseChain = {
  ...base,
  rpcUrls: {
    ...base.rpcUrls,
    default: {
      http: [process.env.NEXT_PUBLIC_RPC!]
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC!]
    }
  }
};

export const config = getDefaultConfig({
  appName: 'Contentment Coin',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '',
  chains: [baseChain],
  ssr: true,
});
