import { useEffect, useState, useCallback, useRef } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { formatEther, formatUnits } from "viem";
import {
  Loader2,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  PREDICTION_ORACLE_ABI,
  PollStatus,
  MARKET_FACTORY_ABI,
  MARKET_CONSTANTS,
} from "@/config/abi";
import { getContractConfig, COLLATERAL_TOKENS } from "@/config/contract";
import { clearPollsCache } from "@/utils/pollsCache";
import { usePolls } from "@/hooks/usePolls";
import { useMarkets } from "@/hooks/useMarkets";
import { AMM_ABI } from "@/config/ammAbi";
import { PARI_MUTUEL_ABI } from "@/config/pariMutuelAbi";

const Stats = () => {
  const contractConfig = getContractConfig();
  const publicClient = usePublicClient();
  const { allPolls, isLoading, loadProgress } = usePolls();
  const { marketsMap, loadMarketsForPolls, epochTick } = useMarkets();

  const [totalPolls, setTotalPolls] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0n);
  const [totalTrades, setTotalTrades] = useState(0);
  const [isLoadingVolume, setIsLoadingVolume] = useState(false);

  // Cache to avoid recalculating volume stats unnecessarily
  // Recalculates when: markets count changes OR epochTick changes
  const volumeStatsCache = useRef<{
    marketsCount: number;
    epochTick: number;
    volume: bigint;
    trades: number;
  } | null>(null);

  const collateralToken = COLLATERAL_TOKENS[0];

  // Get fees
  const { data: operatorGasFee } = useReadContract({
    address: contractConfig.address,
    abi: PREDICTION_ORACLE_ABI,
    functionName: "operatorGasFee",
  });

  const { data: protocolFee } = useReadContract({
    address: contractConfig.address,
    abi: PREDICTION_ORACLE_ABI,
    functionName: "protocolFee",
  });

  const _totalFee =
    operatorGasFee && protocolFee ? operatorGasFee + protocolFee : 0n;
  void _totalFee; // Used in bottom section

  // MarketFactory reads
  const { data: factoryProtocolFeeRate } = useReadContract({
    address: contractConfig.marketFactoryAddress,
    abi: MARKET_FACTORY_ABI,
    functionName: "protocolFeeRate",
  });

  const { data: whitelistedCollaterals } = useReadContract({
    address: contractConfig.marketFactoryAddress,
    abi: MARKET_FACTORY_ABI,
    functionName: "getWhitelistedCollaterals",
  });

  const { data: marketCloseBuffer } = useReadContract({
    address: contractConfig.marketFactoryAddress,
    abi: MARKET_FACTORY_ABI,
    functionName: "marketCloseBufferEpochs",
  });

  const { data: platformTreasury } = useReadContract({
    address: contractConfig.marketFactoryAddress,
    abi: MARKET_FACTORY_ABI,
    functionName: "platformTreasury",
  });

  // Load markets for all polls
  useEffect(() => {
    if (allPolls.length > 0) {
      loadMarketsForPolls(allPolls.map((p) => p.pollAddress));
    }
  }, [allPolls, loadMarketsForPolls]);

  // Fetch volume and trades from all markets (optimized with parallel requests + caching)
  const fetchVolumeStats = useCallback(async (forceRefresh = false) => {
    if (!publicClient || marketsMap.size === 0) return;

    // Check cache: use cached data if markets count AND epochTick are the same
    const cache = volumeStatsCache.current;
    if (!forceRefresh && cache && 
        cache.marketsCount === marketsMap.size && 
        cache.epochTick === epochTick) {
      setTotalVolume(cache.volume);
      setTotalTrades(cache.trades);
      return;
    }

    setIsLoadingVolume(true);

    try {
      // Collect all market addresses
      const ammAddresses: `0x${string}`[] = [];
      const pariAddresses: `0x${string}`[] = [];

      marketsMap.forEach((markets) => {
        if (markets.amm?.marketAddress) {
          ammAddresses.push(markets.amm.marketAddress);
        }
        if (markets.pariMutuel?.marketAddress) {
          pariAddresses.push(markets.pariMutuel.marketAddress);
        }
      });

      // Helper to fetch all candles/snapshots for a single market with pagination
      const fetchAmmVolume = async (addr: `0x${string}`) => {
        let volume = 0n;
        let trades = 0;
        let offset = 0;
        let hasMore = true;
        
        while (hasMore) {
          try {
            const result = await publicClient.readContract({
              address: addr,
              abi: AMM_ABI,
              functionName: "getRecentHourlyCandles",
              args: [offset, 100],
            });
            const candles = result[0] as readonly { volume: bigint; trades: number }[];
            const more = result[1] as boolean;
            
            for (const c of candles) {
              volume += c.volume;
              trades += c.trades;
            }
            hasMore = more;
            offset += 100;
          } catch {
            hasMore = false;
          }
        }
        return { volume, trades };
      };

      const fetchPariVolume = async (addr: `0x${string}`) => {
        let volume = 0n;
        let trades = 0;
        let offset = 0;
        let hasMore = true;
        
        while (hasMore) {
          try {
            const result = await publicClient.readContract({
              address: addr,
              abi: PARI_MUTUEL_ABI,
              functionName: "getRecentHourlySnapshots",
              args: [offset, 100],
            });
            const snapshots = result[0] as readonly { volume: bigint; bets: number }[];
            const more = result[1] as boolean;
            
            for (const s of snapshots) {
              volume += s.volume;
              trades += s.bets;
            }
            hasMore = more;
            offset += 100;
          } catch {
            hasMore = false;
          }
        }
        return { volume, trades };
      };

      // Fetch all markets in parallel
      const [ammResults, pariResults] = await Promise.all([
        Promise.all(ammAddresses.map(fetchAmmVolume)),
        Promise.all(pariAddresses.map(fetchPariVolume)),
      ]);

      // Sum up results
      let totalVol = 0n;
      let totalTrd = 0;

      for (const r of ammResults) {
        totalVol += r.volume;
        totalTrd += r.trades;
      }
      for (const r of pariResults) {
        totalVol += r.volume;
        totalTrd += r.trades;
      }

      // Update cache
      volumeStatsCache.current = {
        marketsCount: marketsMap.size,
        epochTick,
        volume: totalVol,
        trades: totalTrd,
      };

      setTotalVolume(totalVol);
      setTotalTrades(totalTrd);
    } catch (error) {
      console.error("Failed to fetch volume stats:", error);
    } finally {
      setIsLoadingVolume(false);
    }
  }, [publicClient, marketsMap, epochTick]);

  // Trigger volume fetch when markets are loaded or epoch changes
  useEffect(() => {
    if (marketsMap.size > 0 && !isLoading) {
      fetchVolumeStats();
    }
  }, [marketsMap.size, isLoading, epochTick, fetchVolumeStats]);

  // Calculate stats from all loaded polls
  useEffect(() => {
    setTotalPolls(allPolls.length);

    let pending = 0;
    let resolved = 0;

    allPolls.forEach((poll) => {
      if (poll.status === PollStatus.Pending) {
        pending++;
      } else if (
        poll.status === PollStatus.Yes ||
        poll.status === PollStatus.No ||
        poll.status === PollStatus.Unknown
      ) {
        resolved++;
      }
    });

    setPendingCount(pending);
    setResolvedCount(resolved);
  }, [allPolls]);

  // Format volume for display
  const formatVolume = (vol: bigint) => {
    const formatted = Number(formatUnits(vol, collateralToken.decimals));
    if (formatted >= 1_000_000) {
      return `$${(formatted / 1_000_000).toFixed(2)}M`;
    } else if (formatted >= 1_000) {
      return `$${(formatted / 1_000).toFixed(2)}K`;
    }
    return `$${formatted.toFixed(2)}`;
  };

  const stats = [
    {
      icon: TrendingUp,
      label: "Total Polls",
      value: totalPolls.toString(),
      color: "text-primary-500",
      bgColor: "bg-primary-500/10",
      isLoading: false,
    },
    {
      icon: Clock,
      label: "Pending",
      value: pendingCount.toString(),
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      isLoading: false,
    },
    {
      icon: Users,
      label: "Resolved",
      value: resolvedCount.toString(),
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      isLoading: false,
    },
    {
      icon: BarChart3,
      label: "Total Volume",
      value: formatVolume(totalVolume),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      isLoading: isLoadingVolume,
    },
    {
      icon: Activity,
      label: "Total Trades",
      value: totalTrades.toLocaleString(),
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      isLoading: isLoadingVolume,
    },
  ];

  const handleClearCache = () => {
    if (confirm("Clear cache and reload? This will refresh the page.")) {
      clearPollsCache(contractConfig.address);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Statistics
        </h2>
        <button onClick={handleClearCache} className="btn-secondary text-sm">
          Clear Cache
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-primary-600 dark:text-primary-400 animate-spin" />
              <div>
                <p className="text-gray-900 dark:text-white font-medium text-sm">
                  Loading statistics...
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Progress: {loadProgress}%
                </p>
              </div>
            </div>
            <div className="w-48 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    {stat.label}
                  </p>
                  {stat.isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded animate-pulse" />
                      <Loader2 className={`w-4 h-4 ${stat.color} animate-spin`} />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Oracle Contract Info */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Oracle Contract Information
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Contract Address:
            </span>
            <a
              href={`${contractConfig.blockExplorerUrl}/address/${contractConfig.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-mono"
            >
              {contractConfig.address.slice(0, 10)}...
              {contractConfig.address.slice(-8)}
            </a>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Operator Gas Fee:
            </span>
            <span className="text-gray-900 dark:text-white">
              {operatorGasFee ? formatEther(operatorGasFee) : "0"} S
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Protocol Fee:
            </span>
            <span className="text-gray-900 dark:text-white">
              {protocolFee ? formatEther(protocolFee) : "0"} S
            </span>
          </div>
        </div>
      </div>

      {/* MarketFactory Contract Info */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          MarketFactory Contract Information
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Contract Address:
            </span>
            <a
              href={`${contractConfig.blockExplorerUrl}/address/${contractConfig.marketFactoryAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-mono"
            >
              {contractConfig.marketFactoryAddress.slice(0, 10)}...
              {contractConfig.marketFactoryAddress.slice(-8)}
            </a>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Protocol Fee Rate:
            </span>
            <span className="text-gray-900 dark:text-white">
              {factoryProtocolFeeRate !== undefined
                ? `${(
                    (Number(factoryProtocolFeeRate) /
                      MARKET_CONSTANTS.BPS_DENOMINATOR) *
                    100
                  ).toFixed(2)}%`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Market Close Buffer:
            </span>
            <span className="text-gray-900 dark:text-white">
              {marketCloseBuffer !== undefined
                ? (() => {
                    const totalMinutes = Number(marketCloseBuffer) * (contractConfig.epochLength / 60);
                    if (totalMinutes >= 60) {
                      const hours = Math.floor(totalMinutes / 60);
                      const mins = totalMinutes % 60;
                      return mins > 0 
                        ? `${hours}h ${mins}m` 
                        : `${hours} hour${hours !== 1 ? "s" : ""}`;
                    }
                    return `${totalMinutes} minute${totalMinutes !== 1 ? "s" : ""}`;
                  })()
                : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Platform Treasury:
            </span>
            {platformTreasury ? (
              <a
                href={`${contractConfig.blockExplorerUrl}/address/${platformTreasury}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-mono"
              >
                {platformTreasury.slice(0, 10)}...{platformTreasury.slice(-8)}
              </a>
            ) : (
              <span className="text-gray-900 dark:text-white">—</span>
            )}
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block mb-2">
              Whitelisted Collaterals:
            </span>
            {whitelistedCollaterals && whitelistedCollaterals.length > 0 ? (
              <ul className="space-y-1 pl-4">
                {(whitelistedCollaterals as readonly `0x${string}`[]).map(
                  (addr) => {
                    const token = COLLATERAL_TOKENS.find(
                      (t) => t.address.toLowerCase() === addr.toLowerCase()
                    );
                    return (
                      <li
                        key={addr}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-900 dark:text-white">
                          {token ? token.symbol : "Unknown"}
                        </span>
                        <a
                          href={`${contractConfig.blockExplorerUrl}/address/${addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-mono text-xs"
                        >
                          {addr.slice(0, 6)}...{addr.slice(-4)}
                        </a>
                      </li>
                    );
                  }
                )}
              </ul>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm pl-4">
                No collaterals whitelisted
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
