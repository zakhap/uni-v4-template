import Head from 'next/head';
import { Header } from './Header';
import { useMood } from '../contexts/MoodContext';
import { useEffect, useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const siteUrl = 'https://contentment.fun';
  const imageUrl = `${siteUrl}/images/main.png`;
  const { currentMood } = useMood();
  const [faviconPath, setFaviconPath] = useState('/images/content.png');
  const [title, setTitle] = useState('Contentcoin');
  // Update favicon when mood changes
  useEffect(() => {
    if (currentMood === 'Happy') {
      setTitle('Happycoin');
      setFaviconPath('/images/happy.png');
    } else if (currentMood === 'Angry') {
      setTitle('Angrycoin');
      setFaviconPath('/images/angry.png');
    } else {
      setTitle('Contentmentcoin');
      setFaviconPath('/images/content.png');
    }
  }, [currentMood]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>{title}</title>
        <link rel="icon" href={faviconPath} />
        <meta
          name="description"
          content="Will you buy the token to make it happy, or sell it to make it angry?"
        />

        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contentmentcoin" />
        <meta
          property="og:description"
          content="Will you buy the token to make it happy, or sell it to make it angry?"
        />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={siteUrl} />

        {/* X (Twitter) Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:description" content="Will you buy the token to make it happy, or sell it to make it angry?" />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content="Contentmentcoin" />
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