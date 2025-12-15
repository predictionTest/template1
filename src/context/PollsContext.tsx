import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPublicClient, http, PublicClient } from "viem";
import { sonic } from "viem/chains";
import { PREDICTION_ORACLE_ABI } from "@/config/abi";
import { getContractConfig } from "@/config/contract";
import { PollInfo } from "@/types";
import { PollStatus } from "@/config/abi";
import { getCurrentEpoch } from "@/utils/epochTime";
import { getPollsCache, savePollsCache } from "@/utils/pollsCache";

// Resolved poll activity item (for ticker)
export interface ResolvedPollActivity {
  pollAddress: string;
  question: string;
  status: PollStatus;
  resolutionReason: string;
  timestamp: number;
}

// Max resolved items to keep
const MAX_RESOLVED_ITEMS = 20;

// Create a standalone public client that works without wallet connection
const createStandalonePublicClient = (): PublicClient => {
  const customRpcUrl = import.meta.env.VITE_RPC_ENDPOINT;
  return createPublicClient({
    chain: sonic,
    transport: http(customRpcUrl || sonic.rpcUrls.default.http[0], {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 150,
    }),
  });
};

export interface PollsContextValue {
  allPolls: PollInfo[];
  isLoading: boolean;
  loadProgress: number;
  triggerBackgroundRefresh: () => void;
  recentResolves: ResolvedPollActivity[];
}

export const PollsContext = createContext<PollsContextValue | undefined>(
  undefined
);

export const PollsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const contractConfig = useMemo(() => getContractConfig(), []);
  // Use standalone public client - works without wallet connection
  const publicClient = useMemo(() => createStandalonePublicClient(), []);

  const [allPolls, setAllPolls] = useState<PollInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [recentResolves, setRecentResolves] = useState<ResolvedPollActivity[]>([]);
  const isLoadingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(() => Date.now());
  
  // Track previous poll statuses for detecting resolves
  const prevPollStatusesRef = useRef<Map<string, PollStatus>>(new Map());

  const triggerBackgroundRefresh = useCallback(() => {
    if (isLoadingRef.current) return;
    setLastUpdatedAt(Date.now());
  }, []);

  useEffect(() => {
    if (isLoadingRef.current) return;

    const isInitialLoad = initialLoadRef.current;
    isLoadingRef.current = true;

    if (isInitialLoad) {
      setIsLoading(true);
      setLoadProgress(0);
    }

    const loadPolls = async () => {
      const currentEpoch = getCurrentEpoch();
      const loadType = initialLoadRef.current ? "initial" : "background";

      console.debug(
        `[Polls] Starting ${loadType} scan at epoch ${currentEpoch}`
      );

      const toEpoch = currentEpoch + contractConfig.scanFutureEpochs;
      const deploymentTimestamp = contractConfig.deploymentTimestamp;
      const deploymentEpoch = Math.floor(
        deploymentTimestamp / contractConfig.epochLength
      );

      const aggregatedPolls: PollInfo[] = [];
      const seenAddresses = new Set<string>();

      // 1) Load from cache
      const cache = getPollsCache(
        contractConfig.address,
        contractConfig.cacheVersion,
        deploymentTimestamp
      );
      let cacheLoadSuccessful = false;

      if (cache) {
        const allCachedEpochs = [
          ...cache.confirmedEpochs,
          ...cache.futureEpochs,
        ];

        if (allCachedEpochs.length > 0) {
          const CACHE_CHUNK_SIZE = contractConfig.cacheChunkSize;

          const loadChunkWithRetry = async (
            chunk: number[],
            maxRetries = 3
          ): Promise<PollInfo[]> => {
            let chunkSize = chunk.length;
            let attempt = 0;

            while (attempt < maxRetries) {
              try {
                const currentChunk = chunk.slice(0, chunkSize);
                const polls = (await publicClient.readContract({
                  address: contractConfig.address,
                  abi: PREDICTION_ORACLE_ABI,
                  functionName: "getPollsByEpochs",
                  args: [currentChunk, 0n, 0n, BigInt(1000)],
                })) as PollInfo[];

                if (chunkSize < chunk.length) {
                  const remainingPolls = await loadChunkWithRetry(
                    chunk.slice(chunkSize),
                    maxRetries
                  );
                  return [...polls, ...remainingPolls];
                }

                return polls;
              } catch {
                attempt++;
                const previousChunkSize = chunkSize;
                chunkSize = Math.max(1, Math.floor(chunkSize / 2));
                if (attempt >= maxRetries) return [];
                console.log(
                  `Retrying cache load: ${previousChunkSize} -> ${chunkSize}`
                );
              }
            }

            return [];
          };

          for (let i = 0; i < allCachedEpochs.length; i += CACHE_CHUNK_SIZE) {
            const chunk = allCachedEpochs.slice(i, i + CACHE_CHUNK_SIZE);
            const cachedPolls = await loadChunkWithRetry(chunk);

            cachedPolls.forEach((poll) => {
              if (!seenAddresses.has(poll.pollAddress)) {
                aggregatedPolls.push(poll);
                seenAddresses.add(poll.pollAddress);
              }
            });
          }
          
          // Single update after all cache chunks loaded (instead of per-chunk)
          if (aggregatedPolls.length > 0) {
            setAllPolls([...aggregatedPolls]);
          }

          cacheLoadSuccessful = aggregatedPolls.length > 0;
        }
      }

      // 2) Background scan (getPollsByEpochRange)
      const startFrom =
        cache && cacheLoadSuccessful ? cache.lastCheckedEpoch : deploymentEpoch;
      let currentFromEpoch = toEpoch;
      const totalChunks = Math.ceil(
        (toEpoch - startFrom + 1) / contractConfig.chunkSize
      );

      const loadEpochRangeWithRetry = async (
        fromEpoch: number,
        toEpochParam: number,
        maxRetries = 3
      ): Promise<PollInfo[]> => {
        let chunkSize = fromEpoch - toEpochParam;
        let attempt = 0;
        const minChunkSize = contractConfig.minRetryChunkSize;

        while (attempt < maxRetries) {
          try {
            const currentToEpoch = fromEpoch - chunkSize;
            const result = (await publicClient.readContract({
              address: contractConfig.address,
              abi: PREDICTION_ORACLE_ABI,
              functionName: "getPollsByEpochRange",
              args: [
                fromEpoch,
                currentToEpoch,
                0n,
                0n,
                BigInt(1000),
                BigInt(0),
              ],
            })) as any;

            const [polls] = result;

            if (chunkSize < fromEpoch - toEpochParam) {
              const remainingPolls = await loadEpochRangeWithRetry(
                currentToEpoch,
                toEpochParam,
                maxRetries
              );
              return [...polls, ...remainingPolls];
            }

            return polls;
          } catch {
            attempt++;
            const previousChunkSize = chunkSize;
            chunkSize = Math.max(minChunkSize, Math.floor(chunkSize / 2));
            if (attempt >= maxRetries) return [];
            console.log(
              `Retrying range load: ${previousChunkSize} -> ${chunkSize}`
            );
          }
        }

        return [];
      };

      let processedChunks = 0;

      while (currentFromEpoch >= startFrom && processedChunks < totalChunks) {
        const chunkToEpochExclusive = Math.max(
          startFrom - 1,
          currentFromEpoch - contractConfig.chunkSize
        );

        const polls = await loadEpochRangeWithRetry(
          currentFromEpoch,
          chunkToEpochExclusive
        );

        polls.forEach((poll: PollInfo) => {
          if (!seenAddresses.has(poll.pollAddress)) {
            aggregatedPolls.push(poll);
            seenAddresses.add(poll.pollAddress);
          }
        });

        currentFromEpoch = chunkToEpochExclusive;
        processedChunks += 1;
        
        // Update UI every 3 chunks or on last chunk (reduces re-renders)
        const isLastChunk = processedChunks >= totalChunks || currentFromEpoch < startFrom;
        if (processedChunks % 3 === 0 || isLastChunk) {
          setAllPolls([...aggregatedPolls]);
        }
        setLoadProgress(
          Math.round((processedChunks / totalChunks) * 100)
        );

        if (!isLastChunk) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // 3) Save cache по checkEpoch
      const confirmedEpochsSet = new Set<number>();

      aggregatedPolls.forEach((poll) => {
        const epoch = poll.checkEpoch;
        if (!epoch) return;
        if (epoch < currentEpoch) {
          confirmedEpochsSet.add(epoch);
        }
      });

      const finalConfirmedEpochs = Array.from(confirmedEpochsSet).sort(
        (a, b) => b - a
      );
      const finalFutureEpochs: number[] = [];

      savePollsCache(
        contractConfig.address,
        contractConfig.cacheVersion,
        deploymentTimestamp,
        currentEpoch,
        finalConfirmedEpochs,
        finalFutureEpochs
      );
      
      // Detect newly resolved polls
      const newResolves: ResolvedPollActivity[] = [];
      const now = Date.now();
      const prevStatuses = prevPollStatusesRef.current;
      
      aggregatedPolls.forEach((poll) => {
        const prevStatus = prevStatuses.get(poll.pollAddress);
        const currentStatus = poll.status;
        
        // Check if poll was pending before and is now resolved
        if (prevStatus === PollStatus.Pending && currentStatus !== PollStatus.Pending) {
          newResolves.push({
            pollAddress: poll.pollAddress,
            question: poll.question,
            status: currentStatus,
            resolutionReason: poll.resolutionReason || "",
            timestamp: now,
          });
          console.debug(`[Resolves] Poll resolved: ${poll.question.slice(0, 50)}... -> ${PollStatus[currentStatus]}`);
        }
        
        // Update the ref for next comparison
        prevStatuses.set(poll.pollAddress, currentStatus);
      });
      
      // Add new resolves to the list
      if (newResolves.length > 0) {
        console.debug(`[Resolves] Adding ${newResolves.length} new resolves`);
        setRecentResolves((prev) => {
          const updated = [...newResolves, ...prev];
          return updated.slice(0, MAX_RESOLVED_ITEMS);
        });
      }
      
      console.debug(
        `[Polls] Finished ${loadType} scan at epoch ${currentEpoch}. Polls loaded: ${aggregatedPolls.length}`
      );
    };

    const run = async () => {
      try {
        await loadPolls();
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
        initialLoadRef.current = false;
      }
    };

    run();
  }, [publicClient, contractConfig.address, contractConfig.epochLength, lastUpdatedAt]);

  useEffect(() => {
    const epochMs = contractConfig.epochLength * 1000;
    const id = window.setInterval(() => {
      setLastUpdatedAt(Date.now());
    }, epochMs);

    return () => {
      window.clearInterval(id);
    };
  }, [contractConfig.epochLength]);

  const value: PollsContextValue = useMemo(
    () => ({
      allPolls,
      isLoading,
      loadProgress,
      triggerBackgroundRefresh,
      recentResolves,
    }),
    [allPolls, isLoading, loadProgress, triggerBackgroundRefresh, recentResolves]
  );

  return (
    <PollsContext.Provider value={value}>{children}</PollsContext.Provider>
  );
};
