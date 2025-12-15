import { useState, useEffect, useMemo } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useBlock,
} from "wagmi";
import { formatEther } from "viem";
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  Plus,
  X,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import {
  PREDICTION_ORACLE_ABI,
  POLL_CATEGORY_LABELS,
  PollCategory,
} from "@/config/abi";
import { getContractConfig } from "@/config/contract";
import { calculateTimestamp, formatTimeDifference } from "@/utils/epochTime";
import {
  getUTF8ByteLength,
  validateQuestion,
  validateRules,
  validateSources,
  getNonASCIIWarning,
} from "@/utils/validation";
import { usePolls } from "@/hooks/usePolls";

const CreatePollForm = () => {
  const { address } = useAccount();
  const contractConfig = getContractConfig();
  const { triggerBackgroundRefresh } = usePolls();

  const [question, setQuestion] = useState("");
  const [rules, setRules] = useState("");
  const [sources, setSources] = useState<string[]>([""]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [arbiterManuallyChanged, setArbiterManuallyChanged] = useState(false);
  const [category, setCategory] = useState<PollCategory>(PollCategory.Other);
  const [error, setError] = useState("");

  // Get current block with timestamp from blockchain (auto-updates on new blocks)
  const { data: currentBlock } = useBlock({ watch: true });

  // Extract blockchain timestamp (in seconds, UTC)
  // Note: Unix timestamps are always UTC, .toLocaleString() displays them in user's timezone
  const blockchainTimestamp = currentBlock?.timestamp
    ? Number(currentBlock.timestamp)
    : Math.floor(Date.now() / 1000);

  // Calculate UTF-8 byte lengths for real-time feedback
  const questionBytes = useMemo(() => getUTF8ByteLength(question), [question]);
  const rulesBytes = useMemo(() => getUTF8ByteLength(rules), [rules]);
  const questionWarning = useMemo(
    () => getNonASCIIWarning(question.length, questionBytes),
    [question, questionBytes]
  );
  const rulesWarning = useMemo(
    () => getNonASCIIWarning(rules.length, rulesBytes),
    [rules, rulesBytes]
  );

  // Auto-fill arbiter with user's address (updates when wallet changes)
  useEffect(() => {
    // Only auto-fill if user hasn't manually changed the arbiter
    if (address && !arbiterManuallyChanged) {
      setArbiter(address);
    }
  }, [address, arbiterManuallyChanged]);

  // Handle manual arbiter change
  const handleArbiterChange = (value: string) => {
    setArbiter(value);
    // Mark as manually changed if user typed something different from their address
    if (value !== address) {
      setArbiterManuallyChanged(true);
    } else {
      setArbiterManuallyChanged(false);
    }
  };

  // Read fees from contract
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

  const totalFee =
    operatorGasFee && protocolFee ? operatorGasFee + protocolFee : 0n;

  // Initialize default date/time (current time in user's local timezone)
  useEffect(() => {
    const now = new Date();

    // Get local date in YYYY-MM-DD format (not UTC!)
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Set to current time (local timezone)
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    setSelectedDate(dateStr);
    setSelectedTime(timeStr);
  }, []);

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      triggerBackgroundRefresh();
    }
  }, [isSuccess, triggerBackgroundRefresh]);

  const addSource = () => {
    if (sources.length < 3) {
      setSources([...sources, ""]);
    }
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const updateSource = (index: number, value: string) => {
    const newSources = [...sources];
    newSources[index] = value;
    setSources(newSources);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation using UTF-8 byte lengths (matches contract limits)
    const questionValidation = validateQuestion(question);
    if (!questionValidation.isValid) {
      setError(questionValidation.error!);
      return;
    }

    const rulesValidation = validateRules(rules);
    if (!rulesValidation.isValid) {
      setError(rulesValidation.error!);
      return;
    }

    const filteredSources = sources.filter((s) => s.trim() !== "");
    const sourcesValidation = validateSources(filteredSources);
    if (!sourcesValidation.isValid) {
      setError(sourcesValidation.error!);
      return;
    }

    // Validate arbiter address
    if (!arbiter || arbiter.length !== 42 || !arbiter.startsWith("0x")) {
      setError("Invalid arbiter address");
      return;
    }

    // Calculate target timestamp
    if (!selectedDate || !selectedTime) {
      setError("Please select target date and time");
      return;
    }

    const dateTimeString = `${selectedDate}T${selectedTime}`;
    const targetDate = new Date(dateTimeString);

    if (isNaN(targetDate.getTime())) {
      setError("Invalid date/time selected");
      return;
    }

    const targetTimestamp = calculateTimestamp(targetDate);
    // Note: Date automatically converts local time to UTC timestamp, no adjustment needed!

    // Validate timestamp is at least one epoch in future (using blockchain time)
    if (targetTimestamp < blockchainTimestamp + contractConfig.epochLength) {
      setError(
        `Target time must be at least ${
          contractConfig.epochLength / 60
        } minutes in the future`
      );
      return;
    }

    console.log("Creating poll with params:", {
      question,
      rules,
      sources: filteredSources,
      targetTimestamp,
      targetDate: new Date(targetTimestamp * 1000).toLocaleString(),
      arbiter,
      category,
      totalFee: totalFee.toString(),
      operatorGasFee: operatorGasFee?.toString(),
      protocolFee: protocolFee?.toString(),
    });

    try {
      writeContract({
        address: contractConfig.address,
        abi: PREDICTION_ORACLE_ABI,
        functionName: "createPoll",
        args: [
          question,
          rules,
          filteredSources,
          BigInt(targetTimestamp),
          arbiter as `0x${string}`,
          category,
        ],
        value: totalFee,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create poll");
    }
  };

  if (isSuccess) {
    return (
      <div className="card">
        <div className="flex items-center justify-center flex-col space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h2 className="text-2xl font-bold text-white">
            Poll Created Successfully!
          </h2>
          <p className="text-gray-400">
            Your prediction poll has been created on the blockchain.
          </p>
          <a
            href={`${contractConfig.blockExplorerUrl}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            View Transaction
          </a>
          <button
            onClick={() => {
              setQuestion("");
              setRules("");
              setSources([""]);
              setSelectedDate("");
              setSelectedTime("");
              setArbiter(address || "");
              setArbiterManuallyChanged(false);
              setCategory(PollCategory.Other);
              window.location.reload();
            }}
            className="btn-secondary"
          >
            Create Another Poll
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-3xl mx-auto">

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
            <label className="label mb-0">Question</label>
            <span
              className={`text-xs sm:text-xs whitespace-nowrap ${
                questionBytes > 200
                  ? "text-red-400 font-semibold"
                  : questionBytes > 180
                  ? "text-yellow-400"
                  : "text-gray-400"
              }`}
            >
              {questionBytes}/200 bytes
              {question.length !== questionBytes && (
                <span className="ml-1 text-gray-500">
                  ({question.length} ch)
                </span>
              )}
            </span>
          </div>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will Bitcoin reach $100k by end of 2025?"
            className={`input ${questionBytes > 200 ? "border-red-500" : ""}`}
            required
          />
          {questionWarning && (
            <p className="text-xs text-yellow-400 mt-1">{questionWarning}</p>
          )}
        </div>

        {/* Rules */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
            <label className="label mb-0">Rules</label>
            <span
              className={`text-xs sm:text-xs whitespace-nowrap ${
                rulesBytes > 1000
                  ? "text-red-400 font-semibold"
                  : rulesBytes > 900
                  ? "text-yellow-400"
                  : "text-gray-400"
              }`}
            >
              {rulesBytes}/1000 bytes
              {rules.length !== rulesBytes && (
                <span className="ml-1 text-gray-500">({rules.length} ch)</span>
              )}
            </span>
          </div>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Define the criteria for resolving this prediction..."
            rows={6}
            className={`input resize-none ${
              rulesBytes > 1000 ? "border-red-500" : ""
            }`}
            required
          />
          {rulesWarning && (
            <p className="text-xs text-yellow-400 mt-1">{rulesWarning}</p>
          )}
        </div>

        {/* Sources */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Sources (Optional, max 3)</label>
            {sources.length < 3 && (
              <button
                type="button"
                onClick={addSource}
                className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Source</span>
              </button>
            )}
          </div>
          <div className="space-y-2">
            {sources.map((source, index) => {
              const sourceBytes = getUTF8ByteLength(source);
              const isOverLimit = sourceBytes > 200;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => updateSource(index, e.target.value)}
                      placeholder="https://example.com/data-source"
                      className={`input flex-1 min-w-0 ${
                        isOverLimit ? "border-red-500" : ""
                      }`}
                    />
                    {sources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSource(index)}
                        className="px-2 sm:px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
                        aria-label="Remove source"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                  {source && (
                    <p
                      className={`text-xs ${
                        isOverLimit
                          ? "text-red-400 font-semibold"
                          : sourceBytes > 180
                          ? "text-yellow-400"
                          : "text-gray-400"
                      }`}
                    >
                      {sourceBytes}/200 bytes
                      {source.length !== sourceBytes && (
                        <span className="ml-1 text-gray-500">
                          ({source.length} ch)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="label">Category</label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(Number(e.target.value) as PollCategory)
            }
            className="input"
            required
          >
            {Object.entries(POLL_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Arbiter Address */}
        <div>
          <label className="label">Arbiter Address</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={arbiter}
              onChange={(e) => handleArbiterChange(e.target.value)}
              placeholder="0x..."
              className="input pl-10"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            The arbiter can override the poll result if needed. Default: your
            address.
            {arbiterManuallyChanged && (
              <span className="text-yellow-400 ml-1">(Custom arbiter)</span>
            )}
          </p>
        </div>

        {/* Target Date and Time */}
        <div>
          <label className="label mb-2">When to verify prediction?</label>

          {/* Quick select buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: "1 day", days: 1 },
              { label: "3 days", days: 3 },
              { label: "1 week", days: 7 },
              { label: "1 month", days: 30 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const future = new Date();
                  future.setDate(future.getDate() + preset.days);

                  // Get local date in YYYY-MM-DD format (not UTC!)
                  const year = future.getFullYear();
                  const month = (future.getMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                  const day = future.getDate().toString().padStart(2, "0");
                  setSelectedDate(`${year}-${month}-${day}`);
                  setSelectedTime("12:00");
                }}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs rounded transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date and Time pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Calculated time info */}
          {Boolean(selectedDate && selectedTime && blockchainTimestamp) &&
            (() => {
              const targetDate = new Date(`${selectedDate}T${selectedTime}`);

              // Validate targetDate is valid
              if (isNaN(targetDate.getTime())) {
                return null;
              }

              // User selects time in local timezone, Date.getTime() automatically converts to UTC timestamp
              const targetTimestamp = Math.floor(targetDate.getTime() / 1000);

              const minTimestamp =
                blockchainTimestamp + contractConfig.epochLength;
              const timeDiff = targetTimestamp - blockchainTimestamp;
              const isValid = targetTimestamp >= minTimestamp;

              return (
                <div
                  className={`rounded-lg p-3 text-sm space-y-2 mt-3 ${
                    isValid
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      Current Time:
                    </span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs">
                      {new Date(blockchainTimestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      Selected Time:
                    </span>
                    <span
                      className={`font-mono text-xs ${
                        isValid
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {targetDate.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      Time Until Check:
                    </span>
                    <span
                      className={`font-semibold ${
                        isValid
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {formatTimeDifference(targetDate)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
                    <p
                      className={`text-xs ${
                        isValid
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {isValid
                        ? `✓ Valid: ${Math.floor(
                            timeDiff / 60
                          )} minutes until check`
                        : `✗ Too soon: must be at least ${
                            contractConfig.epochLength / 60
                          } minutes in the future`}
                    </p>
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Fee Display */}
        {totalFee > 0n && (
          <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Total Fee:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {formatEther(totalFee)} S
              </span>
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || isConfirming || !address}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {(isPending || isConfirming) && (
            <Loader2 className="w-5 h-5 animate-spin" />
          )}
          <span>
            {isPending
              ? "Confirm in Wallet..."
              : isConfirming
              ? "Creating Poll..."
              : "Create Poll"}
          </span>
        </button>
      </form>
    </div>
  );
};

export default CreatePollForm;
