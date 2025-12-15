import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { PositionsContext } from "@/context/PositionsContext";
import { useMarkets } from "@/hooks/useMarkets";
import { formatUnits, parseUnits } from "viem";
import {
  ArrowLeft,
  Clock,
  Loader2,
  RefreshCw,
  Wallet,
  Award,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import PriceChart, {
  ChartDataPoint as PriceChartDataPoint,
} from "./PriceChart";
import {
  PARI_MUTUEL_ABI,
  PariMutuelPosition,
  PariMutuelPositionPayout,
  PariMutuelTotals,
  PariMutuelMarketInfo,
  HourlySnapshot,
  BPS_DENOMINATOR,
  POLL_ABI,
} from "@/config/pariMutuelAbi";
import { ERC20_ABI, PollStatus } from "@/config/abi";
import { COLLATERAL_TOKENS, getContractConfig } from "@/config/contract";

interface PariMutuelMarketPageProps {
  marketAddress: `0x${string}`;
  pollAddress: `0x${string}`;
  onBack: () => void;
}

interface PariMutuelChartData {
  hour: number;
  timestamp: number;
  yesChance: number;
  volume: bigint;
  bets: number;
}

const QUICK_AMOUNTS = [10, 50, 100, 500];

const PariMutuelMarketPage = ({
  marketAddress,
  pollAddress,
  onBack,
}: PariMutuelMarketPageProps) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const config = getContractConfig();
  const positionsContext = useContext(PositionsContext);
  const { epochTick } = useMarkets();
  const isFirstEpochTick = useRef(true);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // UI State
  const [buyAmount, setBuyAmount] = useState("");
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [chartData, setChartData] = useState<PariMutuelChartData[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [txStep, setTxStep] = useState<"idle" | "approve" | "buy" | "redeem">(
    "idle"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ============================================
  // MULTICALL OPTIMIZATION: Group 1 - Market Info + Poll Status (10 calls → 1)
  // ============================================
  const [marketState, setMarketState] = useState<
    readonly [boolean, bigint, number, `0x${string}`] | undefined
  >();
  const [marketInfo, setMarketInfo] = useState<
    PariMutuelMarketInfo | undefined
  >();
  const [totals, setTotals] = useState<PariMutuelTotals | undefined>();
  const [protocolFeesCollected, setProtocolFeesCollected] = useState<
    bigint | undefined
  >();
  const [curveFlattener, setCurveFlattener] = useState<number | undefined>();
  const [curveOffset, setCurveOffset] = useState<number | undefined>();
  const [collateralTokenAddress, setCollateralTokenAddress] = useState<
    `0x${string}` | undefined
  >();
  const [pollFinalizedStatus, setPollFinalizedStatus] = useState<
    readonly [boolean, number] | undefined
  >();
  const [finalizationEpoch, setFinalizationEpoch] = useState<
    number | undefined
  >();
  const [arbitrationStarted, setArbitrationStarted] = useState<
    boolean | undefined
  >();

  // Load market info + poll status in single multicall
  const loadMarketAndPollData = useCallback(async () => {
    if (!publicClient) return;

    try {
      const results = await publicClient.multicall({
        contracts: [
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "marketState",
          },
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "getMarketInfo",
          },
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "totals",
          },
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "protocolFeesCollected",
          },
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "curveFlattener",
          },
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "curveOffset",
          },
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "collateralToken",
          },
          {
            address: pollAddress,
            abi: POLL_ABI,
            functionName: "getFinalizedStatus",
          },
          {
            address: pollAddress,
            abi: POLL_ABI,
            functionName: "getFinalizationEpoch",
          },
          {
            address: pollAddress,
            abi: POLL_ABI,
            functionName: "arbitrationStarted",
          },
        ],
        allowFailure: true,
      });

      if (results[0].status === "success")
        setMarketState(
          results[0].result as readonly [boolean, bigint, number, `0x${string}`]
        );
      if (results[1].status === "success")
        setMarketInfo(results[1].result as PariMutuelMarketInfo);
      if (results[2].status === "success")
        setTotals(results[2].result as PariMutuelTotals);
      if (results[3].status === "success")
        setProtocolFeesCollected(results[3].result as bigint);
      if (results[4].status === "success")
        setCurveFlattener(results[4].result as number);
      if (results[5].status === "success")
        setCurveOffset(results[5].result as number);
      if (results[6].status === "success")
        setCollateralTokenAddress(results[6].result as `0x${string}`);
      if (results[7].status === "success")
        setPollFinalizedStatus(results[7].result as readonly [boolean, number]);
      if (results[8].status === "success")
        setFinalizationEpoch(results[8].result as number);
      if (results[9].status === "success")
        setArbitrationStarted(results[9].result as boolean);
    } catch (error) {
      console.error("Failed to load market data:", error);
    }
  }, [publicClient, marketAddress, pollAddress]);

  // Initial load
  useEffect(() => {
    loadMarketAndPollData();
  }, [loadMarketAndPollData]);

  // Refresh on epoch tick (skip first tick to avoid double-loading on mount)
  useEffect(() => {
    if (isFirstEpochTick.current) {
      isFirstEpochTick.current = false;
      return;
    }
    // Refresh market data on new epoch (yesChance depends on time)
    loadMarketAndPollData();
  }, [epochTick, loadMarketAndPollData]);

  // Refetch functions (for backward compatibility)
  const refetchMarketState = useCallback(
    () => loadMarketAndPollData(),
    [loadMarketAndPollData]
  );
  const refetchTotals = useCallback(
    () => loadMarketAndPollData(),
    [loadMarketAndPollData]
  );
  const refetchProtocolFees = useCallback(
    () => loadMarketAndPollData(),
    [loadMarketAndPollData]
  );
  const refetchPollStatus = useCallback(
    () => loadMarketAndPollData(),
    [loadMarketAndPollData]
  );

  const collateralToken = useMemo(() => {
    if (!collateralTokenAddress) return COLLATERAL_TOKENS[0];
    return (
      COLLATERAL_TOKENS.find(
        (t) => t.address.toLowerCase() === collateralTokenAddress.toLowerCase()
      ) || COLLATERAL_TOKENS[0]
    );
  }, [collateralTokenAddress]);

  // ============================================
  // MULTICALL OPTIMIZATION: Group 2 - User Data (4 calls → 1)
  // ============================================
  const [userPosition, setUserPosition] = useState<
    PariMutuelPosition | undefined
  >();
  const [userPayout, setUserPayout] = useState<
    PariMutuelPositionPayout | undefined
  >();
  const [userBalance, setUserBalance] = useState<bigint | undefined>();
  const [userAllowance, setUserAllowance] = useState<bigint | undefined>();

  // Load user data in single multicall
  const loadUserData = useCallback(async () => {
    if (!publicClient || !address || !collateralTokenAddress) return;

    try {
      const results = await publicClient.multicall({
        contracts: [
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "getPosition",
            args: [address],
          },
          {
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "getPositionPayout",
            args: [address],
          },
          {
            address: collateralToken.address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: collateralToken.address,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, marketAddress],
          },
        ],
        allowFailure: true,
      });

      if (results[0].status === "success")
        setUserPosition(results[0].result as PariMutuelPosition);
      if (results[1].status === "success")
        setUserPayout(results[1].result as PariMutuelPositionPayout);
      if (results[2].status === "success")
        setUserBalance(results[2].result as bigint);
      if (results[3].status === "success")
        setUserAllowance(results[3].result as bigint);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  }, [
    publicClient,
    address,
    marketAddress,
    collateralTokenAddress,
    collateralToken.address,
  ]);

  // Load user data when dependencies ready
  useEffect(() => {
    if (address && collateralTokenAddress) {
      loadUserData();
    }
  }, [address, collateralTokenAddress, loadUserData]);

  // Refetch functions for user data
  const refetchPosition = useCallback(() => loadUserData(), [loadUserData]);
  const refetchPayout = useCallback(() => loadUserData(), [loadUserData]);
  const refetchBalance = useCallback(() => loadUserData(), [loadUserData]);
  const refetchAllowance = useCallback(() => loadUserData(), [loadUserData]);

  const buyAmountParsed = useMemo(() => {
    if (!buyAmount || isNaN(parseFloat(buyAmount))) return 0n;
    try {
      return parseUnits(buyAmount, collateralToken.decimals);
    } catch {
      return 0n;
    }
  }, [buyAmount, collateralToken.decimals]);

  const needsApproval =
    buyAmountParsed > 0n && (userAllowance ?? 0n) < buyAmountParsed;

  const { data: buyPreview } = useReadContract({
    address: marketAddress,
    abi: PARI_MUTUEL_ABI,
    functionName: "calculateBuy",
    args: [selectedSide === "yes", buyAmountParsed],
    query: { enabled: buyAmountParsed > 0n },
  });

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const {
    writeContract: writeBuy,
    data: buyHash,
    isPending: isBuyPending,
  } = useWriteContract();

  const {
    writeContract: writeRedeem,
    data: redeemHash,
    isPending: isRedeemPending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } =
    useWaitForTransactionReceipt({ hash: buyHash });

  const { isLoading: isRedeemConfirming, isSuccess: isRedeemSuccess } =
    useWaitForTransactionReceipt({ hash: redeemHash });

  const loadChartData = useCallback(async () => {
    if (!publicClient) return;
    setIsLoadingChart(true);
    const allSnapshots: PariMutuelChartData[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    try {
      while (hasMore) {
        const result = (await publicClient.readContract({
          address: marketAddress,
          abi: PARI_MUTUEL_ABI,
          functionName: "getRecentNonZeroHourlySnapshots",
          args: [offset, limit],
        })) as [{ hour: number; snapshot: HourlySnapshot }[], boolean];

        const [snapshotsWithHour, more] = result;

        for (const item of snapshotsWithHour) {
          allSnapshots.push({
            hour: item.hour,
            timestamp: item.hour * 3600,
            yesChance: Number(item.snapshot.yesChance) / 1e7, // SNAPSHOT_SCALE=1e9, convert to 0-100%
            volume: item.snapshot.volume,
            bets: item.snapshot.bets,
          });
        }

        hasMore = more;
        offset += limit;
        if (offset > 10000 || snapshotsWithHour.length === 0) break;
      }

      // Reverse to get chronological order (oldest first, newest last)
      const chronologicalData = allSnapshots.reverse();
      setChartData(chronologicalData);
    } catch (error) {
      console.error("Failed to load chart data:", error);
    } finally {
      setIsLoadingChart(false);
    }
  }, [publicClient, marketAddress]);

  useEffect(() => {
    if (publicClient && marketAddress) {
      loadChartData();
    }
  }, [loadChartData, publicClient, marketAddress]);

  // After approve success, automatically proceed to buy
  useEffect(() => {
    if (isApproveSuccess && txStep === "approve") {
      refetchAllowance().then(() => {
        // Auto-trigger buy after successful approval
        if (buyAmountParsed > 0n && buyPreview) {
          setTxStep("buy");
          const minShares = (buyPreview[0] * 99n) / 100n;
          writeBuy({
            address: marketAddress,
            abi: PARI_MUTUEL_ABI,
            functionName: "buy",
            args: [selectedSide === "yes", buyAmountParsed, minShares],
          });
        } else {
          setTxStep("idle");
        }
      });
    }
  }, [
    isApproveSuccess,
    txStep,
    refetchAllowance,
    buyAmountParsed,
    buyPreview,
    marketAddress,
    selectedSide,
    writeBuy,
  ]);

  useEffect(() => {
    if (isBuySuccess && txStep === "buy") {
      setBuyAmount("");
      refetchMarketState();
      refetchTotals();
      refetchPosition();
      refetchPayout();
      refetchBalance();
      refetchPollStatus();
      loadChartData();
      setTxStep("idle");

      // Update position cache
      if (positionsContext?.hasScanned) {
        positionsContext.refreshPosition(pollAddress, "pari");
      }
    }
  }, [
    isBuySuccess,
    txStep,
    refetchMarketState,
    refetchTotals,
    refetchPosition,
    refetchPayout,
    refetchBalance,
    refetchPollStatus,
    loadChartData,
    pollAddress,
    positionsContext,
  ]);

  useEffect(() => {
    if (isRedeemSuccess && txStep === "redeem") {
      refetchPosition();
      refetchPayout();
      refetchBalance();
      refetchPollStatus();
      setTxStep("idle");

      // Update position cache
      if (positionsContext?.hasScanned) {
        positionsContext.refreshPosition(pollAddress, "pari");
      }
    }
  }, [
    isRedeemSuccess,
    txStep,
    refetchPosition,
    refetchPayout,
    refetchBalance,
    refetchPollStatus,
    pollAddress,
    positionsContext,
  ]);

  const handleApprove = () => {
    if (!buyAmountParsed) return;

    // Check if approval is actually needed
    if (!needsApproval) {
      // Allowance is sufficient, directly execute buy
      handleBuy();
      return;
    }

    setTxStep("approve");
    writeApprove({
      address: collateralToken.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [marketAddress, buyAmountParsed],
    });
  };

  const handleBuy = () => {
    if (!buyAmountParsed || !buyPreview) return;
    setTxStep("buy");
    const minShares = (buyPreview[0] * 99n) / 100n;
    writeBuy({
      address: marketAddress,
      abi: PARI_MUTUEL_ABI,
      functionName: "buy",
      args: [selectedSide === "yes", buyAmountParsed, minShares],
    });
  };

  const handleRedeem = () => {
    setTxStep("redeem");
    writeRedeem({
      address: marketAddress,
      abi: PARI_MUTUEL_ABI,
      functionName: "redeemWinnings",
    });
  };

  const handleWithdrawFees = () => {
    setTxStep("redeem");
    writeRedeem({
      address: marketAddress,
      abi: PARI_MUTUEL_ABI,
      functionName: "withdrawProtocolFees",
    });
  };

  const handleQuickAmount = (amount: number) => {
    const current = parseFloat(buyAmount) || 0;
    setBuyAmount((current + amount).toString());
  };

  // Derived values
  const isLive = marketState?.[0] ?? false;
  const tvl = marketState?.[1] ?? 0n;
  const yesChance = marketState?.[2] ? Number(marketState[2]) / 1e7 : 50;
  const noChance = 100 - yesChance;

  const totalsData = totals as PariMutuelTotals | undefined;
  const position = userPosition as PariMutuelPosition | undefined;
  const payout = userPayout as PariMutuelPositionPayout | undefined;
  const info = marketInfo as PariMutuelMarketInfo | undefined;

  const hasPosition =
    position && (position.collateralYes > 0n || position.collateralNo > 0n);

  const isFinalized = pollFinalizedStatus?.[0] ?? false;
  const pollOutcome = pollFinalizedStatus?.[1] as PollStatus | undefined;

  // Poll has a resolution (Yes/No/Unknown) but may not be finalized yet
  const hasResolution =
    pollOutcome !== undefined && pollOutcome !== PollStatus.Pending;

  // Calculate time until finalization
  const timeUntilFinalization = useMemo(() => {
    if (!finalizationEpoch || isFinalized) return null;
    const epochLength = config.epochLength; // seconds per epoch
    const currentEpoch = Math.floor(Date.now() / 1000 / epochLength);
    const epochsRemaining = Number(finalizationEpoch) - currentEpoch;
    if (epochsRemaining <= 0) return null;
    const secondsRemaining = epochsRemaining * epochLength;
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }, [finalizationEpoch, isFinalized, config.epochLength]);

  const canBuy =
    isConnected &&
    isLive &&
    buyAmountParsed > 0n &&
    (userBalance ?? 0n) >= buyAmountParsed;

  const canRedeem = isFinalized && hasPosition;

  // Check if current user is the market creator
  const isCreator =
    address &&
    info?.creator &&
    address.toLowerCase() === info.creator.toLowerCase();
  const protocolFees = (protocolFeesCollected as bigint) ?? 0n;

  const potentialWin = buyPreview ? buyPreview[1] : 0n;

  const formatAmount = (amount: bigint) => {
    return parseFloat(formatUnits(amount, collateralToken.decimals)).toFixed(2);
  };

  const formatCompactAmount = (amount: bigint) => {
    const value = parseFloat(formatUnits(amount, collateralToken.decimals));
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  const getExplorerUrl = (addr: string) => {
    return `${config.blockExplorerUrl}/address/${addr}`;
  };

  const formatTimeRemaining = (closeTimestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = closeTimestamp - now;
    if (diff <= 0) return "Closed";
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Transform chart data for PriceChart component
  const priceChartData: PriceChartDataPoint[] = useMemo(() => {
    return chartData
      .filter((d) => d.yesChance > 0)
      .map((d, index, arr) => {
        const prevChance = index > 0 ? arr[index - 1].yesChance : d.yesChance;
        return {
          time: d.timestamp,
          open: prevChance,
          high: Math.max(d.yesChance, prevChance),
          low: Math.min(d.yesChance, prevChance),
          close: d.yesChance,
          volume: Number(formatUnits(d.volume, collateralToken.decimals)),
          trades: d.bets,
        };
      });
  }, [chartData, collateralToken.decimals]);

  // Address link component
  const AddressLink = ({
    address: addr,
    label,
  }: {
    address: string;
    label: string;
  }) => (
    <div>
      <span className="text-gray-500 text-sm">{label}</span>
      <a
        href={getExplorerUrl(addr)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-mono text-sm transition-colors"
      >
        {addr.slice(0, 6)}...{addr.slice(-4)}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
          <span className="sm:hidden">Back</span>
        </button>
        <h1 className="text-base sm:text-xl font-bold text-white whitespace-nowrap">
          Pari-Mutuel
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await Promise.all([
                refetchMarketState(),
                refetchTotals(),
                refetchPosition(),
                refetchPayout(),
                refetchBalance(),
                refetchProtocolFees(),
                refetchPollStatus(),
              ]);
              await loadChartData();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isLive
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : isFinalized
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {isLive ? "● Live" : isFinalized ? "Resolved" : "Closed"}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          {/* Left side spacer (hidden on mobile) */}
          <div className="hidden md:block"></div>

          {/* Center - Prices */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <span className="text-gray-400 text-xs font-bold">YES</span>
              <p className="text-base sm:text-xl font-bold text-green-400">
                {yesChance.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <span className="text-gray-400 text-xs font-bold">NO</span>
              <p className="text-base sm:text-xl font-bold text-red-400">
                {noChance.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Right side - Stats */}
          <div className="flex items-center justify-center md:justify-end gap-4 sm:gap-6 flex-wrap">
            <div className="text-right">
              <span className="text-gray-400 text-xs">Pool</span>
              <p className="text-sm sm:text-lg font-semibold text-white">
                <span className="sm:hidden">${formatCompactAmount(tvl)}</span>
                <span className="hidden sm:inline">${formatAmount(tvl)}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs">Ends</span>
              <p className="text-sm text-white">
                {info ? formatTimeRemaining(info.marketCloseTimestamp) : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Section */}
        <div className="lg:col-span-2 card p-4">
          {/* Chart */}
          <div className="aspect-[2/1] sm:aspect-[5/2] rounded-lg overflow-hidden">
            <PriceChart data={priceChartData} isLoading={isLoadingChart} />
          </div>

          {/* Pool Distribution */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>
                YES:{" "}
                <span className="text-green-400">
                  <span className="sm:hidden">
                    ${formatCompactAmount(totalsData?.collateralYes ?? 0n)}
                  </span>
                  <span className="hidden sm:inline">
                    ${formatAmount(totalsData?.collateralYes ?? 0n)}
                  </span>
                </span>
              </span>
              <span>
                NO:{" "}
                <span className="text-red-400">
                  <span className="sm:hidden">
                    ${formatCompactAmount(totalsData?.collateralNo ?? 0n)}
                  </span>
                  <span className="hidden sm:inline">
                    ${formatAmount(totalsData?.collateralNo ?? 0n)}
                  </span>
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 h-full transition-all duration-500"
                style={{
                  width: `${
                    totalsData &&
                    totalsData.collateralYes + totalsData.collateralNo > 0n
                      ? (Number(totalsData.collateralYes) /
                          Number(
                            totalsData.collateralYes + totalsData.collateralNo
                          )) *
                        100
                      : 50
                  }%`,
                }}
              />
              <div className="bg-red-500 h-full flex-1" />
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="card p-4 flex flex-col">
          <h3 className="text-base font-semibold text-white mb-4">Place Bet</h3>

          {!isLive && !isFinalized ? (
            <div className="text-center py-6 flex-1 flex flex-col justify-center space-y-3">
              <Clock className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 font-medium">Market is closed</p>

              {/* Poll Status Info */}
              <div className="bg-slate-800/50 rounded-lg p-3 text-left space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Poll Status:</span>
                  <span
                    className={`font-medium ${
                      pollOutcome === PollStatus.Yes
                        ? "text-green-400"
                        : pollOutcome === PollStatus.No
                        ? "text-red-400"
                        : pollOutcome === PollStatus.Unknown
                        ? "text-gray-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {pollOutcome === PollStatus.Yes
                      ? "YES"
                      : pollOutcome === PollStatus.No
                      ? "NO"
                      : pollOutcome === PollStatus.Unknown
                      ? "Unknown"
                      : "Pending"}
                  </span>
                </div>

                {timeUntilFinalization && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Finalizes in:</span>
                    <span className="text-white">{timeUntilFinalization}</span>
                  </div>
                )}

                {arbitrationStarted && (
                  <div className="flex items-center gap-2 text-sm text-purple-400 pt-1 border-t border-slate-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Arbitration in progress</span>
                  </div>
                )}
              </div>

              {hasResolution && (
                <p className="text-xs text-gray-500">
                  Redeem available after finalization
                </p>
              )}
            </div>
          ) : isFinalized ? (
            <div className="text-center py-6 flex-1 flex flex-col justify-center">
              <Award className="w-10 h-10 text-blue-400 mx-auto mb-2" />
              <p className="text-base font-medium text-white mb-1">
                Market Resolved
              </p>
              <p className="text-xl font-bold mb-3">
                <span
                  className={
                    pollOutcome === PollStatus.Yes
                      ? "text-green-400"
                      : pollOutcome === PollStatus.No
                      ? "text-red-400"
                      : "text-gray-400"
                  }
                >
                  {pollOutcome === PollStatus.Yes
                    ? "YES"
                    : pollOutcome === PollStatus.No
                    ? "NO"
                    : "Unknown"}
                </span>
              </p>
              {canRedeem && (
                <button
                  onClick={handleRedeem}
                  disabled={isRedeemPending || isRedeemConfirming}
                  className="btn-primary w-full py-2"
                >
                  {isRedeemPending || isRedeemConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Claim Winnings"
                  )}
                </button>
              )}
              {/* Withdraw Protocol Fees - only for creator after market closed */}
              {isCreator && protocolFees > 0n && (
                <button
                  onClick={handleWithdrawFees}
                  disabled={isRedeemPending || isRedeemConfirming}
                  className="w-full mt-2 py-2 px-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isRedeemPending || isRedeemConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `Claim Fees ($${formatAmount(protocolFees)})`
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Side Selection - Larger buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedSide("yes")}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    selectedSide === "yes"
                      ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  <div className="text-lg">Yes</div>
                  <div className="text-sm opacity-80">
                    {yesChance.toFixed(1)}%
                  </div>
                </button>
                <button
                  onClick={() => setSelectedSide("no")}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    selectedSide === "no"
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  <div className="text-lg">No</div>
                  <div className="text-sm opacity-80">
                    {noChance.toFixed(1)}%
                  </div>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Amount</span>
                  {isConnected && (
                    <span>
                      Bal: {formatAmount(userBalance ?? 0n)}{" "}
                      {collateralToken.symbol}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-7 pr-3 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleQuickAmount(amt)}
                    className="flex-1 py-2 text-xs bg-slate-700/50 hover:bg-slate-600 text-gray-300 rounded-lg border border-slate-600 transition-colors"
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              {/* Payout Preview */}
              <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shares</span>
                  <span className="text-white">
                    {buyPreview ? formatAmount(buyPreview[0]) : "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee</span>
                  <span className="text-gray-300">
                    ${buyPreview ? formatAmount(buyPreview[2]) : "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                  <span className="text-gray-300">Potential Win</span>
                  <span
                    className={`text-2xl font-bold ${
                      selectedSide === "yes" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    ${potentialWin > 0n ? formatAmount(potentialWin) : "0"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {!isConnected ? (
                <div className="bg-slate-700/50 rounded-lg p-3 text-center text-gray-400 text-sm">
                  Connect wallet to trade
                </div>
              ) : needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={isApprovePending || isApproveConfirming}
                  className="w-full py-2.5 rounded-lg font-semibold bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-all"
                >
                  {isApprovePending || isApproveConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `Approve ${collateralToken.symbol}`
                  )}
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={!canBuy || isBuyPending || isBuyConfirming}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    selectedSide === "yes"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isBuyPending || isBuyConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Trade"
                  )}
                </button>
              )}

              {/* Time remaining */}
              <div className="mt-auto pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Closes in{" "}
                    <span className="text-white font-medium">
                      {info
                        ? formatTimeRemaining(info.marketCloseTimestamp)
                        : "--"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Position */}
      {hasPosition && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-gray-400" />
            <h3 className="text-base font-semibold text-white">
              Your Position
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {position && position.collateralYes > 0n && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-green-400 font-semibold">YES</span>
                    <p className="text-gray-400 text-xs mt-0.5">
                      ${formatAmount(position.collateralYes)} invested
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatAmount(position.sharesYes)} shares
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Potential Win</p>
                    <p className="text-green-400 font-bold text-lg">
                      ${payout ? formatAmount(payout.potentialYesWin) : "0"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {position && position.collateralNo > 0n && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-red-400 font-semibold">NO</span>
                    <p className="text-gray-400 text-xs mt-0.5">
                      ${formatAmount(position.collateralNo)} invested
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatAmount(position.sharesNo)} shares
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Potential Win</p>
                    <p className="text-red-400 font-bold text-lg">
                      ${payout ? formatAmount(payout.potentialNoWin) : "0"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {payout && payout.refundIfUnknown > 0n && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Refund if Unknown: ${formatAmount(payout.refundIfUnknown)}
            </p>
          )}
        </div>
      )}

      {/* Market Details - Always visible */}
      <div className="card p-4">
        <h3 className="text-base font-semibold text-white mb-3">
          Market Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-500 text-sm">Curve k</span>
            <p className="text-white">{curveFlattener ?? "--"}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Offset</span>
            <p className="text-white">
              {curveOffset !== undefined
                ? `${(
                    ((curveOffset as number) / BPS_DENOMINATOR) *
                    100
                  ).toFixed(1)}%`
                : "--"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Fee</span>
            <p className="text-white">
              {info
                ? `${((info.protocolFeeRate / BPS_DENOMINATOR) * 100).toFixed(
                    1
                  )}%`
                : "--"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Close Date</span>
            <p className="text-white">
              {info
                ? new Date(
                    info.marketCloseTimestamp * 1000
                  ).toLocaleDateString()
                : "--"}
            </p>
          </div>
          <AddressLink address={marketAddress} label="Market" />
          <AddressLink address={pollAddress} label="Poll" />
          <AddressLink address={info?.creator ?? ""} label="Creator" />
          <div>
            <span className="text-gray-500 text-sm">Collateral</span>
            <p className="text-white">{collateralToken.symbol}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PariMutuelMarketPage;
