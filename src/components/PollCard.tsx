import { useState, useEffect } from "react";
import {
  ExternalLink,
  Calendar,
  User,
  Gavel,
  Clock,
  ScrollText,
} from "lucide-react";
import { useAccount } from "wagmi";
import { PollInfo } from "@/types";
import {
  POLL_STATUS_LABELS,
  POLL_STATUS_COLORS,
  PollStatus,
} from "@/config/abi";

{
  /* import {
 POLL_CATEGORY_LABELS,
  POLL_CATEGORY_COLORS,
  PollCategory,
} from "@/config/abi";
 */
}
import { getContractConfig } from "@/config/contract";
import {
  epochToDate,
  formatTimeDifference,
  formatDateTime,
} from "@/utils/epochTime";
import RefreshPollButton from "./RefreshPollButton";
import Celebration from "./Celebration";
import { PollChat } from "./PollChat";
import {
  CreateMarketPanel,
  AmmMarketBadge,
  PariMarketBadge,
  AmmVolume,
  PariVolume,
} from "./MarketPanel";
import { useMarkets } from "@/hooks/useMarkets";

interface PollCardProps {
  poll: PollInfo;
  onMarketClick?: (
    marketAddress: `0x${string}`,
    marketType: "amm" | "pariMutuel",
    pollAddress: `0x${string}`
  ) => void;
  onCreateMarket?: (poll: PollInfo, marketType: "amm" | "pariMutuel") => void;
  isOwner?: boolean;
  compact?: boolean;
}

const PollCard = ({
  poll,
  onMarketClick,
  onCreateMarket,
  isOwner = false,
  compact = false,
}: PollCardProps) => {
  const contractConfig = getContractConfig();
  const { address } = useAccount();
  const { marketsMap } = useMarkets();
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<PollStatus>(poll.status);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBackSide, setShowBackSide] = useState(false);

  // Get market data for this poll
  const pollMarkets = marketsMap.get(poll.pollAddress.toLowerCase());

  // Handle market panel click
  const handleMarketClick = (
    marketAddress: `0x${string}`,
    marketType: "amm" | "pariMutuel"
  ) => {
    if (onMarketClick) {
      onMarketClick(marketAddress, marketType, poll.pollAddress);
    }
  };

  // Check if poll is resolved
  const isResolved =
    poll.status === PollStatus.Yes ||
    poll.status === PollStatus.No ||
    poll.status === PollStatus.Unknown;

  // Calculate dates from epochs
  const checkDate = epochToDate(poll.checkEpoch);
  const finalizationDate = epochToDate(poll.finalizationEpoch);

  // Detect status change to resolved
  useEffect(() => {
    if (previousStatus !== poll.status) {
      // Status changed
      if (poll.status === PollStatus.Yes || poll.status === PollStatus.No) {
        // Changed to resolved - show celebration!
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
      setPreviousStatus(poll.status);
    }
  }, [poll.status, previousStatus]);

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Ensure URL has protocol
  const ensureHttpProtocol = (url: string): string => {
    if (!url) return url;
    // Check if URL already has a protocol
    if (url.match(/^https?:\/\//i)) {
      return url;
    }
    // Add https:// if missing
    return `https://${url}`;
  };

  const isTextLong = poll.rules.length > 150; // Check if text is long enough to truncate

  // Format resolution reason: capitalize words followed by colon start on new line and are bold
  const formatResolutionReason = (text: string): React.ReactNode => {
    if (!text) return "No reason provided";

    // Pattern to match words/phrases starting with capital letter followed by colon
    // Matches: "Vote Statistics:", "Key Reasoning:", "Game Not Completed:", "UNKNOWN:", "(OpenAI):", "(Gemini, Perplexity):", etc.
    // Handles both words in parentheses (with commas) and words without parentheses
    const regex = /(\([A-Z][A-Za-z0-9\s,]*?\)|[A-Z][A-Za-z0-9\s]*?):/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let matchIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index).trim();
        if (beforeText) {
          parts.push(<span key={`text-${matchIndex}`}>{beforeText}</span>);
        }
      }

      // Add line break before the matched word if there's text before it or it's not the first match
      if (match.index > 0 || matchIndex > 0) {
        parts.push(<br key={`br-${matchIndex}`} />);
      }

      // Add the matched word with colon as bold
      parts.push(
        <strong key={`bold-${matchIndex}`} className="font-bold">
          {match[0]}
        </strong>
      );

      lastIndex = match.index + match[0].length;
      matchIndex++;
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex).trim();
      if (remainingText) {
        if (matchIndex > 0) {
          parts.push(<span key="text-final"> {remainingText}</span>);
        } else {
          parts.push(<span key="text-final">{remainingText}</span>);
        }
      }
    }

    // If no matches found, return the original text
    if (parts.length === 0) {
      return text;
    }

    return <>{parts}</>;
  };

  // Check if poll is pending
  const isPending = poll.status === PollStatus.Pending;

  // Handle flip for resolved cards and expand for pending cards in compact mode
  const handleCardClick = (e: React.MouseEvent) => {
    if (isResolved || (compact && isPending)) {
      e.stopPropagation();
      setShowBackSide((prev) => !prev);
    }
  };

  const handleMouseLeave = () => {
    if (isResolved || (compact && isPending)) {
      setShowBackSide(false);
    }
  };

  {
    /*const categoryLabel =
    POLL_CATEGORY_LABELS[poll.category as PollCategory] || "Unknown";
  const categoryColor =
    POLL_CATEGORY_COLORS[poll.category as PollCategory] ||
    POLL_CATEGORY_COLORS[PollCategory.Other];*/
  }

  // Compact view - Modern List Design
  if (compact) {
    const CompactContent = () => (
      <>
        <div className="flex justify-between items-start gap-3 mb-2">
          {/* Title Area */}
          <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug line-clamp-2 flex-1">
            {poll.question}
          </h3>

          {/* Status + Markets column */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                POLL_STATUS_COLORS[poll.status]
              }`}
            >
              {POLL_STATUS_LABELS[poll.status]}
            </span>
            {/* Markets badges */}
            <div className="flex items-center gap-1.5">
              <AmmMarketBadge
                markets={pollMarkets}
                onMarketClick={handleMarketClick}
              />
              <PariMarketBadge
                markets={pollMarkets}
                onMarketClick={handleMarketClick}
              />
            </div>
          </div>
        </div>

        {/* Meta Info Row */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-dashed border-gray-200 dark:border-slate-700/50">
          {/* Left: Time info + Refresh button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatTimeDifference(checkDate)}</span>
            </div>
            <RefreshPollButton
              pollAddress={poll.pollAddress}
              currentStatus={poll.status}
              checkEpoch={poll.checkEpoch}
              finalizationEpoch={poll.finalizationEpoch}
              compact={true}
            />
          </div>

          {/* Right: Chat */}
          <PollChat pollAddress={poll.pollAddress} />
        </div>
      </>
    );

    // Check if card should be expandable (resolved or pending)
    const isExpandable = isResolved || isPending;

    return (
      <div className="relative h-full" onMouseLeave={handleMouseLeave}>
        {/* Placeholder to maintain layout when card is absolute (popped out) */}
        <div
          className={`p-3 flex flex-col h-full opacity-0 pointer-events-none ${
            showBackSide && isExpandable ? "block" : "hidden"
          }`}
          aria-hidden="true"
        >
          <CompactContent />
        </div>

        <div
          className={`card transition-all duration-200 group p-3 flex flex-col ${
            showBackSide && isExpandable
              ? "absolute inset-x-0 top-0 z-20 min-h-full h-auto max-h-[90vh] overflow-y-auto scale-105 shadow-xl border-primary-500 bg-white dark:bg-slate-800"
              : "relative h-full hover:border-primary-500 hover:shadow-md hover:shadow-primary-500/5"
          } ${isExpandable ? "cursor-pointer" : ""}`}
          onClick={handleCardClick}
        >
          {showBackSide && isResolved ? (
            // Expanded view for RESOLVED polls - show resolution reason
            <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 min-h-0">
              {/* Header - Question + Status */}
              <div className="flex justify-between items-start gap-3 border-b border-gray-100 dark:border-slate-700 pb-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                  {poll.question}
                </h3>
                <span
                  className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    POLL_STATUS_COLORS[poll.status]
                  }`}
                >
                  {POLL_STATUS_LABELS[poll.status]}
                </span>
              </div>

              {/* Resolution Reason */}
              <div className="text-xs">
                <div className="text-gray-500 dark:text-gray-400 font-semibold mb-1">
                  Resolution Reason:
                </div>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {formatResolutionReason(
                    poll.resolutionReason || "No reason provided"
                  )}
                </div>
              </div>
            </div>
          ) : showBackSide && isPending ? (
            // Expanded view for PENDING polls - show rules, sources, creator, arbiter, etc.
            <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200 min-h-0">
              {/* Header - Question + Status */}
              <div className="flex justify-between items-start gap-3 border-b border-gray-100 dark:border-slate-700 pb-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                  {poll.question}
                </h3>
                <span
                  className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    POLL_STATUS_COLORS[poll.status]
                  }`}
                >
                  {POLL_STATUS_LABELS[poll.status]}
                </span>
              </div>

              {/* Rules */}
              <div className="text-xs">
                <div className="text-gray-500 dark:text-gray-400 font-semibold mb-1">
                  Rules:
                </div>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {poll.rules}
                </div>
              </div>

              {/* Sources */}
              {poll.sources.length > 0 && (
                <div className="text-xs">
                  <div className="text-gray-500 dark:text-gray-400 font-semibold mb-1">
                    Sources:
                  </div>
                  <div className="space-y-0.5">
                    {poll.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={ensureHttpProtocol(source)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{source}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Creator & Arbiter */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <User className="w-3 h-3" />
                  <span className="font-mono">
                    {shortenAddress(poll.creator)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Gavel className="w-3 h-3" />
                  <span className="font-mono">
                    {shortenAddress(poll.arbiter)}
                  </span>
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatTimeDifference(checkDate)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTime(finalizationDate)}</span>
                </div>
              </div>

              {/* Poll Contract */}
              <div className="flex items-center justify-between text-xs bg-gray-100 dark:bg-slate-700/50 rounded px-2 py-1.5">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <ScrollText className="w-3 h-3" />
                  Poll:
                </span>
                <a
                  href={`${contractConfig.blockExplorerUrl}/address/${poll.pollAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-mono flex items-center gap-1"
                >
                  <span>{shortenAddress(poll.pollAddress)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Markets */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <AmmMarketBadge
                  markets={pollMarkets}
                  onMarketClick={handleMarketClick}
                />
                <PariMarketBadge
                  markets={pollMarkets}
                  onMarketClick={handleMarketClick}
                />
              </div>
            </div>
          ) : (
            <CompactContent />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card hover:border-primary-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary-500/20 group relative overflow-hidden flex flex-col ${
        isResolved ? "cursor-pointer" : ""
      }`}
      onClick={handleCardClick}
      onMouseLeave={handleMouseLeave}
    >
      {/* Celebration effect for resolved polls */}
      {showCelebration && (
        <Celebration type={poll.status === PollStatus.Yes ? "yes" : "no"} />
      )}

      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {poll.question}
        </h3>
        <div className="flex flex-col gap-2 items-end">
          <span
            className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold ${
              POLL_STATUS_COLORS[poll.status]
            } transform translate-x-2.5 transition-transform group-hover:scale-110`}
          >
            {POLL_STATUS_LABELS[poll.status]}
          </span>
          {/* <span
            className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold ${categoryColor} transition-transform group-hover:scale-110`}
          >
            {categoryLabel}
          </span> */}
        </div>
      </div>

      {/* Flippable content area */}
      <div
        className="transition-all duration-700"
        style={{
          transform:
            showBackSide && isResolved ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            transform:
              showBackSide && isResolved ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.7s",
          }}
        >
          {showBackSide && isResolved ? (
            // BACK - Resolution Reason
            <div className="mb-4 flex-grow">
              <p className="text-xs text-gray-600 dark:text-gray-500 mb-2 font-semibold">
                Resolution Reason:
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-xs md:text-sm whitespace-pre-wrap">
                {formatResolutionReason(
                  poll.resolutionReason || "No reason provided"
                )}
              </p>
            </div>
          ) : (
            // FRONT - Rules and Sources
            <>
              <div className="mb-4">
                <p
                  className={`text-gray-700 dark:text-gray-300 text-xs md:text-sm ${
                    !isExpanded && isTextLong ? "line-clamp-3" : ""
                  }`}
                >
                  {poll.rules}
                </p>
                {isTextLong && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-[10px] md:text-xs mt-2 font-medium transition-colors"
                  >
                    {isExpanded ? "↑ Show less" : "↓ Read more"}
                  </button>
                )}
              </div>

              {poll.sources.length > 0 && (
                <div className="mb-4 flex-grow">
                  <p className="text-xs text-gray-600 dark:text-gray-500 mb-2 font-semibold">
                    Sources:
                  </p>
                  <div className="space-y-1">
                    {poll.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={ensureHttpProtocol(source)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary-600 hover:text-primary-700 text-xs inline-flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span>{source}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Market Buttons - only for owner's PENDING polls */}
      {/* Positioned between Sources and footer (Creator, Arbiter, etc.) */}
      {isOwner &&
        poll.status === PollStatus.Pending &&
        address?.toLowerCase() === poll.creator.toLowerCase() &&
        onCreateMarket && (
          <CreateMarketPanel
            markets={pollMarkets}
            onCreateMarket={(marketType) => onCreateMarket(poll, marketType)}
          />
        )}

      {/* Spacer to push footer to bottom */}
      <div className="flex-grow"></div>

      <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-slate-700 mt-auto">
        {/* Creator + AMM Market Badge */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span className="text-xs">Creator:</span>
            <span className="font-mono text-xs">
              {shortenAddress(poll.creator)}
            </span>
          </div>
          <AmmMarketBadge
            markets={pollMarkets}
            onMarketClick={handleMarketClick}
          />
        </div>

        {/* Arbiter + AMM Volume */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Gavel className="w-4 h-4" />
            <span className="text-xs">Arbiter:</span>
            <span className="font-mono text-xs">
              {shortenAddress(poll.arbiter)}
            </span>
          </div>
          <AmmVolume markets={pollMarkets} />
        </div>

        {/* Check time + Pari Market Badge */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Check time:</span>
            <span className="text-xs font-medium">
              {formatTimeDifference(checkDate)}
            </span>
          </div>
          <PariMarketBadge
            markets={pollMarkets}
            onMarketClick={handleMarketClick}
          />
        </div>

        {/* Finalization + Pari Volume */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Final:</span>
            <span className="text-xs font-medium">
              {formatDateTime(finalizationDate)}
            </span>
          </div>
          <PariVolume markets={pollMarkets} />
        </div>

        {/* Poll contract address + Chat icon */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <ScrollText className="w-4 h-4" />
            <span className="text-xs">Poll:</span>
            <a
              href={`${contractConfig.blockExplorerUrl}/address/${poll.pollAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-mono text-xs transition-colors flex items-center space-x-1"
            >
              <span>{shortenAddress(poll.pollAddress)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {/* Chat icon */}
          <PollChat pollAddress={poll.pollAddress} />
        </div>
      </div>

      {/* Refresh Poll Button (if applicable) */}
      <RefreshPollButton
        pollAddress={poll.pollAddress}
        currentStatus={poll.status}
        checkEpoch={poll.checkEpoch}
        finalizationEpoch={poll.finalizationEpoch}
      />
    </div>
  );
};

export default PollCard;
