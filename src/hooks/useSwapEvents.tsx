// import React from 'react';
// import { useState, useEffect } from 'react';
// import { usePublicClient } from 'wagmi';
// import { Log } from 'viem';
// import toast from 'react-hot-toast';
// import { SpawnToast } from '../components/Toasts';
// import { CONTENTMENT_HOOK_ADDRESS, CONTENTMENT_COIN_ADDRESS } from '../lib/constants';

// export interface Spawn {
//   id: number;
//   address: string;
//   creator: string;
//   parent: string;
//   generation: number;
//   taxInBps: number;
//   tokenName: string;
//   tokenSymbol: string;
//   createdAt: number;
//   price: number;
// }

// export interface SpawnStats {
//   totalSpawns: number;
//   totalFeesEarned: bigint;
//   deepestGeneration: number;
// }

// interface SpawnEventsReturn {
//   stats: SpawnStats;
//   latestSpawn: Spawn | null;
//   loading: boolean;
//   error: string | null;
// }

// // Factory ABI fragments we need
// const FACTORY_ABI = [
//   {
//     type: 'event',
//     name: 'SpawnCreated',
//     inputs: [
//       { type: 'address', name: 'spawn', indexed: true },
//       { type: 'address', name: 'creator', indexed: true },
//       { type: 'address', name: 'parent', indexed: true },
//       { type: 'uint256', name: 'id' },
//       { type: 'uint256', name: 'generation' },
//       { type: 'uint256', name: 'taxInBps' },
//       { type: 'string', name: 'tokenName' },
//       { type: 'string', name: 'tokenSymbol' }
//     ]
//   },
//   {
//     type: 'function',
//     name: 'totalSpawnCount',
//     inputs: [],
//     outputs: [{ type: 'uint256' }],
//     stateMutability: 'view'
//   }
// ] as const;

// // Hook ABI fragments we need
// const HOOK_ABI = [
//   {
//     type: 'function',
//     name: 'totalCreatorFees',
//     inputs: [],
//     outputs: [{ type: 'uint256' }],
//     stateMutability: 'view'
//   }
// ] as const;

// type SpawnCreatedEvent = Log<
//   bigint,
//   number,
//   false,
//   typeof FACTORY_ABI[0],
//   false,
//   typeof FACTORY_ABI
// >;

// export function useSpawnEvents(): SpawnEventsReturn {
//   const [stats, setStats] = useState<SpawnStats>({
//     totalSpawns: 0,
//     totalFeesEarned: 0n,
//     deepestGeneration: 0
//   });
//   const [latestSpawn, setLatestSpawn] = useState<Spawn | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   const publicClient = usePublicClient();

//   const fetchTotalCreatorFees = async () => {
//     if (!publicClient) return 0n;

//     const hookAddress = CONTENTMENT_HOOK_ADDRESS;
//     if (!hookAddress) {
//       console.warn('Hook address not configured');
//       return 0n;
//     }

//     try {
//       const totalFees = await publicClient.readContract({
//         address: hookAddress as `0x${string}`,
//         abi: HOOK_ABI,
//         functionName: 'totalCreatorFees'
//       });

//       return totalFees;
//     } catch (err) {
//       console.error('Failed to fetch total creator fees:', err);
//       return 0n;
//     }
//   };

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         if (!publicClient) {
//           throw new Error('Public client not available');
//         }

//         const factoryAddress = CONTENTMENT_COIN_ADDRESS;
//         if (!factoryAddress) {
//           throw new Error('Factory address not configured');
//         }

//         // Read totalSpawnCount and totalCreatorFees
//         const [totalSpawnCount, totalCreatorFees] = await Promise.all([
//           publicClient.readContract({
//             address: factoryAddress as `0x${string}`,
//             abi: FACTORY_ABI,
//             functionName: 'totalSpawnCount'
//           }),
//           fetchTotalCreatorFees()
//         ]);

//         // Fetch initial data from Ponder API
//         const [generationResponse, latestSpawnResponse] = await Promise.all([
//           fetch(`${process.env.NEXT_PUBLIC_PONDER_URL}/deepest-generation`),
//           fetch(`${process.env.NEXT_PUBLIC_PONDER_URL}/latest-spawn`)
//         ]);

//         if (!generationResponse.ok || !latestSpawnResponse.ok) {
//           throw new Error('Failed to fetch initial data');
//         }

//         const generation = await generationResponse.json();
//         const latestSpawnData = await latestSpawnResponse.json();

//         setStats(prev => ({
//           ...prev,
//           totalSpawns: Number(totalSpawnCount),
//           totalFeesEarned: totalCreatorFees,
//           deepestGeneration: generation.generation || 0
//         }));

//         setLatestSpawn(latestSpawnData[0]);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to fetch data');
//         console.error('Error fetching data:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInitialData();

//     // Only set up event listener if publicClient is available
//     if (!publicClient) {
//       console.warn('Public client not available for event listening');
//       return;
//     }

//     const factoryAddress = SPAWNER_ADDRESS;
//     if (!factoryAddress) {
//       console.warn('Factory address not configured');
//       return;
//     }

//     // Set up event listeners for real-time updates
//     try {
//       const unwatch = publicClient.watchContractEvent({
//         address: factoryAddress as `0x${string}`,
//         abi: FACTORY_ABI,
//         eventName: 'SpawnCreated',
//         onLogs: async (logs: SpawnCreatedEvent[]) => {
//           let lastSpawn: Spawn | null = null;

//           // Process all events in the batch
//           for (const log of logs) {
//             const { spawn, creator, tokenName, tokenSymbol, generation, taxInBps, id, parent } = log.args;

//             if (!tokenName || !tokenSymbol || !spawn || !creator || !parent) {
//               console.warn('Missing required event data');
//               continue;
//             }

//             // Show toast notification
//             toast((t) => (
//               <SpawnToast
//                 tokenName={tokenName}
//                 tokenSymbol={tokenSymbol}
//                 generation={Number(generation)}
//                 taxInBps={Number(taxInBps)}
//                 spawnAddress={spawn}
//                 onDismiss={() => toast.dismiss(t.id)}
//               />
//             ));

//             // Create new spawn object
//             lastSpawn = {
//               id: Number(id),
//               address: spawn,
//               creator: creator,
//               parent: parent,
//               generation: Number(generation),
//               taxInBps: Number(taxInBps),
//               tokenName: tokenName,
//               tokenSymbol: tokenSymbol,
//               createdAt: Math.floor(Date.now() / 1000),
//               price: 1 // Assuming price is not available in the event data
//             };

//             // Update stats
//             setStats(prev => ({
//               ...prev,
//               totalSpawns: prev.totalSpawns + 1,
//               deepestGeneration: Math.max(prev.deepestGeneration, Number(generation))
//             }));
//           }

//           // Set the latest spawn to the last event only
//           if (lastSpawn) {
//             setLatestSpawn(lastSpawn);
//           }

//           // After processing all events, fetch the final fees total once
//           const totalCreatorFees = await fetchTotalCreatorFees();
//           setStats(prev => ({
//             ...prev,
//             totalFeesEarned: totalCreatorFees
//           }));
//         }
//       });

//       // Cleanup function
//       return () => {
//         unwatch();
//       };
//     } catch (err) {
//       console.error('Failed to set up event listener:', err);
//       setError('Failed to set up real-time updates');
//     }
//   }, [publicClient]);

//   return { stats, latestSpawn, loading, error };
// } 