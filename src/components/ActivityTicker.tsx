import { useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  DollarSign,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { useMarkets } from "@/hooks/useMarkets";
import { usePolls } from "@/hooks/usePolls";
import { formatUnits } from "viem";
import { COLLATERAL_TOKENS } from "@/config/contract";
import { PollStatus } from "@/config/abi";

interface ActivityTickerProps {
  onMarketClick?: (
    marketAddress: `0x${string}`,
    marketType: "amm" | "pariMutuel",
    pollAddress: `0x${string}`
  ) => void;
}

// Unified ticker item type
type TickerItemType = "priceChange" | "resolved" | "topTvl";

interface TickerItem {
  type: TickerItemType;
  pollAddress: string;
  question: string;
  // For price changes
  marketType?: "amm" | "pariMutuel";
  marketAddress?: string;
  yesChance?: number;
  change?: number;
  // For resolved polls
  resolvedStatus?: PollStatus;
  // For TVL
  tvl?: bigint;
  // Timestamp for sorting
  timestamp: number;
}

const ActivityTicker = ({ onMarketClick }: ActivityTickerProps) => {
  const { recentActivity, marketsMap } = useMarkets();
  const { allPolls, recentResolves } = usePolls();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create a map of pollAddress -> question for quick lookup
  const pollQuestions = useMemo(
    () =>
      new Map(allPolls.map((p) => [p.pollAddress.toLowerCase(), p.question])),
    [allPolls]
  );

  // Convert price changes to ticker items
  const priceChangeItems: TickerItem[] = useMemo(() => {
    return recentActivity.map((act) => ({
      type: "priceChange" as const,
      pollAddress: act.pollAddress,
      question: pollQuestions.get(act.pollAddress) || "Unknown Poll",
      marketType: act.marketType,
      marketAddress: act.marketAddress,
      yesChance: act.newYesChance,
      change: act.change,
      timestamp: act.timestamp,
    }));
  }, [recentActivity, pollQuestions]);

  // Convert resolved polls to ticker items
  const resolvedItems: TickerItem[] = useMemo(() => {
    return recentResolves.map((res) => ({
      type: "resolved" as const,
      pollAddress: res.pollAddress,
      question: res.question,
      resolvedStatus: res.status,
      timestamp: res.timestamp,
    }));
  }, [recentResolves]);

  // Compute top 10 markets by TVL (fallback)
  const topTvlItems: TickerItem[] = useMemo(() => {
    const markets: {
      pollAddress: string;
      marketType: "amm" | "pariMutuel";
      marketAddress: string;
      yesChance: number;
      tvl: bigint;
    }[] = [];

    for (const [pollAddr, pollMarkets] of marketsMap) {
      if (
        pollMarkets.amm &&
        pollMarkets.amm.isLive &&
        pollMarkets.amm.collateralTvl > 0n
      ) {
        markets.push({
          pollAddress: pollAddr,
          marketType: "amm",
          marketAddress: pollMarkets.amm.marketAddress,
          yesChance: pollMarkets.amm.yesChance / 1e7,
          tvl: pollMarkets.amm.collateralTvl,
        });
      }
      if (
        pollMarkets.pariMutuel &&
        pollMarkets.pariMutuel.isLive &&
        pollMarkets.pariMutuel.collateralTvl > 0n
      ) {
        markets.push({
          pollAddress: pollAddr,
          marketType: "pariMutuel",
          marketAddress: pollMarkets.pariMutuel.marketAddress,
          yesChance: pollMarkets.pariMutuel.yesChance / 1e7,
          tvl: pollMarkets.pariMutuel.collateralTvl,
        });
      }
    }

    return markets
      .sort((a, b) => (b.tvl > a.tvl ? 1 : b.tvl < a.tvl ? -1 : 0))
      .slice(0, 10)
      .map((m) => ({
        type: "topTvl" as const,
        pollAddress: m.pollAddress,
        question: pollQuestions.get(m.pollAddress) || "Unknown Poll",
        marketType: m.marketType,
        marketAddress: m.marketAddress,
        yesChance: m.yesChance,
        tvl: m.tvl,
        timestamp: 0,
      }));
  }, [marketsMap, pollQuestions]);

  // Combine ALL items with interleaving for fair rotation
  const items: TickerItem[] = useMemo(() => {
    const activityItems = [...priceChangeItems, ...resolvedItems].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // If no activity, just show TVL
    if (activityItems.length === 0) {
      return topTvlItems;
    }

    // If no TVL, just show activity
    if (topTvlItems.length === 0) {
      return activityItems;
    }

    // Interleave: activity -> tvl -> activity -> tvl -> ...
    // Each activity item is followed by a portion of TVL items
    const result: TickerItem[] = [];
    const tvlPerActivity = Math.max(
      1,
      Math.ceil(topTvlItems.length / activityItems.length)
    );
    let tvlIndex = 0;

    for (let i = 0; i < activityItems.length; i++) {
      // Add activity item
      result.push(activityItems[i]);

      // Add some TVL items after it
      for (
        let j = 0;
        j < tvlPerActivity && tvlIndex < topTvlItems.length;
        j++
      ) {
        result.push(topTvlItems[tvlIndex]);
        tvlIndex++;
      }
    }

    // Add any remaining TVL items
    while (tvlIndex < topTvlItems.length) {
      result.push(topTvlItems[tvlIndex]);
      tvlIndex++;
    }

    return result;
  }, [priceChangeItems, resolvedItems, topTvlItems]);

  // Auto-rotate through items
  useEffect(() => {
    if (items.length <= 1) return;

    const rotate = () => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsAnimating(false);
      }, 300);
    };

    timeoutRef.current = setInterval(rotate, 4000);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [items.length]);

  // Reset index when items change significantly
  useEffect(() => {
    setCurrentIndex(0);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
        <DollarSign className="w-4 h-4 mr-2 opacity-50" />
        <span className="opacity-75">No markets yet</span>
      </div>
    );
  }

  const current = items[currentIndex];

  const handleClick = () => {
    if (onMarketClick && current.marketAddress) {
      onMarketClick(
        current.marketAddress as `0x${string}`,
        current.marketType!,
        current.pollAddress as `0x${string}`
      );
    }
  };

  // Format TVL
  const formatTvl = (tvl: bigint) => {
    const value = parseFloat(formatUnits(tvl, COLLATERAL_TOKENS[0].decimals));
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  };

  // Get icon and colors based on item type
  const getItemStyle = () => {
    if (current.type === "priceChange") {
      const isPositive = current.change! > 0;
      return {
        bgClass: isPositive
          ? "bg-green-500/20 text-green-500"
          : "bg-red-500/20 text-red-500",
        icon: isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        ),
      };
    }
    if (current.type === "resolved") {
      if (current.resolvedStatus === PollStatus.Yes) {
        return {
          bgClass: "bg-green-500/20 text-green-500",
          icon: <CheckCircle className="w-4 h-4" />,
        };
      }
      if (current.resolvedStatus === PollStatus.No) {
        return {
          bgClass: "bg-red-500/20 text-red-500",
          icon: <XCircle className="w-4 h-4" />,
        };
      }
      return {
        bgClass: "bg-gray-500/20 text-gray-500",
        icon: <HelpCircle className="w-4 h-4" />,
      };
    }
    // topTvl
    return {
      bgClass: "bg-amber-500/20 text-amber-500",
      icon: <Trophy className="w-4 h-4" />,
    };
  };

  const style = getItemStyle();

  // Get mode label
  const getModeLabel = () => {
    if (current.type === "priceChange") return "Live";
    if (current.type === "resolved") return "Resolved";
    return "Top TVL";
  };

  // Get dot color
  const getDotColor = () => {
    if (current.type === "priceChange") return "bg-primary-500";
    if (current.type === "resolved") return "bg-green-500";
    return "bg-amber-500";
  };

  return (
    <div
      className={`flex items-center h-full px-3 transition-colors rounded-lg overflow-hidden ${
        current.marketAddress
          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
          : ""
      }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 p-1.5 rounded-full mr-3 ${style.bgClass}`}>
        {style.icon}
      </div>

      {/* Content */}
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ${
          isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Question - truncated */}
        <div className="text-sm text-gray-900 dark:text-white font-medium truncate">
          {current.question}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 text-xs">
          {current.type === "priceChange" && (
            <>
              {/* Market type badge */}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  current.marketType === "amm"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-purple-500/20 text-purple-400"
                }`}
              >
                {current.marketType === "amm" ? "AMM" : "PARI"}
              </span>
              {/* Price change */}
              <span
                className={`font-medium ${
                  current.change! > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {current.change! > 0 ? "+" : ""}
                {current.change!.toFixed(1)}%
              </span>
              {/* New price */}
              <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
                YES: {current.yesChance!.toFixed(1)}%
              </span>
            </>
          )}

          {current.type === "resolved" && (
            <>
              {/* Status badge */}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  current.resolvedStatus === PollStatus.Yes
                    ? "bg-green-500/20 text-green-400"
                    : current.resolvedStatus === PollStatus.No
                    ? "bg-red-500/20 text-red-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {current.resolvedStatus === PollStatus.Yes
                  ? "YES"
                  : current.resolvedStatus === PollStatus.No
                  ? "NO"
                  : "UNKNOWN"}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Poll resolved
              </span>
            </>
          )}

          {current.type === "topTvl" && (
            <>
              {/* Market type badge */}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  current.marketType === "amm"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-purple-500/20 text-purple-400"
                }`}
              >
                {current.marketType === "amm" ? "AMM" : "PARI"}
              </span>
              {/* TVL */}
              <span className="font-medium text-amber-500">
                {formatTvl(current.tvl!)}
              </span>
              {/* Price */}
              <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
                YES: {current.yesChance!.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Mode indicator + Pagination dots - hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 ml-2 flex-shrink-0">
        {/* Mode label */}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden md:block">
          {getModeLabel()}
        </span>

        {/* Pagination dots */}
        {items.length > 1 && (
          <div className="flex gap-1">
            {items.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex % Math.min(5, items.length)
                    ? getDotColor()
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTicker;
