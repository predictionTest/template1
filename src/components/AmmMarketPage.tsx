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
import PriceChart, { ChartDataPoint, ChartType } from "./PriceChart";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Droplets,
  Wallet,
  Award,
  Clock,
  ArrowRightLeft,
  Plus,
  Minus,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Settings,
  LineChart,
  CandlestickChart,
} from "lucide-react";
import {
  AMM_ABI,
  OUTCOME_TOKEN_ABI,
  AmmMarketInfo,
  AmmHourlyCandle,
  AMM_BPS_DENOMINATOR,
  AMM_CANDLE_PRICE_SCALE,
} from "@/config/ammAbi";
import { ERC20_ABI, PollStatus } from "@/config/abi";
import { COLLATERAL_TOKENS, getContractConfig } from "@/config/contract";
import { POLL_ABI } from "@/config/pariMutuelAbi";

interface AmmMarketPageProps {
  marketAddress: `0x${string}`;
  pollAddress: `0x${string}`;
  onBack: () => void;
}

type TradeMode = "buy" | "sell" | "swap";

const SLIPPAGE_PRESETS = [0.5, 1, 2, 5];

const AmmMarketPage = ({
  marketAddress,
  pollAddress,
  onBack,
}: AmmMarketPageProps) => {
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
  const [tradeMode, setTradeMode] = useState<TradeMode>("buy");
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [inputAmount, setInputAmount] = useState("");
  const [swapAmountIn, setSwapAmountIn] = useState("");
  const [swapAmountOut, setSwapAmountOut] = useState("");
  const [swapMode, setSwapMode] = useState<"exactIn" | "exactOut">("exactIn");
  const [liquidityAmount, setLiquidityAmount] = useState("");
  const [lpToRemove, setLpToRemove] = useState("");
  const [txStep, setTxStep] = useState<"idle" | "approve" | "execute">("idle");
  const [pendingAction, setPendingAction] = useState<
    "trade" | "swap" | "liquidity" | "removeLiquidity" | null
  >(null);
  const [slippage, setSlippage] = useState(1); // 1%
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>("line");

  // ============================================
  // MULTICALL OPTIMIZATION: Group 1 - Market Info + Poll Status (9 calls → 1)
  // ============================================
  // marketState returns [isLive, collateralTvl, yesChance, collateral]
  const [marketState, setMarketState] = useState<
    readonly [boolean, bigint, number, `0x${string}`] | undefined
  >();
  const [marketInfo, setMarketInfo] = useState<AmmMarketInfo | undefined>();
  // getReserves returns [reserveYes, reserveNo, totalLP, protocolFees, collateralTvl]
  const [reserves, setReserves] = useState<
    readonly [bigint, bigint, bigint, bigint, bigint] | undefined
  >();
  const [yesTokenAddr, setYesTokenAddr] = useState<`0x${string}` | undefined>();
  const [noTokenAddr, setNoTokenAddr] = useState<`0x${string}` | undefined>();
  const [collateralTokenAddr, setCollateralTokenAddr] = useState<
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
          { address: marketAddress, abi: AMM_ABI, functionName: "marketState" },
          {
            address: marketAddress,
            abi: AMM_ABI,
            functionName: "getMarketInfo",
          },
          { address: marketAddress, abi: AMM_ABI, functionName: "getReserves" },
          { address: marketAddress, abi: AMM_ABI, functionName: "yesToken" },
          { address: marketAddress, abi: AMM_ABI, functionName: "noToken" },
          {
            address: marketAddress,
            abi: AMM_ABI,
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
        setMarketInfo(results[1].result as AmmMarketInfo);
      if (results[2].status === "success")
        setReserves(
          results[2].result as readonly [bigint, bigint, bigint, bigint, bigint]
        );
      if (results[3].status === "success")
        setYesTokenAddr(results[3].result as `0x${string}`);
      if (results[4].status === "success")
        setNoTokenAddr(results[4].result as `0x${string}`);
      if (results[5].status === "success")
        setCollateralTokenAddr(results[5].result as `0x${string}`);
      if (results[6].status === "success")
        setPollFinalizedStatus(results[6].result as readonly [boolean, number]);
      if (results[7].status === "success")
        setFinalizationEpoch(results[7].result as number);
      if (results[8].status === "success")
        setArbitrationStarted(results[8].result as boolean);
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
    // Refresh market data on new epoch
    loadMarketAndPollData();
  }, [epochTick, loadMarketAndPollData]);

  // Refetch functions (for backward compatibility with existing code)
  const refetchMarketState = useCallback(
    () => loadMarketAndPollData(),
    [loadMarketAndPollData]
  );
  const refetchReserves = useCallback(
    () => loadMarketAndPollData(),
    [loadMarketAndPollData]
  );
  const refetchPollStatus = useCallback(
    () => loadMarketAndPollData(),
    [loadMarketAndPollData]
  );

  // Collateral token info
  const collateralToken = useMemo(() => {
    if (!collateralTokenAddr) return COLLATERAL_TOKENS[0];
    return (
      COLLATERAL_TOKENS.find(
        (t) => t.address.toLowerCase() === collateralTokenAddr.toLowerCase()
      ) || COLLATERAL_TOKENS[0]
    );
  }, [collateralTokenAddr]);

  // ============================================
  // MULTICALL OPTIMIZATION: Group 2 - User Balances & Allowances (7 calls → 1)
  // ============================================
  const [userYesBalance, setUserYesBalance] = useState<bigint | undefined>();
  const [userNoBalance, setUserNoBalance] = useState<bigint | undefined>();
  const [userLpBalance, setUserLpBalance] = useState<bigint | undefined>();
  const [userCollateralBalance, setUserCollateralBalance] = useState<
    bigint | undefined
  >();
  const [collateralAllowance, setCollateralAllowance] = useState<
    bigint | undefined
  >();
  const [yesAllowance, setYesAllowance] = useState<bigint | undefined>();
  const [noAllowance, setNoAllowance] = useState<bigint | undefined>();

  // Load user balances in single multicall
  const loadUserBalances = useCallback(async () => {
    if (!publicClient || !address || !yesTokenAddr || !noTokenAddr) return;

    try {
      const results = await publicClient.multicall({
        contracts: [
          {
            address: yesTokenAddr,
            abi: OUTCOME_TOKEN_ABI,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: noTokenAddr,
            abi: OUTCOME_TOKEN_ABI,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: marketAddress,
            abi: AMM_ABI,
            functionName: "balanceOf",
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
          {
            address: yesTokenAddr,
            abi: OUTCOME_TOKEN_ABI,
            functionName: "allowance",
            args: [address, marketAddress],
          },
          {
            address: noTokenAddr,
            abi: OUTCOME_TOKEN_ABI,
            functionName: "allowance",
            args: [address, marketAddress],
          },
        ],
        allowFailure: true,
      });

      if (results[0].status === "success")
        setUserYesBalance(results[0].result as bigint);
      if (results[1].status === "success")
        setUserNoBalance(results[1].result as bigint);
      if (results[2].status === "success")
        setUserLpBalance(results[2].result as bigint);
      if (results[3].status === "success")
        setUserCollateralBalance(results[3].result as bigint);
      if (results[4].status === "success")
        setCollateralAllowance(results[4].result as bigint);
      if (results[5].status === "success")
        setYesAllowance(results[5].result as bigint);
      if (results[6].status === "success")
        setNoAllowance(results[6].result as bigint);
    } catch (error) {
      console.error("Failed to load user balances:", error);
    }
  }, [
    publicClient,
    address,
    yesTokenAddr,
    noTokenAddr,
    marketAddress,
    collateralToken.address,
  ]);

  // Load user balances when dependencies ready (including collateralTokenAddr)
  useEffect(() => {
    if (address && yesTokenAddr && noTokenAddr && collateralTokenAddr) {
      loadUserBalances();
    }
  }, [
    address,
    yesTokenAddr,
    noTokenAddr,
    collateralTokenAddr,
    loadUserBalances,
  ]);

  // Refetch functions for user balances
  const refetchYesBalance = useCallback(
    () => loadUserBalances(),
    [loadUserBalances]
  );
  const refetchNoBalance = useCallback(
    () => loadUserBalances(),
    [loadUserBalances]
  );
  const refetchLpBalance = useCallback(
    () => loadUserBalances(),
    [loadUserBalances]
  );
  const refetchCollateralBalance = useCallback(
    () => loadUserBalances(),
    [loadUserBalances]
  );
  const refetchCollateralAllowance = useCallback(
    () => loadUserBalances(),
    [loadUserBalances]
  );
  const refetchYesAllowance = useCallback(
    () => loadUserBalances(),
    [loadUserBalances]
  );
  const refetchNoAllowance = useCallback(
    () => loadUserBalances(),
    [loadUserBalances]
  );

  // Parse input amounts
  const inputAmountParsed = useMemo(() => {
    if (!inputAmount || isNaN(parseFloat(inputAmount))) return 0n;
    try {
      return parseUnits(inputAmount, collateralToken.decimals);
    } catch {
      return 0n;
    }
  }, [inputAmount, collateralToken.decimals]);

  const swapAmountInParsed = useMemo(() => {
    if (!swapAmountIn || isNaN(parseFloat(swapAmountIn))) return 0n;
    try {
      return parseUnits(swapAmountIn, collateralToken.decimals);
    } catch {
      return 0n;
    }
  }, [swapAmountIn, collateralToken.decimals]);

  const swapAmountOutParsed = useMemo(() => {
    if (!swapAmountOut || isNaN(parseFloat(swapAmountOut))) return 0n;
    try {
      return parseUnits(swapAmountOut, collateralToken.decimals);
    } catch {
      return 0n;
    }
  }, [swapAmountOut, collateralToken.decimals]);

  const liquidityAmountParsed = useMemo(() => {
    if (!liquidityAmount || isNaN(parseFloat(liquidityAmount))) return 0n;
    try {
      return parseUnits(liquidityAmount, collateralToken.decimals);
    } catch {
      return 0n;
    }
  }, [liquidityAmount, collateralToken.decimals]);

  // LP tokens always have 18 decimals (normalized in contract via lpPrecision)
  const lpToRemoveParsed = useMemo(() => {
    if (!lpToRemove || isNaN(parseFloat(lpToRemove))) return 0n;
    try {
      return parseUnits(lpToRemove, 18);
    } catch {
      return 0n;
    }
  }, [lpToRemove]);

  // Quote calculations for Buy/Sell
  const { data: buyQuote } = useReadContract({
    address: marketAddress,
    abi: AMM_ABI,
    functionName: selectedSide === "yes" ? "calcBuyYes" : "calcBuyNo",
    args: [inputAmountParsed],
    query: { enabled: tradeMode === "buy" && inputAmountParsed > 0n },
  });

  const { data: sellQuote } = useReadContract({
    address: marketAddress,
    abi: AMM_ABI,
    functionName: selectedSide === "yes" ? "calcSellYes" : "calcSellNo",
    args: [inputAmountParsed],
    query: { enabled: tradeMode === "sell" && inputAmountParsed > 0n },
  });

  // Quote for Swap ExactIn (bottom panel)
  const { data: swapQuoteExactIn } = useReadContract({
    address: marketAddress,
    abi: AMM_ABI,
    functionName: "calcSwapExactIn",
    args: [selectedSide === "yes", swapAmountInParsed],
    query: {
      enabled:
        tradeMode === "swap" &&
        swapMode === "exactIn" &&
        swapAmountInParsed > 0n,
    },
  });

  // Quote for Swap ExactOut (bottom panel)
  const { data: swapQuoteExactOut } = useReadContract({
    address: marketAddress,
    abi: AMM_ABI,
    functionName: "calcSwapExactOut",
    args: [selectedSide === "yes", swapAmountOutParsed],
    query: {
      enabled:
        tradeMode === "swap" &&
        swapMode === "exactOut" &&
        swapAmountOutParsed > 0n,
    },
  });

  // Write contracts
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const {
    writeContract: writeExecute,
    data: executeHash,
    isPending: isExecutePending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const { isLoading: isExecuteConfirming, isSuccess: isExecuteSuccess } =
    useWaitForTransactionReceipt({ hash: executeHash });

  // Derived values
  const isLive = marketState?.[0] ?? false;
  const tvl = marketState?.[1] ?? 0n;
  const yesChance = marketState?.[2]
    ? (Number(marketState[2]) / AMM_CANDLE_PRICE_SCALE) * 100
    : 50;
  const noChance = 100 - yesChance;

  const info = marketInfo as AmmMarketInfo | undefined;
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

  const reserveYes = reserves?.[0] ?? 0n;
  const reserveNo = reserves?.[1] ?? 0n;
  const totalLP = reserves?.[2] ?? 0n;
  const protocolFees = reserves?.[3] ?? 0n;

  // Calculate what user receives when removing liquidity (from contract)
  const { data: removeQuoteData } = useReadContract({
    address: marketAddress,
    abi: AMM_ABI,
    functionName: "calcRemoveLiquidity",
    args: [lpToRemoveParsed],
    query: { enabled: lpToRemoveParsed > 0n },
  });

  const removeQuote = useMemo(() => {
    if (!removeQuoteData || lpToRemoveParsed === 0n) {
      return { yesToReturn: 0n, noToReturn: 0n, collateralToReturn: 0n };
    }
    const [yesToReturn, noToReturn, collateralToReturn] = removeQuoteData as [
      bigint,
      bigint,
      bigint
    ];
    return { yesToReturn, noToReturn, collateralToReturn };
  }, [removeQuoteData, lpToRemoveParsed]);

  // Hourly imbalance limit info
  const hasImbalanceLimit = info && info.maxPriceImbalancePerHour > 0;
  const imbalanceLimitPercent = info
    ? (info.maxPriceImbalancePerHour / AMM_BPS_DENOMINATOR) * 100
    : 0;

  // LP tokens always have 18 decimals (normalized in contract via lpPrecision)
  const formatLpAmount = (lpAmount: bigint) => {
    return formatAmount(lpAmount, 18);
  };

  const hasYesTokens = (userYesBalance ?? 0n) > 0n;
  const hasNoTokens = (userNoBalance ?? 0n) > 0n;
  const canRedeem = isFinalized && (hasYesTokens || hasNoTokens);

  // Calculate slippage-adjusted min output
  const getMinOutput = (quote: bigint) => {
    return (quote * BigInt(Math.floor((100 - slippage) * 100))) / 10000n;
  };

  // Calculate slippage-adjusted max input (for exactOut)
  const getMaxInput = (quote: bigint) => {
    return (quote * BigInt(Math.floor((100 + slippage) * 100))) / 10000n;
  };

  // Check if approval needed (for current operation)
  const needsApprovalForTrade = useMemo(() => {
    if (tradeMode === "buy") {
      return (
        inputAmountParsed > 0n &&
        (collateralAllowance ?? 0n) < inputAmountParsed
      );
    } else {
      const allowance = selectedSide === "yes" ? yesAllowance : noAllowance;
      return inputAmountParsed > 0n && (allowance ?? 0n) < inputAmountParsed;
    }
  }, [
    tradeMode,
    selectedSide,
    inputAmountParsed,
    collateralAllowance,
    yesAllowance,
    noAllowance,
  ]);

  const swapInputAmount = useMemo(() => {
    if (swapMode === "exactIn") {
      return swapAmountInParsed;
    } else {
      // For exactOut, we need the calculated amountIn from quote
      return swapQuoteExactOut?.[0] ?? 0n;
    }
  }, [swapMode, swapAmountInParsed, swapQuoteExactOut]);

  const needsApprovalForSwap = useMemo(() => {
    const allowance = selectedSide === "yes" ? yesAllowance : noAllowance;
    return swapInputAmount > 0n && (allowance ?? 0n) < swapInputAmount;
  }, [selectedSide, swapInputAmount, yesAllowance, noAllowance]);

  const needsApprovalForLiquidity = useMemo(() => {
    return (
      liquidityAmountParsed > 0n &&
      (collateralAllowance ?? 0n) < liquidityAmountParsed
    );
  }, [liquidityAmountParsed, collateralAllowance]);

  // Format helpers
  const formatAmount = (
    amount: bigint,
    decimals: number = collateralToken.decimals,
    precision: number = 2
  ) => {
    const value = parseFloat(formatUnits(amount, decimals));
    if (value > 0 && value < 0.01) {
      return value.toPrecision(4);
    }
    return value.toFixed(precision);
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

  // Load chart data
  const loadChartData = useCallback(async () => {
    if (!publicClient) return;

    setIsChartLoading(true);
    const chartPoints: ChartDataPoint[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    try {
      while (hasMore) {
        const result = (await publicClient.readContract({
          address: marketAddress,
          abi: AMM_ABI,
          functionName: "getRecentHourlyCandles",
          args: [offset, limit],
        })) as [AmmHourlyCandle[], boolean];

        const [candles, more] = result;
        const currentHour = Math.floor(Date.now() / 1000 / 3600);

        for (let i = 0; i < candles.length; i++) {
          const candle = candles[i];
          if (candle.openPrice === 0 && candle.closePrice === 0) continue;

          const hour = currentHour - offset - i;
          const time = hour * 3600;

          const open =
            (Number(candle.openPrice) / AMM_CANDLE_PRICE_SCALE) * 100;
          const high =
            (Number(candle.highPrice) / AMM_CANDLE_PRICE_SCALE) * 100;
          const low = (Number(candle.lowPrice) / AMM_CANDLE_PRICE_SCALE) * 100;
          const close =
            (Number(candle.closePrice) / AMM_CANDLE_PRICE_SCALE) * 100;
          const volume = Number(candle.volume) / 10 ** collateralToken.decimals;

          chartPoints.push({
            time,
            open,
            high,
            low,
            close,
            volume,
            trades: candle.trades,
          });
        }

        hasMore = more;
        offset += limit;
        if (offset > 10000) break;
      }

      // Reverse to chronological order
      chartPoints.reverse();

      // Adjust open prices to match previous candle's close for visual continuity
      for (let i = 1; i < chartPoints.length; i++) {
        const prevClose = chartPoints[i - 1].close;
        chartPoints[i].open = prevClose;
        chartPoints[i].high = Math.max(
          chartPoints[i].high,
          prevClose,
          chartPoints[i].close
        );
        chartPoints[i].low = Math.min(
          chartPoints[i].low,
          prevClose,
          chartPoints[i].close
        );
      }

      setChartData(chartPoints);
    } catch (error) {
      console.error("Failed to load chart data:", error);
    } finally {
      setIsChartLoading(false);
    }
  }, [publicClient, marketAddress, collateralToken.decimals]);

  // Load chart data on mount and when market changes
  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // Handle approve success - automatically trigger the pending action
  useEffect(() => {
    if (isApproveSuccess && txStep === "approve" && pendingAction) {
      // Refetch allowances first
      Promise.all([
        refetchCollateralAllowance(),
        refetchYesAllowance(),
        refetchNoAllowance(),
      ]).then(() => {
        // Execute the pending action
        if (pendingAction === "trade") {
          setTxStep("execute");
          if (tradeMode === "buy") {
            const minOut = buyQuote ? getMinOutput(buyQuote[0]) : 0n;
            writeExecute({
              address: marketAddress,
              abi: AMM_ABI,
              functionName: "buy",
              args: [selectedSide === "yes", inputAmountParsed, minOut],
            });
          } else {
            const minOut = sellQuote ? getMinOutput(sellQuote[0]) : 0n;
            writeExecute({
              address: marketAddress,
              abi: AMM_ABI,
              functionName: "sell",
              args: [selectedSide === "yes", inputAmountParsed, minOut],
            });
          }
        } else if (pendingAction === "swap") {
          setTxStep("execute");
          if (swapMode === "exactIn") {
            const minOut = swapQuoteExactIn
              ? getMinOutput(swapQuoteExactIn[0])
              : 0n;
            writeExecute({
              address: marketAddress,
              abi: AMM_ABI,
              functionName: "swapExactIn",
              args: [selectedSide === "yes", swapAmountInParsed, minOut],
            });
          } else {
            const maxIn = swapQuoteExactOut
              ? getMaxInput(swapQuoteExactOut[0])
              : 0n;
            writeExecute({
              address: marketAddress,
              abi: AMM_ABI,
              functionName: "swapExactOut",
              args: [selectedSide === "yes", swapAmountOutParsed, maxIn],
            });
          }
        } else if (pendingAction === "liquidity") {
          setTxStep("execute");
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
          writeExecute({
            address: marketAddress,
            abi: AMM_ABI,
            functionName: "addLiquidity",
            args: [liquidityAmountParsed, [0n, 0n], deadline],
          });
        }
        setPendingAction(null);
      });
    }
  }, [isApproveSuccess, txStep, pendingAction]);

  // Handle execute success
  useEffect(() => {
    if (isExecuteSuccess && txStep === "execute") {
      setInputAmount("");
      setSwapAmountIn("");
      setSwapAmountOut("");
      setLiquidityAmount("");
      setLpToRemove("");
      setTxStep("idle");
      setPendingAction(null);

      refetchMarketState();
      refetchReserves();
      refetchYesBalance();
      refetchNoBalance();
      refetchLpBalance();
      refetchCollateralBalance();
      refetchPollStatus();
      loadChartData();

      // Update position cache
      if (positionsContext?.hasScanned) {
        positionsContext.refreshPosition(pollAddress, "amm");
      }
    }
  }, [isExecuteSuccess, txStep, pollAddress, positionsContext]);

  // Handlers
  const handleApprove = (type: "trade" | "swap" | "liquidity") => {
    // Check if approval is actually needed
    let needsApproval = false;

    if (type === "trade") {
      needsApproval = needsApprovalForTrade;
    } else if (type === "swap") {
      needsApproval = needsApprovalForSwap;
    } else if (type === "liquidity") {
      needsApproval = needsApprovalForLiquidity;
    }

    // If no approval needed, directly execute the action
    if (!needsApproval) {
      if (type === "trade") {
        handleTrade();
      } else if (type === "swap") {
        handleSwap();
      } else if (type === "liquidity") {
        handleLiquidity();
      }
      return;
    }

    // Otherwise, proceed with approval
    setTxStep("approve");
    setPendingAction(type);

    if (type === "trade") {
      if (tradeMode === "buy") {
        writeApprove({
          address: collateralToken.address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [marketAddress, inputAmountParsed],
        });
      } else {
        const tokenAddr = selectedSide === "yes" ? yesTokenAddr : noTokenAddr;
        if (tokenAddr) {
          writeApprove({
            address: tokenAddr,
            abi: OUTCOME_TOKEN_ABI,
            functionName: "approve",
            args: [marketAddress, inputAmountParsed],
          });
        }
      }
    } else if (type === "swap") {
      const tokenAddr = selectedSide === "yes" ? yesTokenAddr : noTokenAddr;
      if (tokenAddr) {
        writeApprove({
          address: tokenAddr,
          abi: OUTCOME_TOKEN_ABI,
          functionName: "approve",
          args: [marketAddress, swapInputAmount],
        });
      }
    } else if (type === "liquidity") {
      writeApprove({
        address: collateralToken.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [marketAddress, liquidityAmountParsed],
      });
    }
  };

  const handleTrade = () => {
    setTxStep("execute");
    if (tradeMode === "buy") {
      const minOut = buyQuote ? getMinOutput(buyQuote[0]) : 0n;
      writeExecute({
        address: marketAddress,
        abi: AMM_ABI,
        functionName: "buy",
        args: [selectedSide === "yes", inputAmountParsed, minOut],
      });
    } else {
      const minOut = sellQuote ? getMinOutput(sellQuote[0]) : 0n;
      writeExecute({
        address: marketAddress,
        abi: AMM_ABI,
        functionName: "sell",
        args: [selectedSide === "yes", inputAmountParsed, minOut],
      });
    }
  };

  const handleSwap = () => {
    setTxStep("execute");
    if (swapMode === "exactIn") {
      const minOut = swapQuoteExactIn ? getMinOutput(swapQuoteExactIn[0]) : 0n;
      writeExecute({
        address: marketAddress,
        abi: AMM_ABI,
        functionName: "swapExactIn",
        args: [selectedSide === "yes", swapAmountInParsed, minOut],
      });
    } else {
      // ExactOut: maxAmountIn = calculated amountIn * (1 + slippage)
      const maxIn = swapQuoteExactOut ? getMaxInput(swapQuoteExactOut[0]) : 0n;
      writeExecute({
        address: marketAddress,
        abi: AMM_ABI,
        functionName: "swapExactOut",
        args: [selectedSide === "yes", swapAmountOutParsed, maxIn],
      });
    }
  };

  const handleLiquidity = () => {
    setTxStep("execute");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

    if (liquidityAmountParsed > 0n) {
      writeExecute({
        address: marketAddress,
        abi: AMM_ABI,
        functionName: "addLiquidity",
        args: [liquidityAmountParsed, [0n, 0n], deadline],
      });
    } else if (lpToRemoveParsed > 0n) {
      // Calculate minCollateralOut with slippage protection
      const minCollateralOut =
        removeQuote.collateralToReturn > 0n
          ? (removeQuote.collateralToReturn *
              BigInt(Math.floor((100 - slippage) * 100))) /
            10000n
          : 0n;
      writeExecute({
        address: marketAddress,
        abi: AMM_ABI,
        functionName: "removeLiquidity",
        args: [lpToRemoveParsed, deadline, minCollateralOut],
      });
    }
  };

  const handleRedeem = () => {
    setTxStep("execute");
    writeExecute({
      address: marketAddress,
      abi: AMM_ABI,
      functionName: "redeemWinnings",
    });
  };

  const handleWithdrawFees = () => {
    setTxStep("execute");
    writeExecute({
      address: marketAddress,
      abi: AMM_ABI,
      functionName: "withdrawProtocolFees",
    });
  };

  // Check if current user is the market creator
  const isCreator =
    address &&
    info?.creator &&
    address.toLowerCase() === info.creator.toLowerCase();

  const isLoading =
    isApprovePending ||
    isApproveConfirming ||
    isExecutePending ||
    isExecuteConfirming;

  // Check for imbalance limits
  const isOverImbalanceLimitTrade = useMemo(() => {
    if (tradeMode === "buy" && buyQuote) {
      return buyQuote[0] === 0n && inputAmountParsed > 0n;
    }
    if (tradeMode === "sell" && sellQuote) {
      return sellQuote[0] === 0n && inputAmountParsed > 0n;
    }
    return false;
  }, [tradeMode, buyQuote, sellQuote, inputAmountParsed]);

  const isOverImbalanceLimitSwap = useMemo(() => {
    if (swapMode === "exactIn" && swapQuoteExactIn) {
      return swapQuoteExactIn[0] === 0n && swapAmountInParsed > 0n;
    }
    if (swapMode === "exactOut" && swapQuoteExactOut) {
      return swapQuoteExactOut[0] === 0n && swapAmountOutParsed > 0n;
    }
    return false;
  }, [
    swapMode,
    swapQuoteExactIn,
    swapQuoteExactOut,
    swapAmountInParsed,
    swapAmountOutParsed,
  ]);

  const maxAllowedTrade = useMemo(() => {
    if (tradeMode === "buy" && buyQuote) return buyQuote[1];
    if (tradeMode === "sell" && sellQuote) return sellQuote[2];
    return 0n;
  }, [tradeMode, buyQuote, sellQuote]);

  const maxAllowedSwap = useMemo(() => {
    if (swapMode === "exactIn" && swapQuoteExactIn) return swapQuoteExactIn[2];
    if (swapMode === "exactOut" && swapQuoteExactOut)
      return swapQuoteExactOut[2];
    return 0n;
  }, [swapMode, swapQuoteExactIn, swapQuoteExactOut]);

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
          AMM Market
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await Promise.all([
                refetchMarketState(),
                refetchReserves(),
                refetchYesBalance(),
                refetchNoBalance(),
                refetchLpBalance(),
                refetchCollateralBalance(),
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
              <span className="text-gray-400 text-xs">TVL</span>
              <p className="text-sm sm:text-lg font-semibold text-white">
                <span className="sm:hidden">${formatCompactAmount(tvl)}</span>
                <span className="hidden sm:inline">${formatAmount(tvl)}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs">Fee</span>
              <p className="text-sm text-white">
                {info
                  ? `${((info.tradingFee / AMM_BPS_DENOMINATOR) * 100).toFixed(
                      2
                    )}%`
                  : "--"}
              </p>
            </div>
            {hasImbalanceLimit && (
              <div className="text-right">
                <span className="text-gray-400 text-xs">Hourly Limit</span>
                <p className="text-sm text-amber-400">
                  ±{imbalanceLimitPercent.toFixed(1)}%
                </p>
              </div>
            )}
            <div className="text-right">
              <span className="text-gray-400 text-xs">Ends</span>
              <p className="text-sm text-white">
                {info ? formatTimeRemaining(info.closeTimestamp) : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Chart + Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart - Full width on left */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">
                Price Chart
              </h3>
              {/* Chart Type Toggle */}
              <div className="flex bg-slate-700 rounded p-0.5">
                <button
                  onClick={() => setChartType("line")}
                  className={`p-1 rounded transition-colors ${
                    chartType === "line"
                      ? "bg-slate-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Line Chart"
                >
                  <LineChart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType("candle")}
                  className={`p-1 rounded transition-colors ${
                    chartType === "candle"
                      ? "bg-slate-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Candlestick Chart"
                >
                  <CandlestickChart className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Slippage Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-slate-700 rounded"
                >
                  <Settings className="w-3 h-3" />
                  {slippage}% slippage
                </button>
                {showSlippageSettings && (
                  <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg p-3 z-10 min-w-[200px]">
                    <div className="text-xs text-gray-400 mb-2">
                      Slippage Tolerance
                    </div>
                    <div className="flex gap-1 mb-2">
                      {SLIPPAGE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setSlippage(preset)}
                          className={`flex-1 py-1 text-xs rounded transition-all ${
                            slippage === preset
                              ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={slippage}
                      onChange={(e) =>
                        setSlippage(
                          Math.max(0.1, parseFloat(e.target.value) || 0.5)
                        )
                      }
                      step="0.1"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      placeholder="Custom %"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="aspect-[2/1] sm:aspect-[5/2] rounded-lg overflow-hidden">
            <PriceChart
              data={chartData}
              isLoading={isChartLoading}
              chartType={chartType}
            />
          </div>
        </div>

        {/* Trading Panel - Buy/Sell only */}
        <div className="card p-4">
          <h3 className="text-base font-semibold text-white mb-3">Trade</h3>

          {isFinalized ? (
            <div className="text-center py-6">
              <Award className="w-10 h-10 text-blue-400 mx-auto mb-2" />
              <p className="text-white font-medium mb-1">Market Resolved</p>
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
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Redeem Winnings"
                  )}
                </button>
              )}
            </div>
          ) : !isLive ? (
            <div className="text-center py-6 space-y-3">
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
          ) : (
            <div className="space-y-4">
              {/* Buy/Sell/Swap Tabs */}
              <div className="flex border-b border-slate-700">
                <button
                  onClick={() => setTradeMode("buy")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    tradeMode === "buy"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Buy
                  {tradeMode === "buy" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
                <button
                  onClick={() => setTradeMode("sell")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    tradeMode === "sell"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Sell
                  {tradeMode === "sell" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
                <button
                  onClick={() => setTradeMode("swap")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    tradeMode === "swap"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Swap
                  {tradeMode === "swap" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
              </div>

              {/* Buy/Sell Mode */}
              {(tradeMode === "buy" || tradeMode === "sell") && (
                <>
                  {/* Side Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedSide("yes")}
                      className={`py-3 rounded-lg font-semibold transition-all ${
                        selectedSide === "yes"
                          ? "bg-green-500 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      }`}
                    >
                      <div className="text-sm">YES</div>
                      <div className="text-xs opacity-80">
                        {yesChance.toFixed(1)}%
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedSide("no")}
                      className={`py-3 rounded-lg font-semibold transition-all ${
                        selectedSide === "no"
                          ? "bg-red-500 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      }`}
                    >
                      <div className="text-sm">NO</div>
                      <div className="text-xs opacity-80">
                        {noChance.toFixed(1)}%
                      </div>
                    </button>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>
                        {tradeMode === "buy"
                          ? `Pay (${collateralToken.symbol})`
                          : `Sell (${selectedSide.toUpperCase()})`}
                      </span>
                      <span>
                        Bal:{" "}
                        {tradeMode === "buy"
                          ? formatAmount(userCollateralBalance ?? 0n)
                          : formatAmount(
                              selectedSide === "yes"
                                ? userYesBalance ?? 0n
                                : userNoBalance ?? 0n,
                              collateralToken.decimals
                            )}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  {/* Quote Preview */}
                  {inputAmountParsed > 0n && (
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                      {isOverImbalanceLimitTrade ? (
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <div>
                            <div>
                              Exceeds hourly limit (±
                              {imbalanceLimitPercent.toFixed(1)}%)
                            </div>
                            <div className="text-xs text-gray-400">
                              Max:{" "}
                              {formatAmount(
                                maxAllowedTrade,
                                collateralToken.decimals
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">You receive</span>
                            <span className="text-white font-medium">
                              {tradeMode === "buy" && buyQuote
                                ? formatAmount(
                                    buyQuote[0],
                                    collateralToken.decimals
                                  )
                                : tradeMode === "sell" && sellQuote
                                ? formatAmount(sellQuote[0])
                                : "0"}{" "}
                              {tradeMode === "buy"
                                ? selectedSide.toUpperCase()
                                : collateralToken.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Min (after {slippage}% slippage)</span>
                            <span>
                              {tradeMode === "buy" && buyQuote
                                ? formatAmount(
                                    getMinOutput(buyQuote[0]),
                                    collateralToken.decimals
                                  )
                                : tradeMode === "sell" && sellQuote
                                ? formatAmount(getMinOutput(sellQuote[0]))
                                : "0"}
                            </span>
                          </div>
                          {tradeMode === "sell" && sellQuote && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">
                                Protocol Fee
                              </span>
                              <span className="text-gray-300">
                                ${formatAmount(sellQuote[1])}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {!isConnected ? (
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center text-gray-400 text-sm">
                      Connect wallet to trade
                    </div>
                  ) : needsApprovalForTrade ? (
                    <button
                      onClick={() => handleApprove("trade")}
                      disabled={isLoading || isOverImbalanceLimitTrade}
                      className="w-full py-3 rounded-lg font-semibold bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        `Approve ${
                          tradeMode === "buy"
                            ? collateralToken.symbol
                            : selectedSide.toUpperCase()
                        }`
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleTrade}
                      disabled={
                        isLoading ||
                        inputAmountParsed === 0n ||
                        isOverImbalanceLimitTrade
                      }
                      className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                        tradeMode === "buy"
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : tradeMode === "buy" ? (
                        `Buy ${selectedSide.toUpperCase()}`
                      ) : (
                        `Sell ${selectedSide.toUpperCase()}`
                      )}
                    </button>
                  )}
                </>
              )}

              {/* Swap Mode */}
              {tradeMode === "swap" && (
                <div className="space-y-2">
                  {/* Token In */}
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>You pay</span>
                      <span className="truncate ml-2">
                        Bal:{" "}
                        {formatAmount(
                          selectedSide === "yes"
                            ? userYesBalance ?? 0n
                            : userNoBalance ?? 0n,
                          collateralToken.decimals
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={
                          swapMode === "exactOut" && swapQuoteExactOut
                            ? formatUnits(
                                swapQuoteExactOut[0],
                                collateralToken.decimals
                              )
                            : swapAmountIn
                        }
                        onChange={(e) => {
                          setSwapAmountIn(e.target.value);
                          setSwapAmountOut("");
                          setSwapMode("exactIn");
                        }}
                        placeholder="0.00"
                        className="flex-1 min-w-0 bg-transparent text-lg text-white focus:outline-none"
                      />
                      <div
                        className={`px-3 py-1.5 rounded text-sm font-medium flex-shrink-0 ${
                          selectedSide === "yes"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {selectedSide === "yes" ? "YES" : "NO"}
                      </div>
                    </div>
                  </div>

                  {/* Swap Direction Toggle */}
                  <div className="flex justify-center -my-1">
                    <button
                      onClick={() => {
                        setSelectedSide(selectedSide === "yes" ? "no" : "yes");
                        setSwapAmountIn("");
                        setSwapAmountOut("");
                      }}
                      className="bg-slate-700 hover:bg-slate-600 rounded-full p-2 transition-colors"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-gray-400 rotate-90" />
                    </button>
                  </div>

                  {/* Token Out */}
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>You receive</span>
                      <span className="truncate ml-2">
                        Bal:{" "}
                        {formatAmount(
                          selectedSide === "yes"
                            ? userNoBalance ?? 0n
                            : userYesBalance ?? 0n,
                          collateralToken.decimals
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={
                          swapMode === "exactIn" && swapQuoteExactIn
                            ? formatUnits(
                                swapQuoteExactIn[0],
                                collateralToken.decimals
                              )
                            : swapAmountOut
                        }
                        onChange={(e) => {
                          setSwapAmountOut(e.target.value);
                          setSwapAmountIn("");
                          setSwapMode("exactOut");
                        }}
                        placeholder="0.00"
                        className="flex-1 min-w-0 bg-transparent text-lg text-white focus:outline-none"
                      />
                      <div
                        className={`px-3 py-1.5 rounded text-sm font-medium flex-shrink-0 ${
                          selectedSide === "yes"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {selectedSide === "yes" ? "NO" : "YES"}
                      </div>
                    </div>
                  </div>

                  {/* Swap Details */}
                  {((swapMode === "exactIn" && swapAmountInParsed > 0n) ||
                    (swapMode === "exactOut" && swapAmountOutParsed > 0n)) && (
                    <div className="bg-slate-800/30 rounded-lg p-3 space-y-1 text-sm">
                      {isOverImbalanceLimitSwap ? (
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            Limit exceeded. Max:{" "}
                            {formatAmount(
                              maxAllowedSwap,
                              collateralToken.decimals
                            )}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-gray-500">
                            <span className="truncate">
                              {swapMode === "exactIn"
                                ? "Min receive"
                                : "Max pay"}{" "}
                              ({slippage}%)
                            </span>
                            <span className="ml-2 flex-shrink-0">
                              {swapMode === "exactIn" && swapQuoteExactIn
                                ? formatAmount(
                                    getMinOutput(swapQuoteExactIn[0]),
                                    collateralToken.decimals
                                  )
                                : swapMode === "exactOut" && swapQuoteExactOut
                                ? formatAmount(
                                    getMaxInput(swapQuoteExactOut[0]),
                                    collateralToken.decimals
                                  )
                                : "0"}
                            </span>
                          </div>
                          {((swapMode === "exactIn" && swapQuoteExactIn) ||
                            (swapMode === "exactOut" && swapQuoteExactOut)) && (
                            <div className="flex justify-between text-gray-500">
                              <span>Fee</span>
                              <span>
                                {formatAmount(
                                  swapMode === "exactIn"
                                    ? swapQuoteExactIn![1]
                                    : swapQuoteExactOut![1],
                                  collateralToken.decimals
                                )}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Swap Button */}
                  {!isConnected ? (
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center text-gray-400 text-sm">
                      Connect wallet to swap
                    </div>
                  ) : needsApprovalForSwap ? (
                    <button
                      onClick={() => handleApprove("swap")}
                      disabled={isLoading || isOverImbalanceLimitSwap}
                      className="w-full py-3 rounded-lg font-semibold bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        `Approve ${selectedSide.toUpperCase()}`
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSwap}
                      disabled={
                        isLoading ||
                        (swapMode === "exactIn" && swapAmountInParsed === 0n) ||
                        (swapMode === "exactOut" &&
                          swapAmountOutParsed === 0n) ||
                        isOverImbalanceLimitSwap
                      }
                      className="w-full py-3 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        `Swap ${selectedSide.toUpperCase()} → ${
                          selectedSide === "yes" ? "NO" : "YES"
                        }`
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Time remaining */}
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Closes in{" "}
                    <span className="text-white font-medium">
                      {info ? formatTimeRemaining(info.closeTimestamp) : "--"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel - Liquidity + Position + Reserves Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left side - Reserves Info (Desktop) / Liquidity (Mobile) */}
        <div className="card p-4 order-3 lg:order-1 flex flex-col overflow-hidden min-h-0">
          <h4 className="text-base font-semibold text-white mb-2 lg:mb-4 shrink-0">
            Reserves Info
          </h4>

          {/* Water Tank Reserves */}
          <div className="flex-1 flex items-center justify-center min-h-0 py-1">
            <div className="flex justify-center items-start gap-3 sm:gap-4 lg:gap-8">
              {/* YES Reserve Tank */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32">
                  {/* Tank border */}
                  <div className="absolute inset-0 rounded-full border-2 border-green-500/30 overflow-hidden bg-slate-800/50">
                    {/* Water fill */}
                    <div
                      className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                      style={{
                        height: `${
                          reserveYes > 0n && reserveNo > 0n
                            ? Math.max(
                                5,
                                Math.min(
                                  95,
                                  Number(
                                    (reserveYes * 100n) /
                                      (reserveYes + reserveNo)
                                  )
                                )
                              )
                            : reserveYes > 0n
                            ? 100
                            : 0
                        }%`,
                      }}
                    >
                      {/* Wave animation */}
                      <div className="absolute inset-0 bg-gradient-to-t from-green-500/60 to-green-400/40">
                        <svg
                          className="absolute top-0 left-0 w-full"
                          viewBox="0 0 80 8"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M0,4 Q10,0 20,4 T40,4 T60,4 T80,4 L80,8 L0,8 Z"
                            fill="rgba(34, 197, 94, 0.3)"
                            className="animate-wave"
                          />
                          <path
                            d="M0,4 Q10,8 20,4 T40,4 T60,4 T80,4 L80,8 L0,8 Z"
                            fill="rgba(34, 197, 94, 0.2)"
                            className="animate-wave-reverse"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* Percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-xs sm:text-sm lg:text-lg drop-shadow-lg">
                      {reserveYes > 0n && reserveNo > 0n
                        ? `${Number(
                            (reserveYes * 100n) / (reserveYes + reserveNo)
                          ).toFixed(0)}%`
                        : reserveYes > 0n
                        ? "100%"
                        : "0%"}
                    </span>
                  </div>
                </div>
                <span className="text-green-400 text-xs lg:text-sm mt-1 lg:mt-2 font-medium">
                  YES
                </span>
                <span className="text-gray-400 text-xs lg:text-sm">
                  {formatAmount(reserveYes, collateralToken.decimals)}
                </span>
              </div>

              {/* NO Reserve Tank */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32">
                  {/* Tank border */}
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/30 overflow-hidden bg-slate-800/50">
                    {/* Water fill */}
                    <div
                      className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                      style={{
                        height: `${
                          reserveYes > 0n && reserveNo > 0n
                            ? Math.max(
                                5,
                                Math.min(
                                  95,
                                  Number(
                                    (reserveNo * 100n) /
                                      (reserveYes + reserveNo)
                                  )
                                )
                              )
                            : reserveNo > 0n
                            ? 100
                            : 0
                        }%`,
                      }}
                    >
                      {/* Wave animation */}
                      <div className="absolute inset-0 bg-gradient-to-t from-red-500/60 to-red-400/40">
                        <svg
                          className="absolute top-0 left-0 w-full"
                          viewBox="0 0 80 8"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M0,4 Q10,0 20,4 T40,4 T60,4 T80,4 L80,8 L0,8 Z"
                            fill="rgba(239, 68, 68, 0.3)"
                            className="animate-wave-reverse"
                          />
                          <path
                            d="M0,4 Q10,8 20,4 T40,4 T60,4 T80,4 L80,8 L0,8 Z"
                            fill="rgba(239, 68, 68, 0.2)"
                            className="animate-wave"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* Percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-xs sm:text-sm lg:text-lg drop-shadow-lg">
                      {reserveYes > 0n && reserveNo > 0n
                        ? `${Number(
                            (reserveNo * 100n) / (reserveYes + reserveNo)
                          ).toFixed(0)}%`
                        : reserveNo > 0n
                        ? "100%"
                        : "0%"}
                    </span>
                  </div>
                </div>
                <span className="text-red-400 text-xs lg:text-sm mt-1 lg:mt-2 font-medium">
                  NO
                </span>
                <span className="text-gray-400 text-xs lg:text-sm">
                  {formatAmount(reserveNo, collateralToken.decimals)}
                </span>
              </div>
            </div>
          </div>

          {/* CSS for wave animation */}
          <style>{`
            @keyframes wave {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(-10px); }
            }
            @keyframes wave-reverse {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(10px); }
            }
            .animate-wave {
              animation: wave 3s ease-in-out infinite;
            }
            .animate-wave-reverse {
              animation: wave-reverse 3s ease-in-out infinite;
            }
          `}</style>
        </div>

        {/* Center - Your Position */}
        <div className="card p-4 flex flex-col order-2 lg:order-2">
          <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Your Position
          </h4>
          {!isConnected ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Connect wallet</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* YES Position */}
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">YES</span>
                  </div>
                  <span className="text-white font-medium">
                    {formatAmount(
                      userYesBalance ?? 0n,
                      collateralToken.decimals
                    )}
                  </span>
                </div>

                {/* NO Position */}
                <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">NO</span>
                  </div>
                  <span className="text-white font-medium">
                    {formatAmount(
                      userNoBalance ?? 0n,
                      collateralToken.decimals
                    )}
                  </span>
                </div>

                {/* LP Position */}
                <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm">LP</span>
                  </div>
                  <span className="text-white font-medium">
                    {formatLpAmount(userLpBalance ?? 0n)}
                  </span>
                </div>

                {/* Protocol Fees - only for creator */}
                {isCreator && protocolFees > 0n && (
                  <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        Protocol Fees
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      ${formatAmount(protocolFees, collateralToken.decimals)}
                    </span>
                  </div>
                )}
              </div>

              {/* Withdraw Protocol Fees - only for creator when fees available */}
              {isCreator && protocolFees > 0n && (
                <button
                  onClick={handleWithdrawFees}
                  disabled={isLoading}
                  className="w-full mt-4 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `Claim Fees ($${formatAmount(
                      protocolFees,
                      collateralToken.decimals
                    )})`
                  )}
                </button>
              )}

              {/* Redeem Button */}
              {canRedeem && (
                <button
                  onClick={handleRedeem}
                  disabled={isLoading}
                  className="w-full mt-4 py-2 rounded-lg font-semibold bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-all text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Redeem Winnings"
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right side - Liquidity (Desktop) / Reserves Info (Mobile) */}
        <div className="card p-4 order-1 lg:order-3">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            Liquidity
          </h3>

          {/* Total LP Supply */}
          <div className="flex justify-between text-sm mb-4 pb-3 border-b border-slate-700">
            <span className="text-gray-400">Total LP Supply</span>
            <span className="text-white font-medium">
              {formatLpAmount(totalLP)}
            </span>
          </div>

          <div className="space-y-4">
            {/* Add Liquidity - only when market is live */}
            {isLive ? (
              <div>
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Liquidity
                </h4>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Amount ({collateralToken.symbol})</span>
                  <span>Bal: {formatAmount(userCollateralBalance ?? 0n)}</span>
                </div>
                <input
                  type="number"
                  value={liquidityAmount}
                  onChange={(e) => {
                    setLiquidityAmount(e.target.value);
                    setLpToRemove("");
                  }}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            ) : isFinalized ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                  <Award className="w-4 h-4" />
                  <span className="font-medium">Market Resolved</span>
                </div>
                <p className="text-xs text-gray-400">
                  Remove liquidity to receive YES + NO tokens, then use Redeem
                  to claim winnings.
                </p>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Market Closed</span>
                </div>
                <p className="text-xs text-gray-400">
                  You can still remove liquidity. After close, you receive YES +
                  NO tokens instead of {collateralToken.symbol}.
                </p>
              </div>
            )}

            {/* Remove Liquidity - ALWAYS available (even after finalization) */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-1">
                <Minus className="w-4 h-4" />
                Remove Liquidity
              </h4>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>LP Tokens</span>
                <span>Bal: {formatLpAmount(userLpBalance ?? 0n)}</span>
              </div>
              <input
                type="number"
                value={lpToRemove}
                onChange={(e) => {
                  setLpToRemove(e.target.value);
                  setLiquidityAmount("");
                }}
                placeholder="0.00"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary-500"
              />

              {/* Remove Quote */}
              {lpToRemoveParsed > 0n && (
                <div className="mt-2 bg-slate-800/50 rounded-lg p-2 space-y-1 text-xs">
                  <div className="text-gray-400 mb-1">You will receive:</div>
                  {removeQuote.collateralToReturn > 0n && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        {collateralToken.symbol}
                      </span>
                      <span className="text-white font-medium">
                        {formatAmount(
                          removeQuote.collateralToReturn,
                          collateralToken.decimals
                        )}
                      </span>
                    </div>
                  )}
                  {removeQuote.yesToReturn > 0n && (
                    <div className="flex justify-between">
                      <span className="text-green-400">YES</span>
                      <span className="text-white">
                        {formatAmount(
                          removeQuote.yesToReturn,
                          collateralToken.decimals
                        )}
                      </span>
                    </div>
                  )}
                  {removeQuote.noToReturn > 0n && (
                    <div className="flex justify-between">
                      <span className="text-red-400">NO</span>
                      <span className="text-white">
                        {formatAmount(
                          removeQuote.noToReturn,
                          collateralToken.decimals
                        )}
                      </span>
                    </div>
                  )}
                  {removeQuote.collateralToReturn > 0n && (
                    <div className="flex justify-between mt-1 pt-1 border-t border-slate-600">
                      <span className="text-gray-500">
                        Min {collateralToken.symbol} ({slippage}% slippage)
                      </span>
                      <span className="text-gray-400">
                        {formatAmount(
                          (removeQuote.collateralToReturn *
                            BigInt(Math.floor((100 - slippage) * 100))) /
                            10000n,
                          collateralToken.decimals
                        )}
                      </span>
                    </div>
                  )}
                  {/* Hint when market is closed or finalized */}
                  {!isLive &&
                    removeQuote.collateralToReturn === 0n &&
                    (removeQuote.yesToReturn > 0n ||
                      removeQuote.noToReturn > 0n) && (
                      <div className="mt-1 pt-1 border-t border-slate-600 text-gray-500">
                        <span>
                          No {collateralToken.symbol} (market{" "}
                          {isFinalized ? "resolved" : "closed"}) — redeem tokens
                          after resolution
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Action Button */}
            {!isConnected ? (
              <div className="bg-slate-700/50 rounded-lg p-3 text-center text-gray-400 text-sm">
                Connect wallet
              </div>
            ) : needsApprovalForLiquidity && liquidityAmountParsed > 0n ? (
              <button
                onClick={() => handleApprove("liquidity")}
                disabled={isLoading}
                className="w-full py-2 rounded-lg font-semibold bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  `Approve ${collateralToken.symbol}`
                )}
              </button>
            ) : (
              <button
                onClick={handleLiquidity}
                disabled={
                  isLoading ||
                  (liquidityAmountParsed === 0n && lpToRemoveParsed === 0n) ||
                  (!isLive && liquidityAmountParsed > 0n) // Can't add liquidity when closed/finalized
                }
                className="w-full py-2 rounded-lg font-semibold bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : lpToRemoveParsed > 0n ? (
                  "Remove Liquidity"
                ) : liquidityAmountParsed > 0n ? (
                  "Add Liquidity"
                ) : (
                  "Enter Amount"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Market Details */}
      <div className="card p-4">
        <h3 className="text-base font-semibold text-white mb-3">
          Market Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Trading Fee</span>
            <p className="text-white">
              {info
                ? `${((info.tradingFee / AMM_BPS_DENOMINATOR) * 100).toFixed(
                    2
                  )}%`
                : "--"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Protocol Fee</span>
            <p className="text-white">
              {info
                ? `${(
                    (info.protocolFeeRate / AMM_BPS_DENOMINATOR) *
                    100
                  ).toFixed(2)}%`
                : "--"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Max Hourly Move</span>
            <p
              className={
                info?.maxPriceImbalancePerHour ? "text-amber-400" : "text-white"
              }
            >
              {info
                ? info.maxPriceImbalancePerHour > 0
                  ? `±${imbalanceLimitPercent.toFixed(1)}%`
                  : "Unlimited"
                : "--"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Close Date</span>
            <p className="text-white">
              {info
                ? new Date(info.closeTimestamp * 1000).toLocaleDateString()
                : "--"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Market</span>
            <a
              href={getExplorerUrl(marketAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300"
            >
              {marketAddress.slice(0, 6)}...{marketAddress.slice(-4)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div>
            <span className="text-gray-500">Poll</span>
            <a
              href={getExplorerUrl(pollAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300"
            >
              {pollAddress.slice(0, 6)}...{pollAddress.slice(-4)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div>
            <span className="text-gray-500">YES Token</span>
            {yesTokenAddr && (
              <a
                href={getExplorerUrl(yesTokenAddr)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-400 hover:text-primary-300"
              >
                {yesTokenAddr.slice(0, 6)}...{yesTokenAddr.slice(-4)}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div>
            <span className="text-gray-500">NO Token</span>
            {noTokenAddr && (
              <a
                href={getExplorerUrl(noTokenAddr)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-400 hover:text-primary-300"
              >
                {noTokenAddr.slice(0, 6)}...{noTokenAddr.slice(-4)}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmmMarketPage;
