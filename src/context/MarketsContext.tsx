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
import { MARKET_FACTORY_ABI } from "@/config/abi";
import { getContractConfig } from "@/config/contract";
import { PollMarkets, MarketState } from "@/types";

// Batch size for getMarketsState calls (will reduce on errors)
const MARKETS_BATCH_SIZE_INITIAL = 500;
const MARKETS_BATCH_SIZE_MIN = 20;

// Zero address constant
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Market activity item (for ticker)
export interface MarketActivity {
  pollAddress: string;
  marketType: "amm" | "pariMutuel";
  marketAddress: string;
  prevYesChance: number;
  newYesChance: number;
  change: number; // percentage points change
  timestamp: number;
}

// Max activity items to keep
const MAX_ACTIVITY_ITEMS = 20;

export interface MarketsContextValue {
  // Map: pollAddress -> PollMarkets
  marketsMap: Map<string, PollMarkets>;
  isLoading: boolean;
  // Trigger loading markets for given poll addresses
  loadMarketsForPolls: (pollAddresses: `0x${string}`[]) => void;
  // Force refresh markets for given poll addresses (ignores cache)
  refreshMarketsForPolls: (pollAddresses: `0x${string}`[]) => void;
  // Keep only specified polls in cache, remove others (memory cleanup)
  trimMarketsCache: (keepPollAddresses: `0x${string}`[]) => void;
  // Get current markets map (bypasses closure issues)
  getMarketsMap: () => Map<string, PollMarkets>;
  // Epoch tick - updates every epoch, use as dependency to trigger refresh
  epochTick: number;
  // Recent market activity (price changes)
  recentActivity: MarketActivity[];
}

export const MarketsContext = createContext<MarketsContextValue | undefined>(
  undefined
);

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

export const MarketsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const contractConfig = useMemo(() => getContractConfig(), []);
  // Use standalone public client - works without wallet connection
  const publicClient = useMemo(() => createStandalonePublicClient(), []);

  const [marketsMap, setMarketsMap] = useState<Map<string, PollMarkets>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [epochTick, setEpochTick] = useState(0);
  const [recentActivity, setRecentActivity] = useState<MarketActivity[]>([]);
  const isLoadingRef = useRef(false);
  const pendingAddressesRef = useRef<Set<string>>(new Set());
  const currentBatchSizeRef = useRef(MARKETS_BATCH_SIZE_INITIAL);
  
  // Ref to always have access to the latest marketsMap (avoids closure issues)
  const marketsMapRef = useRef<Map<string, PollMarkets>>(new Map());
  marketsMapRef.current = marketsMap;

  // Process a single batch result and detect changes
  const processBatchResult = useCallback(
    (
      batch: `0x${string}`[],
      states: readonly {
        isLive: boolean;
        collateralTvl: bigint;
        yesChance: number;
        marketAddress: `0x${string}`;
        collateralToken: `0x${string}`;
      }[]
    ) => {
      const newActivities: MarketActivity[] = [];
      const now = Date.now();
      const newMarketsData: Map<string, PollMarkets> = new Map();

      // Get previous state BEFORE the state update (using ref for accurate comparison)
      const prevMarketsMap = marketsMapRef.current;

      // First pass: process all data and detect changes
      for (let j = 0; j < batch.length; j++) {
        const pollAddr = batch[j].toLowerCase();
        const ammState = states[j * 2];
        const pariState = states[j * 2 + 1];

        // Get previous state from ref
        const prevMarkets = prevMarketsMap.get(pollAddr);

        const ammMarket: MarketState | null =
          ammState.marketAddress !== ZERO_ADDRESS
            ? {
                isLive: ammState.isLive,
                collateralTvl: ammState.collateralTvl,
                yesChance: ammState.yesChance,
                marketAddress: ammState.marketAddress,
                collateralToken: ammState.collateralToken,
              }
            : null;

        const pariMarket: MarketState | null =
          pariState.marketAddress !== ZERO_ADDRESS
            ? {
                isLive: pariState.isLive,
                collateralTvl: pariState.collateralTvl,
                yesChance: pariState.yesChance,
                marketAddress: pariState.marketAddress,
                collateralToken: pariState.collateralToken,
              }
            : null;

        // Detect AMM changes (threshold: 0.1% change)
        if (ammMarket && ammMarket.isLive && prevMarkets?.amm) {
          const prevChance = prevMarkets.amm.yesChance / 1e7;
          const newChance = ammMarket.yesChance / 1e7;
          const change = newChance - prevChance;
          console.debug(`[Activity] AMM ${pollAddr.slice(0, 8)}: ${prevChance.toFixed(2)}% -> ${newChance.toFixed(2)}% (change: ${change.toFixed(2)}%)`);
          if (Math.abs(change) >= 0.1) {
            newActivities.push({
              pollAddress: pollAddr,
              marketType: "amm",
              marketAddress: ammMarket.marketAddress,
              prevYesChance: prevChance,
              newYesChance: newChance,
              change,
              timestamp: now,
            });
            console.debug(`[Activity] AMM change detected! Added to activities`);
          }
        }

        // Detect Pari-Mutuel changes (threshold: 0.1% change)
        if (pariMarket && pariMarket.isLive && prevMarkets?.pariMutuel) {
          const prevChance = prevMarkets.pariMutuel.yesChance / 1e7;
          const newChance = pariMarket.yesChance / 1e7;
          const change = newChance - prevChance;
          console.debug(`[Activity] PARI ${pollAddr.slice(0, 8)}: ${prevChance.toFixed(2)}% -> ${newChance.toFixed(2)}% (change: ${change.toFixed(2)}%)`);
          if (Math.abs(change) >= 0.1) {
            newActivities.push({
              pollAddress: pollAddr,
              marketType: "pariMutuel",
              marketAddress: pariMarket.marketAddress,
              prevYesChance: prevChance,
              newYesChance: newChance,
              change,
              timestamp: now,
            });
            console.debug(`[Activity] PARI change detected! Added to activities`);
          }
        }

        newMarketsData.set(pollAddr, {
          amm: ammMarket,
          pariMutuel: pariMarket,
        });

        pendingAddressesRef.current.delete(pollAddr);
      }

      // Update markets map
      setMarketsMap((prev) => {
        const newMap = new Map(prev);
        for (const [addr, data] of newMarketsData) {
          newMap.set(addr, data);
        }
        return newMap;
      });

      // Add new activities to the list
      if (newActivities.length > 0) {
        console.debug(`[Activity] Adding ${newActivities.length} new activities`);
        setRecentActivity((prev) => {
          const updated = [...newActivities, ...prev];
          // Keep only most recent items
          return updated.slice(0, MAX_ACTIVITY_ITEMS);
        });
      }
    },
    []
  );

  // Fetch batch with retry and adaptive sizing
  const fetchBatchWithRetry = useCallback(
    async (addresses: `0x${string}`[], maxRetries = 3): Promise<void> => {
      let batchSize = Math.min(currentBatchSizeRef.current, addresses.length);
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          const currentBatch = addresses.slice(0, batchSize);

          const states = (await publicClient.readContract({
            address: contractConfig.marketFactoryAddress,
            abi: MARKET_FACTORY_ABI,
            functionName: "getMarketsState",
            args: [currentBatch],
          })) as readonly {
            isLive: boolean;
            collateralTvl: bigint;
            yesChance: number;
            marketAddress: `0x${string}`;
            collateralToken: `0x${string}`;
          }[];

          processBatchResult(currentBatch, states);

          // If we processed less than all addresses, recursively process the rest
          if (batchSize < addresses.length) {
            await fetchBatchWithRetry(addresses.slice(batchSize), maxRetries);
          }
          return;
        } catch (error) {
          attempt++;
          const previousBatchSize = batchSize;
          batchSize = Math.max(
            MARKETS_BATCH_SIZE_MIN,
            Math.floor(batchSize / 2)
          );
          currentBatchSizeRef.current = batchSize;

          if (attempt >= maxRetries) {
            console.error(
              `Failed to load markets after ${maxRetries} retries:`,
              error
            );
            addresses.forEach((addr) =>
              pendingAddressesRef.current.delete(addr.toLowerCase())
            );
            return;
          }
          console.log(
            `Retrying markets load: ${previousBatchSize} -> ${batchSize}`
          );
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    },
    [publicClient, contractConfig.marketFactoryAddress, processBatchResult]
  );

  // Core function to fetch markets from contract
  const fetchMarkets = useCallback(
    async (addressesToLoad: `0x${string}`[]) => {
      if (!contractConfig.marketFactoryAddress) return;

      // Process in chunks for progress (using initial batch size for chunking)
      const chunkSize = MARKETS_BATCH_SIZE_INITIAL;
      for (let i = 0; i < addressesToLoad.length; i += chunkSize) {
        const chunk = addressesToLoad.slice(
          i,
          Math.min(i + chunkSize, addressesToLoad.length)
        );
        await fetchBatchWithRetry(chunk);

        // Small delay between chunks
        if (i + chunkSize < addressesToLoad.length) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    },
    [contractConfig.marketFactoryAddress, fetchBatchWithRetry]
  );

  const loadMarketsForPolls = useCallback(
    (pollAddresses: `0x${string}`[]) => {
      if (!contractConfig.marketFactoryAddress) return;

      // Filter out addresses we already have or are pending
      const newAddresses = pollAddresses.filter(
        (addr) =>
          !marketsMap.has(addr.toLowerCase()) &&
          !pendingAddressesRef.current.has(addr.toLowerCase())
      );

      if (newAddresses.length === 0) return;

      // Add to pending set
      newAddresses.forEach((addr) =>
        pendingAddressesRef.current.add(addr.toLowerCase())
      );

      // If already loading, the pending addresses will be picked up
      if (isLoadingRef.current) return;

      const loadBatches = async () => {
        isLoadingRef.current = true;
        setIsLoading(true);

        try {
          // Get all pending addresses
          const addressesToLoad = Array.from(pendingAddressesRef.current).map(
            (addr) => addr as `0x${string}`
          );

          await fetchMarkets(addressesToLoad);
        } finally {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      };

      loadBatches();
    },
    [
      contractConfig.marketFactoryAddress,
      marketsMap,
      fetchMarkets,
    ]
  );

  // Force refresh markets for given poll addresses (ignores cache)
  const refreshMarketsForPolls = useCallback(
    (pollAddresses: `0x${string}`[]) => {
      if (!contractConfig.marketFactoryAddress) return;
      if (pollAddresses.length === 0) return;

      const doRefresh = async () => {
        setIsLoading(true);
        try {
          await fetchMarkets(pollAddresses);
        } finally {
          setIsLoading(false);
        }
      };

      doRefresh();
    },
    [contractConfig.marketFactoryAddress, fetchMarkets]
  );

  // Clear markets map when marketFactoryAddress changes
  useEffect(() => {
    setMarketsMap(new Map());
    pendingAddressesRef.current.clear();
  }, [contractConfig.marketFactoryAddress]);

  // Auto-refresh all cached markets every epoch (yesChance depends on time for Pari-Mutuel)
  // Also updates epochTick which market pages can use to trigger their own refresh
  useEffect(() => {
    if (!contractConfig.marketFactoryAddress) return;

    const epochMs = contractConfig.epochLength * 1000;
    const intervalId = window.setInterval(() => {
      // Update epochTick to notify subscribers (market pages)
      setEpochTick((prev) => prev + 1);

      // Get all currently cached poll addresses
      const cachedAddresses = Array.from(marketsMapRef.current.keys()).map(
        (addr) => addr as `0x${string}`
      );

      if (cachedAddresses.length > 0 && !isLoadingRef.current) {
        console.debug(
          `[Markets] Epoch refresh: updating ${cachedAddresses.length} markets`
        );
        // Refresh all cached markets silently (without setting isLoading to avoid UI flicker)
        fetchMarkets(cachedAddresses);
      }
    }, epochMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [contractConfig.marketFactoryAddress, contractConfig.epochLength, fetchMarkets]);

  // Trim cache to only keep specified poll addresses (memory cleanup)
  const trimMarketsCache = useCallback((keepPollAddresses: `0x${string}`[]) => {
    const keepSet = new Set(
      keepPollAddresses.map((addr) => addr.toLowerCase())
    );

    setMarketsMap((prev) => {
      const newMap = new Map<string, PollMarkets>();
      for (const [addr, markets] of prev) {
        if (keepSet.has(addr)) {
          newMap.set(addr, markets);
        }
      }
      return newMap;
    });
  }, []);

  // Getter to bypass closure issues - always returns the current marketsMap
  const getMarketsMap = useCallback(() => marketsMapRef.current, []);

  const value: MarketsContextValue = useMemo(
    () => ({
      marketsMap,
      isLoading,
      loadMarketsForPolls,
      refreshMarketsForPolls,
      trimMarketsCache,
      getMarketsMap,
      epochTick,
      recentActivity,
    }),
    [
      marketsMap,
      isLoading,
      loadMarketsForPolls,
      refreshMarketsForPolls,
      trimMarketsCache,
      getMarketsMap,
      epochTick,
      recentActivity,
    ]
  );

  return (
    <MarketsContext.Provider value={value}>{children}</MarketsContext.Provider>
  );
};
