import { useState, useEffect, useMemo } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  MARKET_FACTORY_ABI,
  ERC20_ABI,
  MARKET_CONSTANTS,
  CollateralToken,
} from "@/config/abi";
import { getContractConfig, COLLATERAL_TOKENS } from "@/config/contract";
import { PollInfo } from "@/types";
import { useMarkets } from "@/hooks/useMarkets";
import PariMutuelCurveChart from "./PariMutuelCurveChart";
import PriceCurveInfoModal from "./PriceCurveInfoModal";

type MarketType = "amm" | "pariMutuel";

interface CreateMarketFormProps {
  poll: PollInfo;
  initialMarketType?: MarketType;
  onBack: () => void;
  onSuccess: () => void;
}

const CreateMarketForm = ({
  poll,
  initialMarketType = "amm",
  onBack,
  onSuccess,
}: CreateMarketFormProps) => {
  const { address } = useAccount();
  const contractConfig = getContractConfig();
  const { refreshMarketsForPolls } = useMarkets();

  // Form state
  const [marketType, setMarketType] = useState<MarketType>(initialMarketType);
  const [selectedToken, setSelectedToken] = useState<CollateralToken>(
    COLLATERAL_TOKENS[0]
  );
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [initialLiquidity, setInitialLiquidity] = useState(
    initialMarketType === "amm" ? "1000" : "10"
  );
  const [yesWeight, setYesWeight] = useState("50");
  const [noWeight, setNoWeight] = useState("50");

  // AMM specific
  const [feeTier, setFeeTier] = useState(3000); // 0.3% default
  const [customFeeTier, setCustomFeeTier] = useState("");
  const [useCustomFeeTier, setUseCustomFeeTier] = useState(false);
  const [maxPriceImbalance, setMaxPriceImbalance] = useState(0);
  const [customImbalance, setCustomImbalance] = useState("");
  const [useCustomImbalance, setUseCustomImbalance] = useState(false);

  // PariMutuel specific
  const [curveFlattener, setCurveFlattener] = useState(5);
  const [curveOffset, setCurveOffset] = useState(0);
  const [customOffset, setCustomOffset] = useState("");
  const [useCustomOffset, setUseCustomOffset] = useState(false);

  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "approve" | "create">("form");

  // Read user's token balance
  const { data: tokenBalance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: selectedToken.address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: address
        ? [address, contractConfig.marketFactoryAddress]
        : undefined,
      query: { enabled: !!address },
    }
  );

  // Calculate liquidity in token units
  const liquidityAmount = useMemo(() => {
    try {
      return parseUnits(initialLiquidity || "0", selectedToken.decimals);
    } catch {
      return 0n;
    }
  }, [initialLiquidity, selectedToken.decimals]);

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!currentAllowance || liquidityAmount === 0n) return true;
    return currentAllowance < liquidityAmount;
  }, [currentAllowance, liquidityAmount]);

  // Check if distribution weights sum to 100
  const isDistributionInvalid = useMemo(() => {
    const yes = parseInt(yesWeight);
    const no = parseInt(noWeight);
    if (isNaN(yes) || isNaN(no)) return true;
    return yes + no !== 100;
  }, [yesWeight, noWeight]);

  // Format balance for display
  const formattedBalance = useMemo(() => {
    if (!tokenBalance) return "0";
    return formatUnits(tokenBalance, selectedToken.decimals);
  }, [tokenBalance, selectedToken.decimals]);

  // Validate inputs
  const validationError = useMemo(() => {
    const liq = parseFloat(initialLiquidity);
    if (isNaN(liq) || liq < 1) {
      return "Initial liquidity must be at least 1 " + selectedToken.symbol;
    }

    if (tokenBalance && liquidityAmount > tokenBalance) {
      return `Insufficient balance. You have ${formattedBalance} ${selectedToken.symbol}`;
    }

    const yes = parseInt(yesWeight);
    const no = parseInt(noWeight);
    if (isNaN(yes) || isNaN(no) || yes <= 0 || no <= 0) {
      return "Distribution weights must be positive numbers";
    }
    if (yes + no !== 100) {
      return "Distribution weights must sum to 100";
    }

    if (marketType === "amm") {
      // Custom fee tier is in percent, convert to BPS (* 10000)
      const fee = useCustomFeeTier
        ? Math.round(parseFloat(customFeeTier) * 10000)
        : feeTier;
      if (
        isNaN(fee) ||
        fee < MARKET_CONSTANTS.MIN_FEE_TIER ||
        fee > MARKET_CONSTANTS.MAX_FEE_TIER
      ) {
        return "Fee tier must be between 0.05% and 1%";
      }

      if (useCustomImbalance) {
        // Custom imbalance is in percent, convert to BPS (* 10000)
        const imb = Math.round(parseFloat(customImbalance) * 10000);
        if (isNaN(imb) || imb < 0 || imb > MARKET_CONSTANTS.BPS_DENOMINATOR) {
          return "Price imbalance must be between 0% and 100%";
        }
      }
    }

    if (marketType === "pariMutuel") {
      if (curveFlattener < 1 || curveFlattener > 11) {
        return "Curve flattener must be between 1 and 11";
      }

      // Custom offset is in percent, convert to BPS (* 10000)
      const offset = useCustomOffset
        ? Math.round(parseFloat(customOffset) * 10000)
        : curveOffset;
      if (
        isNaN(offset) ||
        offset < 0 ||
        offset >= MARKET_CONSTANTS.BPS_DENOMINATOR
      ) {
        return "Curve offset must be between 0% and 99.99%";
      }
    }

    return null;
  }, [
    initialLiquidity,
    selectedToken,
    tokenBalance,
    liquidityAmount,
    formattedBalance,
    yesWeight,
    noWeight,
    marketType,
    feeTier,
    customFeeTier,
    useCustomFeeTier,
    maxPriceImbalance,
    customImbalance,
    useCustomImbalance,
    curveFlattener,
    curveOffset,
    customOffset,
    useCustomOffset,
  ]);

  // Approve transaction
  const {
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApprovePending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Create market transaction
  const {
    data: createHash,
    writeContract: writeCreate,
    isPending: isCreatePending,
  } = useWriteContract();

  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess } =
    useWaitForTransactionReceipt({ hash: createHash });

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setStep("create");
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Handle create success
  useEffect(() => {
    if (isCreateSuccess) {
      // Wait a bit for blockchain to update, then refresh markets
      setTimeout(() => {
        refreshMarketsForPolls([poll.pollAddress]);
        onSuccess();
      }, 2000);
    }
  }, [isCreateSuccess, refreshMarketsForPolls, poll.pollAddress, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (validationError) {
      setError(validationError);
      return;
    }

    if (needsApproval) {
      setStep("approve");
      try {
        writeApprove({
          address: selectedToken.address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contractConfig.marketFactoryAddress, liquidityAmount],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Approval failed");
        setStep("form");
      }
    } else {
      executeCreate();
    }
  };

  const executeCreate = () => {
    setStep("create");
    const distributionHint: [bigint, bigint] = [
      BigInt(yesWeight),
      BigInt(noWeight),
    ];

    try {
      if (marketType === "amm") {
        // Custom values are in percent, convert to BPS (* 10000)
        const finalFeeTier = useCustomFeeTier
          ? Math.round(parseFloat(customFeeTier) * 10000)
          : feeTier;
        const finalImbalance = useCustomImbalance
          ? Math.round(parseFloat(customImbalance) * 10000)
          : maxPriceImbalance;

        writeCreate({
          address: contractConfig.marketFactoryAddress,
          abi: MARKET_FACTORY_ABI,
          functionName: "createMarket",
          args: [
            poll.pollAddress,
            selectedToken.address,
            liquidityAmount,
            distributionHint,
            finalFeeTier,
            finalImbalance,
          ],
        });
      } else {
        // Custom offset is in percent, convert to BPS (* 10000)
        const finalOffset = useCustomOffset
          ? Math.round(parseFloat(customOffset) * 10000)
          : curveOffset;

        writeCreate({
          address: contractConfig.marketFactoryAddress,
          abi: MARKET_FACTORY_ABI,
          functionName: "createPariMutuel",
          args: [
            poll.pollAddress,
            selectedToken.address,
            liquidityAmount,
            distributionHint,
            curveFlattener,
            finalOffset,
          ],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("form");
    }
  };

  // Continue to create after approval
  useEffect(() => {
    if (
      step === "create" &&
      !needsApproval &&
      !isCreatePending &&
      !createHash
    ) {
      executeCreate();
    }
  }, [step, needsApproval, isCreatePending, createHash]);

  if (isCreateSuccess) {
    return (
      <div className="card max-w-3xl mx-auto">
        <div className="flex items-center justify-center flex-col space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h2 className="text-2xl font-bold text-white">
            {marketType === "amm" ? "AMM Market" : "Pari-Mutuel"} Created!
          </h2>
          <p className="text-gray-400">
            Your market has been created successfully.
          </p>
          <a
            href={`${contractConfig.blockExplorerUrl}/tx/${createHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            View Transaction
          </a>
          <button onClick={onBack} className="btn-secondary">
            Back to My Polls
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <p className="text-gray-400 text-sm truncate max-w-md">
          {poll.question}
        </p>
      </div>

      {/* Market Type Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setMarketType("amm");
            setInitialLiquidity("1000");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
            marketType === "amm"
              ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
              : "bg-slate-700 text-gray-400 hover:bg-slate-600"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          AMM Market
        </button>
        <button
          onClick={() => {
            setMarketType("pariMutuel");
            setInitialLiquidity("10");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
            marketType === "pariMutuel"
              ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
              : "bg-slate-700 text-gray-400 hover:bg-slate-600"
          }`}
        >
          <Activity className="w-5 h-5" />
          Pari-Mutuel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Collateral Token */}
        <div>
          <label className="label">Collateral Token</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTokenDropdown(!showTokenDropdown)}
              className="input w-full flex items-center justify-between"
            >
              <span>
                {selectedToken.symbol} - {selectedToken.name}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showTokenDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
                {COLLATERAL_TOKENS.map((token) => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => {
                      setSelectedToken(token);
                      setShowTokenDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-600 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="font-medium text-white">
                      {token.symbol}
                    </span>
                    <span className="text-gray-400 ml-2">{token.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Balance: {formattedBalance} {selectedToken.symbol}
          </p>
        </div>

        {/* Initial Liquidity */}
        <div>
          <label className="label">Initial Liquidity</label>
          <div className="relative">
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => setInitialLiquidity(e.target.value)}
              min="1"
              step="0.000001"
              className="input pr-16"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {selectedToken.symbol}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Minimum: 1 {selectedToken.symbol}
          </p>
        </div>

        {/* Distribution Hint */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Initial Distribution (YES / NO)
            </label>
            {marketType === "pariMutuel" && <PriceCurveInfoModal />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`text-xs mb-1 block ${
                  isDistributionInvalid ? "text-red-400" : "text-gray-400"
                }`}
              >
                {marketType === "amm" ? (
                  <>
                    <span className="text-green-400">YES</span> in LP (
                    <span className="text-red-400">NO</span> chance)
                  </>
                ) : (
                  <>
                    <span className="text-green-400">YES</span> Weight (
                    <span className="text-green-400">YES</span> chance)
                  </>
                )}
              </label>
              <input
                type="number"
                value={yesWeight}
                onChange={(e) => setYesWeight(e.target.value)}
                min="1"
                className={`input ${
                  isDistributionInvalid
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                required
              />
            </div>
            <div>
              <label
                className={`text-xs mb-1 block ${
                  isDistributionInvalid ? "text-red-400" : "text-gray-400"
                }`}
              >
                {marketType === "amm" ? (
                  <>
                    <span className="text-red-400">NO</span> in LP (
                    <span className="text-green-400">YES</span> chance)
                  </>
                ) : (
                  <>
                    <span className="text-red-400">NO</span> Weight (
                    <span className="text-red-400">NO</span> chance)
                  </>
                )}
              </label>
              <input
                type="number"
                value={noWeight}
                onChange={(e) => setNoWeight(e.target.value)}
                min="1"
                className={`input ${
                  isDistributionInvalid
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                required
              />
            </div>
          </div>
          {isDistributionInvalid && (
            <p className="text-xs text-red-400 mt-1">
              Weights must sum to 100 (current:{" "}
              {(parseInt(yesWeight) || 0) + (parseInt(noWeight) || 0)})
            </p>
          )}
          {marketType === "pariMutuel" && (
            <p className="text-xs text-gray-400 mt-1">
              Initial YES chance:{" "}
              {(() => {
                const yes = parseInt(yesWeight) || 50;
                const no = parseInt(noWeight) || 50;
                const total = yes + no;
                const target = (yes / total) * 100;
                // Custom offset is in percent, convert to BPS (* 10000)
                const offsetBps = useCustomOffset
                  ? Math.round((parseFloat(customOffset) || 0) * 10000)
                  : curveOffset;
                const offsetNorm = offsetBps / 1_000_000;
                const initial = 50 + (target - 50) * offsetNorm;
                return initial.toFixed(1);
              })()}
              %
            </p>
          )}
        </div>

        {/* AMM Specific Fields */}
        {marketType === "amm" && (
          <>
            {/* Fee Tier */}
            <div>
              <label className="label">Trading Fee</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {MARKET_CONSTANTS.FEE_TIER_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setFeeTier(preset.value);
                      setUseCustomFeeTier(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      !useCustomFeeTier && feeTier === preset.value
                        ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustomFeeTier(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    useCustomFeeTier
                      ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  Custom
                </button>
              </div>
              {useCustomFeeTier && (
                <div className="relative">
                  <input
                    type="number"
                    value={customFeeTier}
                    onChange={(e) => setCustomFeeTier(e.target.value)}
                    placeholder="e.g., 0.3"
                    min="0.05"
                    max="1"
                    step="0.01"
                    className="input pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    %
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Fee range: 0.05% to 1%
                  </p>
                </div>
              )}
            </div>

            {/* Max Price Imbalance */}
            <div>
              <label className="label">Max Hourly Price Imbalance</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {MARKET_CONSTANTS.PRICE_IMBALANCE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setMaxPriceImbalance(preset.value);
                      setUseCustomImbalance(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      !useCustomImbalance && maxPriceImbalance === preset.value
                        ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustomImbalance(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    useCustomImbalance
                      ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  Custom
                </button>
              </div>
              {useCustomImbalance && (
                <div className="relative">
                  <input
                    type="number"
                    value={customImbalance}
                    onChange={(e) => setCustomImbalance(e.target.value)}
                    placeholder="e.g., 15"
                    min="0"
                    max="100"
                    step="0.01"
                    className="input pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    %
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Range: 0% (disabled) to 100%
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Limits how much the price can move per hour. 0 = no limit.
              </p>
            </div>
          </>
        )}

        {/* PariMutuel Specific Fields */}
        {marketType === "pariMutuel" && (
          <>
            {/* Curve Visualization */}
            <PariMutuelCurveChart
              k={curveFlattener}
              offset={
                useCustomOffset
                  ? Math.round((parseFloat(customOffset) || 0) * 10000)
                  : curveOffset
              }
              yesWeight={parseInt(yesWeight) || 50}
              noWeight={parseInt(noWeight) || 50}
            />

            {/* Curve Flattener */}
            <div>
              <label className="label">
                Curve Flattener (k): {curveFlattener}
              </label>
              <input
                type="range"
                min="1"
                max="11"
                value={curveFlattener}
                onChange={(e) => setCurveFlattener(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 (Linear)</span>
                <span>11 (Very Sharp)</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Higher k = flatter start, sharper price change at end
              </p>
            </div>

            {/* Curve Offset */}
            <div>
              <label className="label">Curve Offset (Starting Position)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {MARKET_CONSTANTS.CURVE_OFFSET_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setCurveOffset(preset.value);
                      setUseCustomOffset(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      !useCustomOffset && curveOffset === preset.value
                        ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustomOffset(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    useCustomOffset
                      ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  Custom
                </button>
              </div>
              {useCustomOffset && (
                <div className="relative">
                  <input
                    type="number"
                    value={customOffset}
                    onChange={(e) => setCustomOffset(e.target.value)}
                    placeholder="e.g., 25"
                    min="0"
                    max="99.99"
                    step="0.01"
                    className="input pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    %
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Range: 0% to 99.99%
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Higher offset = starting price closer to target distribution
              </p>
            </div>
          </>
        )}

        {/* Error Display */}
        {(error || validationError) && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error || validationError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            !!validationError ||
            isApprovePending ||
            isApproveConfirming ||
            isCreatePending ||
            isCreateConfirming ||
            !address
          }
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(isApprovePending ||
            isApproveConfirming ||
            isCreatePending ||
            isCreateConfirming) && <Loader2 className="w-5 h-5 animate-spin" />}
          <span>
            {isApprovePending
              ? "Confirm Approval..."
              : isApproveConfirming
              ? "Approving..."
              : isCreatePending
              ? "Confirm Transaction..."
              : isCreateConfirming
              ? "Creating Market..."
              : needsApproval
              ? `Approve & Create ${marketType === "amm" ? "AMM" : "Pool"}`
              : `Create ${marketType === "amm" ? "AMM Market" : "Pari-Mutuel"}`}
          </span>
        </button>
      </form>
    </div>
  );
};

export default CreateMarketForm;
