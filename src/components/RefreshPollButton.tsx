import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { formatEther } from "viem";
import { PREDICTION_ORACLE_ABI, PollStatus } from "@/config/abi";
import { getContractConfig } from "@/config/contract";
import { usePolls } from "@/hooks/usePolls";

interface RefreshPollButtonProps {
  pollAddress: `0x${string}`;
  currentStatus: PollStatus;
  checkEpoch: number;
  finalizationEpoch: number;
  compact?: boolean;
}

const RefreshPollButton = ({
  pollAddress,
  currentStatus,
  checkEpoch,
  finalizationEpoch,
  compact = false,
}: RefreshPollButtonProps) => {
  const { address } = useAccount();
  const contractConfig = getContractConfig();
  const { triggerBackgroundRefresh } = usePolls();

  const [showModal, setShowModal] = useState(false);

  // Read fees (do not need live updates)
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

  // Read current epoch from contract to avoid local time desync
  const { data: onchainCurrentEpoch } = useReadContract({
    address: contractConfig.address,
    abi: PREDICTION_ORACLE_ABI,
    functionName: "getCurrentEpoch",
  });

  const hasFees = operatorGasFee !== undefined && protocolFee !== undefined;
  const totalFee =
    hasFees && operatorGasFee && protocolFee
      ? (operatorGasFee as bigint) + (protocolFee as bigint)
      : 0n;

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      triggerBackgroundRefresh();
    }
  }, [isSuccess, triggerBackgroundRefresh]);

  // Require timing data from chain before enabling refresh logic
  const hasTimingData =
    onchainCurrentEpoch !== undefined && onchainCurrentEpoch !== null;

  if (!hasTimingData) {
    return null;
  }

  const currentEpoch = Number(onchainCurrentEpoch);
  const timeoutEpochs = contractConfig.pendingTimeoutEpochs;

  // Check if timeout passed for this poll based on current check epoch
  const timeoutPassed = currentEpoch > checkEpoch + timeoutEpochs;

  const isUnknown = currentStatus === PollStatus.Unknown;
  const isPendingStatus = currentStatus === PollStatus.Pending;

  // Poll is finalized when current epoch is at or after finalizationEpoch
  const isFinalizedNow = currentEpoch >= finalizationEpoch;

  // Calculate time remaining until finalization (in seconds)
  const epochLength = contractConfig.epochLength; // seconds per epoch
  const epochsUntilFinalization = finalizationEpoch - currentEpoch;
  const secondsUntilFinalization = epochsUntilFinalization * epochLength;
  const minutesUntilFinalization = Math.floor(secondsUntilFinalization / 60);

  // Warning threshold: less than 20 minutes until finalization
  const showFinalizationWarning =
    !isFinalizedNow && minutesUntilFinalization < 20;

  // Free refresh: Pending + timeout passed + not finalized
  const canUseFree = isPendingStatus && timeoutPassed && !isFinalizedNow;

  // Paid refresh: Unknown + timeout passed + not finalized + fees loaded
  const canUsePaid = isUnknown && timeoutPassed && !isFinalizedNow && hasFees;

  const canRefresh = canUseFree || canUsePaid;

  // If contract would reject refresh, do not show button
  if (!canRefresh) {
    return null;
  }

  const mustPayFee = canUsePaid;

  const handleRefresh = () => {
    if (canUseFree) {
      writeContract({
        address: contractConfig.address,
        abi: PREDICTION_ORACLE_ABI,
        functionName: "refreshPollFree",
        args: [pollAddress],
      });
    } else {
      writeContract({
        address: contractConfig.address,
        abi: PREDICTION_ORACLE_ABI,
        functionName: "refreshPollPaid",
        args: [pollAddress],
        value: totalFee,
      });
    }
  };

  // If wallet is not connected, show info instead of active button
  if (!address) {
    return compact ? null : (
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Connect your wallet to refresh this poll.
      </div>
    );
  }

  if (isSuccess) {
    return compact ? (
      <span className="text-[10px] text-green-400 font-medium">✓</span>
    ) : (
      <div className="bg-green-900/20 border border-green-500 rounded-lg p-3 text-sm mt-4">
        <p className="text-green-400">✅ Poll refreshed successfully!</p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={
          compact
            ? "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] backdrop-blur-xl border border-slate-300 dark:border-white/[0.08] shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:border-primary-500/30 dark:hover:border-primary-500/20 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] dark:active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all text-xs whitespace-nowrap"
            : "mt-4 w-full flex items-center justify-center space-x-2 py-3 rounded-full bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] hover:bg-slate-300/95 dark:hover:bg-[rgba(20,30,50,0.9)] backdrop-blur-xl border border-slate-300 dark:border-white/[0.08] shadow-[0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:border-primary-500/30 dark:hover:border-primary-500/20 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] dark:active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all font-bold text-slate-700 dark:text-white"
        }
      >
        <RefreshCw
          className={
            compact
              ? "w-2 h-2 text-slate-700 dark:text-white"
              : "w-3 h-3 text-slate-700 dark:text-white"
          }
        />
        <span
          className={
            compact
              ? "text-[10px] text-slate-700 dark:text-white font-bold"
              : "text-slate-700 dark:text-white font-bold"
          }
        >
          {compact ? (
            <>
              <span className="hidden md:inline">Refresh </span>
              {formatEther(totalFee)} S
            </>
          ) : canUseFree ? (
            "Refresh (Free)"
          ) : mustPayFee ? (
            `Refresh (${formatEther(totalFee)} S)`
          ) : (
            "Refresh"
          )}
        </span>
      </button>

      {/* Modal - use portal to render at body level */}
      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={() => setShowModal(false)}
            style={{ margin: 0 }}
          >
            <div
              className="card max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Refresh Poll
              </h3>

              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                {canUseFree
                  ? "This poll has been pending for a while and can be refreshed for free. The oracle will check it again in the next epoch."
                  : "This poll has status Unknown. Refreshing will schedule it for another check by oracle operators (paid refresh required)."}
              </p>

              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Current Status:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {PollStatus[currentStatus]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Refresh Type:
                  </span>
                  {canUseFree ? (
                    <span className="text-green-400 font-semibold">Free</span>
                  ) : (
                    <span className="text-yellow-400 font-semibold">
                      Paid ({formatEther(totalFee)} S)
                    </span>
                  )}
                </div>
                {isUnknown && canUsePaid && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    ℹ️ Poll status is Unknown - paid refresh required
                  </p>
                )}
                {canUseFree && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    ℹ️ Timeout passed ({timeoutEpochs} epochs) - free refresh
                    available
                  </p>
                )}
              </div>

              {/* Warning when less than 20 minutes until finalization (paid refresh only) */}
              {showFinalizationWarning && mustPayFee && (
                <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600 rounded-lg p-3 text-sm mt-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        ⚠️ Low time until finalization
                      </p>
                      <p className="text-amber-700 dark:text-amber-400 text-xs">
                        Only <strong>{minutesUntilFinalization} minutes</strong>{" "}
                        remaining until finalization. The refresh request will
                        be processed by the operator, but there is a high
                        probability that the result will not be delivered to the
                        contract before finalization occurs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                  disabled={isPending || isConfirming}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isPending || isConfirming}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {(isPending || isConfirming) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>
                    {isPending
                      ? "Confirm..."
                      : isConfirming
                      ? "Refreshing..."
                      : "Refresh"}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default RefreshPollButton;
