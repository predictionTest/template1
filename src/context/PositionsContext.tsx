import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAccount, usePublicClient } from "wagmi";
import { AMM_ABI } from "@/config/ammAbi";
import { PARI_MUTUEL_ABI, PariMutuelPosition, POLL_ABI } from "@/config/pariMutuelAbi";
import { ERC20_ABI } from "@/config/abi";
import { MarketsContext } from "./MarketsContext";
import { usePolls } from "@/hooks/usePolls";
import { PollInfo, MarketState } from "@/types";

// Initial batch size for positions scanning (will reduce on errors)
// Each poll generates 5-7 multicall calls
const POSITIONS_BATCH_SIZE_INITIAL = 200;
const POSITIONS_BATCH_SIZE_MIN = 10;

export interface AmmPosition {
  marketAddress: `0x${string}`;
  yesBalance: bigint;
  noBalance: bigint;
  lpBalance: bigint;
  yesPrice: number; // 0-100
  isLive: boolean;
  tvl: bigint;
}

export interface PariPosition {
  marketAddress: `0x${string}`;
  yesShares: bigint;
  noShares: bigint;
  totalStaked: bigint;
  isLive: boolean;
  tvl: bigint;
  yesPrice: number; // 0-100
}

export interface UserPosition {
  pollAddress: `0x${string}`;
  pollQuestion: string;
  pollStatus: number;
  isFinalized: boolean;
  closeTimestamp: number;
  amm: AmmPosition | null;
  pari: PariPosition | null;
  // Calculated total value in collateral
  totalValue: bigint;
}

export interface PositionsContextValue {
  positions: UserPosition[];
  isLoading: boolean;
  loadProgress: number;
  // Scan all markets for user positions
  scanAllPositions: () => Promise<void>;
  // Update a single market's position (after trade)
  refreshPosition: (
    pollAddress: `0x${string}`,
    marketType: "amm" | "pari"
  ) => Promise<void>;
  // Check if initial scan is done
  hasScanned: boolean;
}

export const PositionsContext = createContext<PositionsContextValue | undefined>(
  undefined
);

export const usePositions = () => {
  const context = useContext(PositionsContext);
  if (!context) {
    throw new Error("usePositions must be used within PositionsProvider");
  }
  return context;
};

// AMM price scale
const AMM_PRICE_SCALE = 1_000_000_000;

// Helper to load markets with progress tracking
// Uses getMarketsMap function to always get fresh map reference
async function loadAllMarketsWithProgress(
  pollAddresses: `0x${string}`[],
  refreshMarketsForPolls: (addresses: `0x${string}`[]) => void,
  getMarketsMap: () => Map<string, { amm: MarketState | null; pariMutuel: MarketState | null }>,
  setProgress: (progress: number) => void
): Promise<Map<string, { amm: MarketState | null; pariMutuel: MarketState | null }>> {
  // Start the refresh
  refreshMarketsForPolls(pollAddresses);
  
  // Wait for loading to complete with progress updates
  let retries = 0;
  const maxRetries = 40; // 20 seconds max wait
  let lastLoadedCount = 0;
  let stableCount = 0;
  
  while (retries < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Use getter to always get current map (bypasses closure issues)
    const currentMap = getMarketsMap();
    const loadedCount = pollAddresses.filter(
      (addr) => currentMap.has(addr.toLowerCase())
    ).length;
    
    setProgress(Math.round((loadedCount / pollAddresses.length) * 50));
    console.log(`Portfolio: Markets loaded ${loadedCount}/${pollAddresses.length}`);
    
    // Check if loading is complete
    if (loadedCount >= pollAddresses.length * 0.95) break;
    
    // If count hasn't changed for 4 iterations and we have substantial data, proceed
    if (loadedCount === lastLoadedCount) {
      stableCount++;
      // If loading stalled but we have most markets, proceed
      if (stableCount >= 4 && loadedCount > pollAddresses.length * 0.5) {
        console.log(`Portfolio: Markets loading stalled at ${loadedCount}, proceeding...`);
        break;
      }
      // If completely stalled with minimal data, try a bit longer
      if (stableCount >= 8) {
        console.log(`Portfolio: Markets loading timed out at ${loadedCount}`);
        break;
      }
    } else {
      stableCount = 0;
    }
    lastLoadedCount = loadedCount;
    retries++;
  }
  
  // Return the final fresh map
  return getMarketsMap();
}

export const PositionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { allPolls } = usePolls();
  const marketsContext = useContext(MarketsContext);

  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const isLoadingRef = useRef(false);

  // Cache: pollAddress -> position data
  const positionsCache = useRef<Map<string, UserPosition>>(new Map());

  // Scan a batch of polls for user positions
  const scanBatch = useCallback(
    async (
      polls: PollInfo[],
      marketsMap: Map<string, { amm: MarketState | null; pariMutuel: MarketState | null }>
    ): Promise<UserPosition[]> => {
      if (!publicClient || !address) return [];

      const results: UserPosition[] = [];

      // Build multicall contracts array
      const contracts: {
        address: `0x${string}`;
        abi: readonly unknown[];
        functionName: string;
        args?: readonly unknown[];
      }[] = [];

      // Track which calls belong to which poll/market
      const callMap: {
        pollIndex: number;
        type: "amm_yes" | "amm_no" | "amm_lp" | "amm_state" | "pari_position" | "poll_finalized";
        marketAddress: `0x${string}`;
      }[] = [];

      for (let i = 0; i < polls.length; i++) {
        const poll = polls[i];
        const markets = marketsMap.get(poll.pollAddress.toLowerCase());

        // Always get poll finalized status
        contracts.push({
          address: poll.pollAddress,
          abi: POLL_ABI,
          functionName: "getFinalizedStatus",
        });
        callMap.push({ pollIndex: i, type: "poll_finalized", marketAddress: poll.pollAddress });

        if (markets?.amm) {
          const ammAddr = markets.amm.marketAddress;

          // Get YES token address first, then balance
          contracts.push({
            address: ammAddr,
            abi: AMM_ABI,
            functionName: "yesToken",
          });
          callMap.push({ pollIndex: i, type: "amm_yes", marketAddress: ammAddr });

          contracts.push({
            address: ammAddr,
            abi: AMM_ABI,
            functionName: "noToken",
          });
          callMap.push({ pollIndex: i, type: "amm_no", marketAddress: ammAddr });

          // LP balance
          contracts.push({
            address: ammAddr,
            abi: AMM_ABI,
            functionName: "balanceOf",
            args: [address],
          });
          callMap.push({ pollIndex: i, type: "amm_lp", marketAddress: ammAddr });

          // Market state for price
          contracts.push({
            address: ammAddr,
            abi: AMM_ABI,
            functionName: "marketState",
          });
          callMap.push({ pollIndex: i, type: "amm_state", marketAddress: ammAddr });
        }

        if (markets?.pariMutuel) {
          const pariAddr = markets.pariMutuel.marketAddress;

          contracts.push({
            address: pariAddr,
            abi: PARI_MUTUEL_ABI,
            functionName: "getPosition",
            args: [address],
          });
          callMap.push({ pollIndex: i, type: "pari_position", marketAddress: pariAddr });
        }
      }

      if (contracts.length === 0) return [];

      try {
        // Execute multicall
        const multicallResults = await publicClient.multicall({
          contracts: contracts as Parameters<typeof publicClient.multicall>[0]["contracts"],
        });

        // Now we need to get token balances for AMM (yesToken, noToken addresses)
        const tokenBalanceCalls: {
          address: `0x${string}`;
          abi: readonly unknown[];
          functionName: string;
          args: readonly unknown[];
        }[] = [];
        const tokenCallMap: { pollIndex: number; type: "yes_balance" | "no_balance" }[] = [];

        // Process first batch results
        const ammData: Map<
          number,
          {
            yesTokenAddr?: `0x${string}`;
            noTokenAddr?: `0x${string}`;
            lpBalance?: bigint;
            isLive?: boolean;
            tvl?: bigint;
            yesPrice?: number;
            marketAddress: `0x${string}`;
          }
        > = new Map();

        const pariData: Map<
          number,
          {
            position?: PariMutuelPosition;
            marketAddress: `0x${string}`;
            isLive: boolean;
            tvl: bigint;
            yesPrice: number;
          }
        > = new Map();

        // Poll finalized status: pollIndex -> isFinalized
        const pollFinalizedData: Map<number, boolean> = new Map();

        for (let i = 0; i < multicallResults.length; i++) {
          const result = multicallResults[i];
          const callInfo = callMap[i];

          if (result.status !== "success") continue;

          if (callInfo.type === "poll_finalized") {
            const [isFinalized] = result.result as readonly [boolean, number];
            pollFinalizedData.set(callInfo.pollIndex, isFinalized);
          } else if (callInfo.type === "amm_yes") {
            if (!ammData.has(callInfo.pollIndex)) {
              ammData.set(callInfo.pollIndex, { marketAddress: callInfo.marketAddress });
            }
            ammData.get(callInfo.pollIndex)!.yesTokenAddr = result.result as `0x${string}`;
          } else if (callInfo.type === "amm_no") {
            if (!ammData.has(callInfo.pollIndex)) {
              ammData.set(callInfo.pollIndex, { marketAddress: callInfo.marketAddress });
            }
            ammData.get(callInfo.pollIndex)!.noTokenAddr = result.result as `0x${string}`;
          } else if (callInfo.type === "amm_lp") {
            if (!ammData.has(callInfo.pollIndex)) {
              ammData.set(callInfo.pollIndex, { marketAddress: callInfo.marketAddress });
            }
            ammData.get(callInfo.pollIndex)!.lpBalance = result.result as bigint;
          } else if (callInfo.type === "amm_state") {
            if (!ammData.has(callInfo.pollIndex)) {
              ammData.set(callInfo.pollIndex, { marketAddress: callInfo.marketAddress });
            }
            const state = result.result as readonly [boolean, bigint, number, `0x${string}`];
            ammData.get(callInfo.pollIndex)!.isLive = state[0];
            ammData.get(callInfo.pollIndex)!.tvl = state[1];
            ammData.get(callInfo.pollIndex)!.yesPrice = (Number(state[2]) / AMM_PRICE_SCALE) * 100;
          } else if (callInfo.type === "pari_position") {
            const markets = marketsMap.get(polls[callInfo.pollIndex].pollAddress.toLowerCase());
            pariData.set(callInfo.pollIndex, {
              position: result.result as PariMutuelPosition,
              marketAddress: callInfo.marketAddress,
              isLive: markets?.pariMutuel?.isLive ?? false,
              tvl: markets?.pariMutuel?.collateralTvl ?? 0n,
              yesPrice: markets?.pariMutuel
                ? (Number(markets.pariMutuel.yesChance) / AMM_PRICE_SCALE) * 100
                : 50,
            });
          }
        }

        // Build second batch for token balances
        for (const [pollIndex, data] of ammData) {
          if (data.yesTokenAddr) {
            tokenBalanceCalls.push({
              address: data.yesTokenAddr,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address],
            });
            tokenCallMap.push({ pollIndex, type: "yes_balance" });
          }
          if (data.noTokenAddr) {
            tokenBalanceCalls.push({
              address: data.noTokenAddr,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address],
            });
            tokenCallMap.push({ pollIndex, type: "no_balance" });
          }
        }

        // Execute second multicall for token balances
        let tokenBalances: Map<number, { yesBalance: bigint; noBalance: bigint }> = new Map();
        if (tokenBalanceCalls.length > 0) {
          const tokenResults = await publicClient.multicall({
            contracts: tokenBalanceCalls as Parameters<typeof publicClient.multicall>[0]["contracts"],
          });

          for (let i = 0; i < tokenResults.length; i++) {
            const result = tokenResults[i];
            const callInfo = tokenCallMap[i];

            if (result.status !== "success") continue;

            if (!tokenBalances.has(callInfo.pollIndex)) {
              tokenBalances.set(callInfo.pollIndex, { yesBalance: 0n, noBalance: 0n });
            }

            if (callInfo.type === "yes_balance") {
              tokenBalances.get(callInfo.pollIndex)!.yesBalance = result.result as bigint;
            } else if (callInfo.type === "no_balance") {
              tokenBalances.get(callInfo.pollIndex)!.noBalance = result.result as bigint;
            }
          }
        }

        // Now build final positions
        for (let i = 0; i < polls.length; i++) {
          const poll = polls[i];
          const ammInfo = ammData.get(i);
          const pariInfo = pariData.get(i);
          const tokenBals = tokenBalances.get(i);

          let ammPosition: AmmPosition | null = null;
          let pariPosition: PariPosition | null = null;

          // Check if user has AMM position
          if (ammInfo) {
            const yesBalance = tokenBals?.yesBalance ?? 0n;
            const noBalance = tokenBals?.noBalance ?? 0n;
            const lpBalance = ammInfo.lpBalance ?? 0n;

            if (yesBalance > 0n || noBalance > 0n || lpBalance > 0n) {
              ammPosition = {
                marketAddress: ammInfo.marketAddress,
                yesBalance,
                noBalance,
                lpBalance,
                yesPrice: ammInfo.yesPrice ?? 50,
                isLive: ammInfo.isLive ?? false,
                tvl: ammInfo.tvl ?? 0n,
              };
            }
          }

          // Check if user has Pari position
          if (pariInfo?.position) {
            const pos = pariInfo.position;
            if (pos.sharesYes > 0n || pos.sharesNo > 0n) {
              pariPosition = {
                marketAddress: pariInfo.marketAddress,
                yesShares: pos.sharesYes,
                noShares: pos.sharesNo,
                totalStaked: pos.collateralYes + pos.collateralNo,
                isLive: pariInfo.isLive,
                tvl: pariInfo.tvl,
                yesPrice: pariInfo.yesPrice,
              };
            }
          }

          // Only add if user has any position
          if (ammPosition || pariPosition) {
            // Calculate total value
            let totalValue = 0n;
            if (ammPosition) {
              // Approximate value: YES tokens * yesPrice + NO tokens * noPrice + LP (complex, use as-is)
              const yesValue =
                (ammPosition.yesBalance * BigInt(Math.floor(ammPosition.yesPrice * 1e6))) /
                100_000_000n;
              const noValue =
                (ammPosition.noBalance *
                  BigInt(Math.floor((100 - ammPosition.yesPrice) * 1e6))) /
                100_000_000n;
              // LP value is harder to calculate, approximate as proportional to TVL
              totalValue += yesValue + noValue + ammPosition.lpBalance;
            }
            if (pariPosition) {
              totalValue += pariPosition.totalStaked;
            }

            results.push({
              pollAddress: poll.pollAddress,
              pollQuestion: poll.question,
              pollStatus: poll.status,
              isFinalized: pollFinalizedData.get(i) ?? false,
              closeTimestamp: poll.deadlineEpoch,
              amm: ammPosition,
              pari: pariPosition,
              totalValue,
            });
          }
        }
      } catch (error) {
        console.error("Error scanning positions batch:", error);
      }

      return results;
    },
    [publicClient, address]
  );

  // Scan all markets for user positions
  const scanAllPositions = useCallback(async () => {
    if (!publicClient || !address || !marketsContext) {
      console.log("Portfolio: Missing dependencies", { publicClient: !!publicClient, address, marketsContext: !!marketsContext });
      return;
    }
    if (isLoadingRef.current) return;
    if (allPolls.length === 0) {
      console.log("Portfolio: No polls to scan");
      return;
    }

    // Clear cache for full rescan
    positionsCache.current.clear();
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setHasScanned(false); // Reset to show loading state
    setLoadProgress(0);

    const { refreshMarketsForPolls, getMarketsMap } = marketsContext;

    try {
      // First, ensure all markets are loaded (use refresh to force reload)
      const pollAddresses = allPolls.map((p: PollInfo) => p.pollAddress);
      console.log(`Portfolio: Loading markets for ${pollAddresses.length} polls...`);

      // Force reload ALL markets and get fresh map reference
      // Uses getMarketsMap to bypass closure issues
      const currentMarketsMap = await loadAllMarketsWithProgress(
        pollAddresses,
        refreshMarketsForPolls,
        getMarketsMap,
        setLoadProgress
      );

      // Filter polls that have markets
      const pollsWithMarkets = allPolls.filter((poll: PollInfo) => {
        const markets = currentMarketsMap.get(poll.pollAddress.toLowerCase());
        return markets?.amm || markets?.pariMutuel;
      });

      console.log(`Portfolio: Found ${pollsWithMarkets.length} polls with markets out of ${allPolls.length} total polls`);

      if (pollsWithMarkets.length === 0) {
        setPositions([]);
        setHasScanned(true);
        return;
      }

      const allPositions: UserPosition[] = [];
      let currentBatchSize = POSITIONS_BATCH_SIZE_INITIAL;

      // Process with adaptive batch sizing
      const scanBatchWithRetry = async (
        polls: PollInfo[],
        maxRetries = 3
      ): Promise<UserPosition[]> => {
        let batchSize = Math.min(currentBatchSize, polls.length);
        let attempt = 0;

        while (attempt < maxRetries) {
          try {
            const currentBatch = polls.slice(0, batchSize);
            const positions = await scanBatch(currentBatch, currentMarketsMap);

            // If we processed less than all polls, recursively process the rest
            if (batchSize < polls.length) {
              const remainingPositions = await scanBatchWithRetry(
                polls.slice(batchSize),
                maxRetries
              );
              return [...positions, ...remainingPositions];
            }

            return positions;
          } catch (error) {
            attempt++;
            const previousBatchSize = batchSize;
            batchSize = Math.max(POSITIONS_BATCH_SIZE_MIN, Math.floor(batchSize / 2));
            currentBatchSize = batchSize; // Remember reduced size for next batches
            
            if (attempt >= maxRetries) {
              console.error(`Failed to scan batch after ${maxRetries} retries`);
              return [];
            }
            console.log(`Retrying positions scan: ${previousBatchSize} -> ${batchSize}`);
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
        return [];
      };

      // Process in chunks for progress tracking
      const chunkSize = POSITIONS_BATCH_SIZE_INITIAL;
      for (let i = 0; i < pollsWithMarkets.length; i += chunkSize) {
        const chunk = pollsWithMarkets.slice(i, Math.min(i + chunkSize, pollsWithMarkets.length));
        const chunkPositions = await scanBatchWithRetry(chunk);
        allPositions.push(...chunkPositions);

        // Update progress (50-100% range for scanning)
        const scanProgress = Math.round(((i + chunk.length) / pollsWithMarkets.length) * 50);
        setLoadProgress(50 + scanProgress);

        // Update cache
        for (const pos of chunkPositions) {
          positionsCache.current.set(pos.pollAddress.toLowerCase(), pos);
        }

        // Small delay between chunks
        if (i + chunkSize < pollsWithMarkets.length) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      console.log(`Portfolio: Found ${allPositions.length} positions with balances`);
      setPositions(allPositions);
      setHasScanned(true);
      
      // Note: We intentionally do NOT trim the markets cache here.
      // Trimming was causing bugs when user clicks refresh - the trimmed markets
      // wouldn't reload properly due to stale closure references.
      // Memory cleanup can be done via explicit cache clear in settings if needed.
    } catch (error) {
      console.error("Error scanning positions:", error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      setLoadProgress(100);
    }
  }, [publicClient, address, allPolls, marketsContext, scanBatch]);

  // Refresh a single market's position
  const refreshPosition = useCallback(
    async (pollAddress: `0x${string}`, _marketType: "amm" | "pari") => {
      if (!publicClient || !address || !marketsContext) return;

      const { getMarketsMap } = marketsContext;
      const poll = allPolls.find(
        (p: PollInfo) => p.pollAddress.toLowerCase() === pollAddress.toLowerCase()
      );
      if (!poll) return;

      // Use getter to get current map
      const currentMarketsMap = getMarketsMap();
      const markets = currentMarketsMap.get(pollAddress.toLowerCase());
      if (!markets) return;

      try {
        const batchPositions = await scanBatch([poll], currentMarketsMap);

        if (batchPositions.length > 0) {
          const newPosition = batchPositions[0];
          positionsCache.current.set(pollAddress.toLowerCase(), newPosition);

          setPositions((prev) => {
            const index = prev.findIndex(
              (p) => p.pollAddress.toLowerCase() === pollAddress.toLowerCase()
            );
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = newPosition;
              return updated;
            } else {
              return [...prev, newPosition];
            }
          });
        } else {
          // User no longer has a position
          positionsCache.current.delete(pollAddress.toLowerCase());
          setPositions((prev) =>
            prev.filter(
              (p) => p.pollAddress.toLowerCase() !== pollAddress.toLowerCase()
            )
          );
        }
      } catch (error) {
        console.error("Error refreshing position:", error);
      }
    },
    [publicClient, address, allPolls, marketsContext, scanBatch]
  );

  const value: PositionsContextValue = useMemo(
    () => ({
      positions,
      isLoading,
      loadProgress,
      scanAllPositions,
      refreshPosition,
      hasScanned,
    }),
    [positions, isLoading, loadProgress, scanAllPositions, refreshPosition, hasScanned]
  );

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
};

