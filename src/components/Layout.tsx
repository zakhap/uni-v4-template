import Head from 'next/head';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const title = 'UniV4 Demo';
  const description = 'Trade ETH and USDC using Uniswap V4 on Base network';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        
        {/* X (Twitter) Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:description" content={description} />
      </Head>

      {/* Make Header fixed and give it a background to avoid transparency issues */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gray-100 shadow-md">
        <Header />
      </div>

      {/* Add padding-top to account for the fixed header height */}
      <div className="flex-grow flex pt-20">
        {children}
      </div>
    </div>
  );
}; 