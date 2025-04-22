import React, { createContext, useContext, useState, useEffect } from 'react';

interface EthPriceContextType {
  ethPrice: number | null;
  loading: boolean;
  error: string | null;
}

const EthPriceContext = createContext<EthPriceContextType | null>(null);

export function EthPriceProvider({ children }: { children: React.ReactNode }) {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
        if (!response.ok) throw new Error('Failed to fetch ETH price');
        const data = await response.json();
        setEthPrice(parseFloat(data.data.amount));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ETH price');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchEthPrice();

    // Then fetch every 10 seconds
    const interval = setInterval(fetchEthPrice, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <EthPriceContext.Provider value={{ ethPrice, loading, error }}>
      {children}
    </EthPriceContext.Provider>
  );
}

export function useEthPrice() {
  const context = useContext(EthPriceContext);
  if (!context) {
    throw new Error('useEthPrice must be used within an EthPriceProvider');
  }
  return context;
} 