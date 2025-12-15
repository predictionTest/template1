import { useEffect, useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import {
  Wallet,
  Loader2,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Coins,
} from "lucide-react";
import { usePositions, UserPosition } from "@/context/PositionsContext";
import { usePolls } from "@/hooks/usePolls";
import { PollStatus } from "@/config/abi";

type MarketTab = "amm" | "pari";
type StatusFilter = "all" | "active" | "closed" | "resolved";
type SortType = "value" | "expires" | "name";

interface PortfolioProps {
  onMarketClick?: (
    marketAddress: `0x${string}`,
    marketType: "amm" | "pariMutuel",
    pollAddress: `0x${string}`
  ) => void;
}

const Portfolio = ({ onMarketClick }: PortfolioProps) => {
  const { address, isConnected } = useAccount();
  const {
    allPolls,
    isLoading: isPollsLoading,
    loadProgress: pollsProgress,
  } = usePolls();
  const { positions, isLoading, loadProgress, scanAllPositions, hasScanned } =
    usePositions();

  const [marketTab, setMarketTab] = useState<MarketTab>("amm");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortType>("value");

  // Scan positions when first visiting Portfolio (only after polls are loaded)
  useEffect(() => {
    if (
      isConnected &&
      address &&
      !hasScanned &&
      !isLoading &&
      !isPollsLoading &&
      allPolls.length > 0
    ) {
      scanAllPositions();
    }
  }, [
    isConnected,
    address,
    hasScanned,
    isLoading,
    isPollsLoading,
    allPolls.length,
    scanAllPositions,
  ]);

  // Separate positions by market type
  const { ammPositions, pariPositions } = useMemo(() => {
    const amm: UserPosition[] = [];
    const pari: UserPosition[] = [];

    for (const pos of positions) {
      if (pos.amm) amm.push(pos);
      if (pos.pari) pari.push(pos);
    }

    return { ammPositions: amm, pariPositions: pari };
  }, [positions]);

  // Filter and sort current tab positions
  const filteredPositions = useMemo(() => {
    const basePositions = marketTab === "amm" ? ammPositions : pariPositions;
    let result = [...basePositions];

    // Apply status filter
    // Active = market is live
    // Closed = market closed, waiting for finalization (!isFinalized)
    // Resolved = poll finalized (isFinalized === true)
    switch (statusFilter) {
      case "active":
        result = result.filter((p) => {
          const market = marketTab === "amm" ? p.amm : p.pari;
          return market?.isLive;
        });
        break;
      case "closed":
        result = result.filter((p) => {
          const market = marketTab === "amm" ? p.amm : p.pari;
          // Closed = market not live AND not finalized
          return !market?.isLive && !p.isFinalized;
        });
        break;
      case "resolved":
        result = result.filter((p) => p.isFinalized);
        break;
    }

    // Apply sort
    switch (sortBy) {
      case "value":
        result.sort((a, b) => Number(b.totalValue - a.totalValue));
        break;
      case "expires":
        result.sort((a, b) => a.closeTimestamp - b.closeTimestamp);
        break;
      case "name":
        result.sort((a, b) => a.pollQuestion.localeCompare(b.pollQuestion));
        break;
    }

    return result;
  }, [marketTab, ammPositions, pariPositions, statusFilter, sortBy]);

  // Calculate summary for current tab
  const summary = useMemo(() => {
    const tabPositions = marketTab === "amm" ? ammPositions : pariPositions;
    let totalValue = 0n;
    let activeCount = 0;
    let closedCount = 0;
    let resolvedCount = 0;

    for (const pos of tabPositions) {
      const market = marketTab === "amm" ? pos.amm : pos.pari;
      if (marketTab === "amm" && pos.amm) {
        // AMM value calculation
        const yesValue =
          (pos.amm.yesBalance * BigInt(Math.floor(pos.amm.yesPrice * 1e6))) /
          100_000_000n;
        const noValue =
          (pos.amm.noBalance *
            BigInt(Math.floor((100 - pos.amm.yesPrice) * 1e6))) /
          100_000_000n;
        totalValue += yesValue + noValue + pos.amm.lpBalance;
      } else if (marketTab === "pari" && pos.pari) {
        totalValue += pos.pari.totalStaked;
      }

      // Count by status
      if (market?.isLive) {
        activeCount++;
      } else if (pos.isFinalized) {
        // Resolved = finalized
        resolvedCount++;
      } else {
        // Closed = market not live, waiting for finalization
        closedCount++;
      }
    }

    return {
      totalValue,
      activeCount,
      closedCount,
      resolvedCount,
      totalPositions: tabPositions.length,
    };
  }, [marketTab, ammPositions, pariPositions]);

  const formatAmount = (value: bigint, decimals = 6) => {
    const num = Number(formatUnits(value, decimals));
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getStatusBadge = (pos: UserPosition) => {
    // Check if user can claim (finalized with Yes/No outcome)
    const canClaim =
      pos.isFinalized &&
      (pos.pollStatus === PollStatus.Yes || pos.pollStatus === PollStatus.No);

    if (pos.pollStatus === PollStatus.Yes) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
          {canClaim && <Coins className="w-3 h-3" />}
          YES Won
        </span>
      );
    }
    if (pos.pollStatus === PollStatus.No) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
          {canClaim && <Coins className="w-3 h-3" />}
          NO Won
        </span>
      );
    }
    if (pos.pollStatus === PollStatus.Unknown) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">
          Unknown
        </span>
      );
    }
    const market = marketTab === "amm" ? pos.amm : pos.pari;
    if (market?.isLive) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
          Live
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
        Closed
      </span>
    );
  };

  const handlePositionClick = (pos: UserPosition) => {
    if (!onMarketClick) return;

    if (marketTab === "amm" && pos.amm) {
      onMarketClick(pos.amm.marketAddress, "amm", pos.pollAddress);
    } else if (marketTab === "pari" && pos.pari) {
      onMarketClick(pos.pari.marketAddress, "pariMutuel", pos.pollAddress);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Wallet className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-400 text-center max-w-md">
          Connect your wallet to view your positions across all prediction
          markets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 md:w-6 md:h-6" />
            Portfolio
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Track all your prediction market positions
          </p>
        </div>

        <button
          onClick={scanAllPositions}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title={
            isLoading ? `Scanning... ${loadProgress}%` : "Refresh positions"
          }
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Loading State - Polls loading */}
      {isPollsLoading && (
        <div className="card p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-white font-medium">Loading polls data...</p>
          <p className="text-gray-400 text-sm mt-1">
            {pollsProgress}% complete
          </p>
          <div className="w-full max-w-xs mx-auto mt-4 bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${pollsProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading State - Scanning positions */}
      {!isPollsLoading && isLoading && !hasScanned && (
        <div className="card p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-white font-medium">
            {loadProgress < 50
              ? "Loading markets data..."
              : "Scanning your positions..."}
          </p>
          <p className="text-gray-400 text-sm mt-1">{loadProgress}% complete</p>
          <div className="w-full max-w-xs mx-auto mt-4 bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content - Only show when scanned */}
      {hasScanned && !isPollsLoading && (
        <>
          {/* Market Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMarketTab("amm");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all text-sm md:text-base ${
                marketTab === "amm"
                  ? "bg-slate-200 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                  : "bg-white/60 dark:bg-slate-800 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white border border-transparent"
              }`}
            >
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              AMM
              <span
                className={`px-1.5 md:px-2 py-0.5 rounded-full text-xs ${
                  marketTab === "amm" ? "bg-slate-600" : "bg-slate-700"
                }`}
              >
                {ammPositions.length}
              </span>
            </button>
            <button
              onClick={() => {
                setMarketTab("pari");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all text-sm md:text-base ${
                marketTab === "pari"
                  ? "bg-slate-200 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                  : "bg-white/60 dark:bg-slate-800 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white border border-transparent"
              }`}
            >
              <Coins className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">PariMutuel</span>
              <span className="sm:hidden">Pari</span>
              <span
                className={`px-1.5 md:px-2 py-0.5 rounded-full text-xs ${
                  marketTab === "pari" ? "bg-slate-600" : "bg-slate-700"
                }`}
              >
                {pariPositions.length}
              </span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
            <div className="card p-2 md:p-3 col-span-4 md:col-span-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Coins className="w-3 h-3" />
                Total Value
              </div>
              <div className="text-lg md:text-xl font-bold text-white truncate">
                ${formatAmount(summary.totalValue)}
              </div>
            </div>

            <div className="card p-2 md:p-3">
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                <BarChart3 className="w-3 h-3 hidden sm:block" />
                All
              </div>
              <div className="text-lg md:text-xl font-bold text-white">
                {summary.totalPositions}
              </div>
            </div>

            <div className="card p-2 md:p-3">
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                <TrendingUp className="w-3 h-3 hidden sm:block" />
                Active
              </div>
              <div className="text-lg md:text-xl font-bold text-green-400">
                {summary.activeCount}
              </div>
            </div>

            <div className="card p-2 md:p-3">
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                <AlertCircle className="w-3 h-3 hidden sm:block" />
                Closed
              </div>
              <div className="text-lg md:text-xl font-bold text-amber-400">
                {summary.closedCount}
              </div>
            </div>

            <div className="card p-2 md:p-3">
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                <Wallet className="w-3 h-3 hidden sm:block" />
                Resolved
              </div>
              <div className="text-lg md:text-xl font-bold text-primary-400">
                {summary.resolvedCount}
              </div>
            </div>
          </div>

          {/* Status Filters & Sort */}
          <div className="card p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Status Filter Buttons */}
              <div className="flex gap-1.5 md:gap-2">
                {(
                  [
                    ["all", "All"],
                    ["active", "Active"],
                    ["closed", "Closed"],
                    ["resolved", "Resolved"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      statusFilter === key
                        ? "bg-slate-200 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                        : "bg-white/60 dark:bg-slate-700 text-slate-500 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-transparent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs md:text-sm">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="value">Value</option>
                  <option value="expires">Expires Soon</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Positions List */}
          <div className="space-y-2 md:space-y-3">
            {filteredPositions.length === 0 ? (
              <div className="card p-6 md:p-8 text-center">
                <Wallet className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-3 md:mb-4" />
                <p className="text-gray-400 text-sm md:text-base">
                  {(marketTab === "amm" ? ammPositions : pariPositions)
                    .length === 0
                    ? `No ${
                        marketTab === "amm" ? "AMM" : "PariMutuel"
                      } positions found`
                    : "No positions match the current filter"}
                </p>
              </div>
            ) : (
              filteredPositions.map((pos) => (
                <div
                  key={`${pos.pollAddress}-${marketTab}`}
                  onClick={() => handlePositionClick(pos)}
                  className="card p-3 md:p-4 hover:bg-slate-700/50 cursor-pointer transition-colors border-l-4 border-l-primary-500"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 md:gap-4">
                    {/* Question & Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        {getStatusBadge(pos)}
                      </div>
                      <h3 className="text-white font-medium text-sm md:text-base truncate">
                        {pos.pollQuestion}
                      </h3>
                    </div>

                    {/* Position Details */}
                    <div className="flex flex-wrap gap-3 md:gap-4 lg:gap-6 text-xs md:text-sm">
                      {/* AMM Position Details */}
                      {marketTab === "amm" && pos.amm && (
                        <>
                          {pos.amm.yesBalance > 0n && (
                            <div>
                              <div className="text-gray-400 text-xs">YES</div>
                              <div className="text-green-400 font-medium">
                                {formatAmount(pos.amm.yesBalance)}
                              </div>
                            </div>
                          )}
                          {pos.amm.noBalance > 0n && (
                            <div>
                              <div className="text-gray-400 text-xs">NO</div>
                              <div className="text-red-400 font-medium">
                                {formatAmount(pos.amm.noBalance)}
                              </div>
                            </div>
                          )}
                          {pos.amm.lpBalance > 0n && (
                            <div>
                              <div className="text-gray-400 text-xs">LP</div>
                              <div className="text-blue-400 font-medium">
                                {formatAmount(pos.amm.lpBalance)}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-gray-400 text-xs">Price</div>
                            <div className="text-white font-medium">
                              {pos.amm.yesPrice.toFixed(1)}%
                            </div>
                          </div>
                        </>
                      )}

                      {/* Pari Position Details */}
                      {marketTab === "pari" && pos.pari && (
                        <>
                          {pos.pari.yesShares > 0n && (
                            <div>
                              <div className="text-gray-400 text-xs">YES</div>
                              <div className="text-green-400 font-medium">
                                {formatAmount(pos.pari.yesShares)}
                              </div>
                            </div>
                          )}
                          {pos.pari.noShares > 0n && (
                            <div>
                              <div className="text-gray-400 text-xs">NO</div>
                              <div className="text-red-400 font-medium">
                                {formatAmount(pos.pari.noShares)}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-gray-400 text-xs">Staked</div>
                            <div className="text-white font-medium">
                              ${formatAmount(pos.pari.totalStaked)}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Arrow */}
                      <div className="hidden lg:flex items-center">
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Portfolio;
