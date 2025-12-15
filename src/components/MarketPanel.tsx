import { memo } from "react";
import { TrendingUp, Activity, Plus } from "lucide-react";
import { PollMarkets, MarketState } from "@/types";
import { COLLATERAL_TOKENS } from "@/config/contract";

// ============================================
// Shared utilities
// ============================================

// Get decimals for a collateral token from config
const getTokenDecimals = (tokenAddress: `0x${string}`): number => {
  const token = COLLATERAL_TOKENS.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  return token?.decimals ?? 18; // Default to 18 if not found
};

// Format TVL to human-readable format (e.g., $1.2K, $45.6M)
export const formatTvl = (
  tvl: bigint,
  collateralToken?: `0x${string}`
): string => {
  const decimals = collateralToken ? getTokenDecimals(collateralToken) : 6;
  const divisor = Math.pow(10, decimals);
  const value = Number(tvl) / divisor;

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  } else if (value >= 1) {
    return `$${value.toFixed(0)}`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

// Convert yesChance (0-1_000_000_000) to percentage
export const formatChance = (yesChance: number): number => {
  return Math.round(yesChance / 10_000_000);
};

// ============================================
// MarketInfo - displays market info in footer (right side)
// ============================================

interface MarketInfoProps {
  markets: PollMarkets | undefined;
  onMarketClick: (
    marketAddress: `0x${string}`,
    marketType: "amm" | "pariMutuel"
  ) => void;
}

const MarketInfoBadge = ({
  market,
  label,
  onClick,
}: {
  market: MarketState;
  label: string;
  onClick: () => void;
}) => {
  const yesPercent = formatChance(market.yesChance);
  const noPercent = 100 - yesPercent;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 hover:border-primary-500/50 transition-all text-xs whitespace-nowrap"
    >
      <span className="text-[10px] text-gray-400 font-medium uppercase">
        {label}
      </span>
      <span className="font-bold text-green-400">{yesPercent}%</span>
      <span className="text-gray-500">/</span>
      <span className="font-bold text-red-400">{noPercent}%</span>
    </button>
  );
};

// Volume label component
const MarketVolume = ({
  market,
}: {
  market: MarketState | undefined | null;
}) => {
  if (!market) return null;
  const tvl = formatTvl(market.collateralTvl, market.collateralToken);

  return <span className="text-xs text-gray-500">Volume: {tvl}</span>;
};

// Export volume components (memoized)
export const AmmVolume = memo(
  ({ markets }: { markets: PollMarkets | undefined }) => (
    <MarketVolume market={markets?.amm} />
  )
);

export const PariVolume = memo(
  ({ markets }: { markets: PollMarkets | undefined }) => (
    <MarketVolume market={markets?.pariMutuel} />
  )
);

// Single market badge component for use in footer rows (memoized)
export const AmmMarketBadge = memo(
  ({ markets, onMarketClick }: MarketInfoProps) => {
    if (!markets?.amm) return null;

    return (
      <MarketInfoBadge
        market={markets.amm}
        label="AMM"
        onClick={() => onMarketClick(markets.amm!.marketAddress, "amm")}
      />
    );
  }
);

export const PariMarketBadge = memo(
  ({ markets, onMarketClick }: MarketInfoProps) => {
    if (!markets?.pariMutuel) return null;

    return (
      <MarketInfoBadge
        market={markets.pariMutuel}
        label="Pari"
        onClick={() =>
          onMarketClick(markets.pariMutuel!.marketAddress, "pariMutuel")
        }
      />
    );
  }
);

// Legacy component - kept for compatibility
export const MarketInfo = ({ markets, onMarketClick }: MarketInfoProps) => {
  if (!markets || (!markets.amm && !markets.pariMutuel)) {
    return null;
  }

  return (
    <div className="flex gap-1.5">
      {markets.amm && (
        <MarketInfoBadge
          market={markets.amm}
          label="AMM"
          onClick={() => onMarketClick(markets.amm!.marketAddress, "amm")}
        />
      )}
      {markets.pariMutuel && (
        <MarketInfoBadge
          market={markets.pariMutuel}
          label="Pari"
          onClick={() =>
            onMarketClick(markets.pariMutuel!.marketAddress, "pariMutuel")
          }
        />
      )}
    </div>
  );
};

// ============================================
// CreateMarketPanel - buttons to create markets (between Sources and Footer)
// ============================================

interface CreateMarketPanelProps {
  markets: PollMarkets | undefined;
  onCreateMarket: (marketType: "amm" | "pariMutuel") => void;
}

export const CreateMarketPanel = memo(
  ({ markets, onCreateMarket }: CreateMarketPanelProps) => {
    const hasAmm = markets?.amm;
    const hasPari = markets?.pariMutuel;

    // If both markets exist, nothing to create
    if (hasAmm && hasPari) {
      return null;
    }

    return (
      <div className="flex gap-2 mb-2 pt-3 border-t border-slate-700/50 dark:border-slate-700/50">
        {/* Create AMM button if no AMM exists */}
        {!hasAmm && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateMarket("amm");
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white text-xs font-medium transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
          >
            <Plus className="w-3 h-3" />
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Add AMM Market</span>
          </button>
        )}

        {/* Create Pari-Mutuel button if no Pari exists */}
        {!hasPari && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateMarket("pariMutuel");
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white text-xs font-medium transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
          >
            <Plus className="w-3 h-3" />
            <Activity className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Add Pari-Mutuel</span>
          </button>
        )}
      </div>
    );
  }
);

// Default export for backwards compatibility (not used anymore)
export default CreateMarketPanel;
