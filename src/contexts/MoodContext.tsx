import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { CONTENTMENT_COIN_ADDRESS } from '../lib/constants';
import { CONTENTMENT_COIN_ABI } from '../lib/abi';
import { showMoodToast } from '../components/Toasts';

// Define valid mood types
export type MoodType = 'Content' | 'Happy' | 'Angry' | null;

interface MoodContextType {
  moodSvg: string | null;
  currentMood: MoodType;
  loading: boolean;
  error: string | null;
  refetchMood: () => void;
  lastTrade: bigint | null;
  timeUntilContent: number | null; // time in seconds until mood returns to Content
}

const MoodContext = createContext<MoodContextType | null>(null);

// Helper to decode the base64 part of a data URI
const decodeBase64DataUri = (dataUri: string): string => {
    if (!dataUri || !dataUri.includes(';base64,')) {
        console.error("Attempted to decode non-base64 URI:", dataUri);
        throw new Error('Invalid base64 data URI format');
    }
    // Extract the base64 part after the comma
    const base64Data = dataUri.substring(dataUri.indexOf(';base64,') + ';base64,'.length).trim();
    // console.log("Attempting to decode base64:", base64Data);
    try {
        return atob(base64Data);
    } catch (e: unknown) {
        console.error("atob failed for string:", base64Data, e);
        // Re-throw with more context
        const message = e instanceof Error ? e.message : String(e);
        throw new Error(`Base64 decoding failed (atob): ${message}`);
    }
};

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [moodSvg, setMoodSvg] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<MoodType>(null);
  const previousMoodRef = useRef<MoodType>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<bigint | null>(null);
  const [timeUntilContent, setTimeUntilContent] = useState<number | null>(null);
  const initialLoadRef = useRef(true);

  // Read uri(1), getCurrentMood, and lastTrade from the contract in a single batch
  const { 
    data: contractData, 
    error: contractError, 
    isLoading: isContractLoading, 
    refetch: refetchMoodContract 
  } = useReadContracts({
    contracts: [
      {
        address: CONTENTMENT_COIN_ADDRESS,
        abi: CONTENTMENT_COIN_ABI,
        functionName: 'uri',
        args: [1n], // Fetch URI for token ID 1
      },
      {
        address: CONTENTMENT_COIN_ADDRESS,
        abi: CONTENTMENT_COIN_ABI,
        functionName: 'getCurrentMood',
      },
      {
        address: CONTENTMENT_COIN_ADDRESS,
        abi: CONTENTMENT_COIN_ABI,
        functionName: 'lastTrade',
      }
    ],
    query: {
        refetchInterval: 5000, // Refetch every 5 seconds
    }
  });

  // Calculate time until content restoration - runs every second
  useEffect(() => {
    if (!lastTrade || currentMood === 'Content' || !currentMood) {
      setTimeUntilContent(null);
      return;
    }

    // Assuming mood switches back to content after 5 minutes
    const MOOD_DURATION = 5 * 60; // 5 minutes in seconds
    
    const timer = setInterval(() => {
      const lastTradeTime = Number(lastTrade);
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const elapsedTime = currentTime - lastTradeTime;
      const remainingTime = Math.max(0, MOOD_DURATION - elapsedTime);
      
      setTimeUntilContent(remainingTime);
      
      // If time is up, we'll wait for the next refetch to update the mood
      if (remainingTime <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastTrade, currentMood]);

  // Effect to process the contract data
  useEffect(() => {
    setProcessingError(null);
    setMoodSvg(null);
    previousMoodRef.current = currentMood;
    setCurrentMood(null);
    setLastTrade(null);

    if (isContractLoading || !contractData || !Array.isArray(contractData) || contractData.length < 3) {
      return;
    }

    const [uriResult, moodResult, lastTradeResult] = contractData;
    const jsonDataUri = uriResult.result as string;
    const mood = moodResult.result as string;
    const tradeTimestamp = lastTradeResult.result as bigint;

    // Set last trade timestamp
    if (tradeTimestamp) {
      setLastTrade(tradeTimestamp);
    }

    // Set current mood directly from the contract
    if (mood) {
      const newMood = mood as MoodType; // Assuming mood is one of 'Content', 'Happy', or 'Angry'
      setCurrentMood(newMood);
      
      // Only show toast for mood changes after initial load
      if (previousMoodRef.current !== newMood && 
          newMood && 
          previousMoodRef.current !== null && 
          !initialLoadRef.current) {
        showMoodToast({
          mood: newMood,
          previousMood: previousMoodRef.current
        });
      }
      
      // Set initialLoad to false after first data load
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }
    }

    // Process the URI and extract SVG as before
    if (!jsonDataUri || typeof jsonDataUri !== 'string') {
      return;
    }

    console.log('jsonDataUri', jsonDataUri);
    try {
      // 1. Check if it's a JSON data URI
      if (!jsonDataUri.startsWith('data:application/json')) {
          throw new Error('URI is not a valid JSON data URI');
      }

      // 2. Decode the JSON part - correctly handling utf8 vs base64
      let jsonString: string;
      // Check for utf8 FIRST - since our example uses utf8 but contains base64 in nested fields
      if (jsonDataUri.includes(';utf8,')) {
          jsonString = decodeURIComponent(jsonDataUri.substring(jsonDataUri.indexOf(';utf8,') + ';utf8,'.length));
      }
      // Only check for base64 JSON if we're sure the main data URI itself is base64 encoded
      else if (jsonDataUri.indexOf(';base64,') < jsonDataUri.indexOf(',{')) {
          const base64Json = jsonDataUri.substring(
              jsonDataUri.indexOf(';base64,') + ';base64,'.length,
              jsonDataUri.indexOf(',{')
          );
          console.log('base64Json', base64Json);
          jsonString = atob(base64Json);
      } 
      // Fallback for plain JSON after comma
      else if (jsonDataUri.includes(',{')) {
          jsonString = decodeURIComponent(jsonDataUri.substring(jsonDataUri.indexOf(',') + 1));
          console.log('jsonString', jsonString);
      } else {
           throw new Error('Cannot decode JSON part of the data URI');
      }

      // 3. Parse the JSON
      const metadata = JSON.parse(jsonString);
      console.log('metadata', metadata);
      
      // 4. Extract the image data URI
      const imageUri = metadata?.image;
      if (typeof imageUri !== 'string') {
          throw new Error('Image field missing or invalid in JSON metadata');
      }

      // 5. Simple check for SVG format - if it's already an SVG, use it directly
      if (imageUri.startsWith('<svg')) {
        setMoodSvg(imageUri);
        return;
      }

      // 6. Decode the base64 SVG from the image URI
      if (imageUri.includes(';base64,')) {
        const base64Data = imageUri.substring(imageUri.indexOf(';base64,') + ';base64,'.length).trim();
        try {
          const svgString = atob(base64Data);
          setMoodSvg(svgString);
        } catch (e: unknown) {
          console.error("atob failed for SVG base64:", e);
          throw new Error(`Failed to decode base64 SVG: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        throw new Error(`Image URI is not in a supported format: ${imageUri.substring(0, 30)}...`);
      }

    } catch (err: unknown) {
      console.error("Error processing URI or decoding SVG:", err);
      const message = err instanceof Error ? err.message : 'Failed to process URI or decode SVG';
      setProcessingError(message);
    }
  }, [contractData, isContractLoading]); // Re-run when contract data or loading state changes

  // Combine loading state and errors
  const loading = isContractLoading;
  const error = contractError ? 
    (Array.isArray(contractError) ? contractError.map(e => e?.message).join(', ') : contractError.message) 
    : processingError;

  const refetchMood = useCallback(() => {
    refetchMoodContract();
  }, [refetchMoodContract]);

  return (
    <MoodContext.Provider value={{ 
      moodSvg, 
      currentMood, 
      loading, 
      error, 
      refetchMood, 
      lastTrade, 
      timeUntilContent 
    }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
} 