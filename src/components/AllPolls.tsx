import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Tag,
  LayoutList,
  Grid2X2,
  Grid3X3,
  X,
} from "lucide-react";
import { PollStatus, POLL_CATEGORY_LABELS } from "@/config/abi";
import { PollInfo } from "@/types";
import PollCard from "./PollCard";
import ActivityTicker from "./ActivityTicker";
import { usePolls } from "@/hooks/usePolls";
import { useMarkets } from "@/hooks/useMarkets";
import { usePublicClient } from "wagmi";
import { getContractConfig } from "@/config/contract";
import { getCurrentEpoch } from "@/utils/epochTime";

const ARBITRATION_FILTER = -1;

const PREDICTION_POLL_ABI = [
  {
    type: "function",
    name: "arbitrationStarted",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface AllPollsProps {
  onMarketClick?: (
    marketAddress: `0x${string}`,
    marketType: "amm" | "pariMutuel",
    pollAddress: `0x${string}`,
    sourceTab: "allPolls" | "myPolls" | "portfolio",
    sourcePage: number,
    sourceFilter: number,
    sourceCategories: number[]
  ) => void;
}

const AllPolls = ({ onMarketClick }: AllPollsProps) => {
  const { allPolls, isLoading, loadProgress } = usePolls();
  const { loadMarketsForPolls, refreshMarketsForPolls } = useMarkets();
  const publicClient = usePublicClient();
  const contractConfig = getContractConfig();
  const [filteredPolls, setFilteredPolls] = useState<PollInfo[]>([]);
  const [statusFilter, setStatusFilter] = useState<number>(() => {
    // Restore filter from sessionStorage if returning from market
    const savedFilter = sessionStorage.getItem("returnToFilter");
    if (savedFilter) {
      return parseInt(savedFilter, 10);
    }
    return 0; // 0 = all
  });
  const [categoryFilters, setCategoryFilters] = useState<Set<number>>(() => {
    // Restore categories from sessionStorage if returning from market
    const savedCategories = sessionStorage.getItem("returnToCategories");
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories) as number[];
        return new Set(parsed);
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  const [searchQuery, setSearchQuery] = useState("");
  // Track if we restored from navigation (to skip filter reset)
  const wasRestoredFromNav = useRef(false);
  const [currentPage, setCurrentPage] = useState(() => {
    // Restore page from sessionStorage if returning from market
    // Don't remove from storage here - do it in useEffect (handles Strict Mode)
    const savedPage = sessionStorage.getItem("returnToPage");
    if (savedPage) {
      wasRestoredFromNav.current = true;
      return parseInt(savedPage, 10) || 1;
    }
    return 1;
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  // View mode: 0 = full, 1 = 2 columns, 2 = 3 columns
  const [viewMode, setViewMode] = useState<0 | 1 | 2>(() => {
    const saved = sessionStorage.getItem("returnToViewMode");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed === 1 || parsed === 2) return parsed as 1 | 2;
    }
    return 0;
  });
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);

  // Cycle through view modes: 0 -> 1 -> 2 -> 0 (desktop)
  const cycleViewMode = () => {
    setViewMode((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
  };

  // Toggle between 0 and 1 only (mobile - 2 modes)
  const toggleMobileView = () => {
    setViewMode((prev) => (prev === 0 ? 1 : 0));
  };

  // View mode helpers
  const isCompactView = viewMode > 0;
  const columnCount = viewMode === 0 ? 1 : viewMode === 1 ? 2 : 3;

  // Count active filters for badge
  const activeFiltersCount =
    (statusFilter !== 0 ? 1 : 0) + (categoryFilters.size > 0 ? 1 : 0);

  // Clear sessionStorage after component is fully mounted (handles Strict Mode double-mount)
  useEffect(() => {
    const savedPage = sessionStorage.getItem("returnToPage");
    if (savedPage) {
      sessionStorage.removeItem("returnToPage");
    }
    const savedFilter = sessionStorage.getItem("returnToFilter");
    if (savedFilter) {
      sessionStorage.removeItem("returnToFilter");
    }
    const savedCategories = sessionStorage.getItem("returnToCategories");
    if (savedCategories) {
      sessionStorage.removeItem("returnToCategories");
    }
    const savedViewMode = sessionStorage.getItem("returnToViewMode");
    if (savedViewMode) {
      sessionStorage.removeItem("returnToViewMode");
    }

    // Refresh market data for poll we just visited (to show updated prices)
    const pollToRefresh = sessionStorage.getItem("refreshPollMarket");
    if (pollToRefresh) {
      sessionStorage.removeItem("refreshPollMarket");
      refreshMarketsForPolls([pollToRefresh as `0x${string}`]);
    }
  }, [refreshMarketsForPolls]);

  const isFirstMount = useRef(true);
  const [arbitrationMap, setArbitrationMap] = useState<Record<string, boolean>>(
    {}
  );

  const itemsPerPage = 12;

  // Load market states for all polls when polls are loaded
  useEffect(() => {
    if (allPolls.length > 0) {
      const pollAddresses = allPolls.map((poll) => poll.pollAddress);
      loadMarketsForPolls(pollAddresses);
    }
  }, [allPolls, loadMarketsForPolls]);

  // Load arbitrationStarted flags for eligible polls when Arbitration filter is active
  // Uses multicall to batch requests (N+1 -> 1 request optimization)
  useEffect(() => {
    if (statusFilter !== ARBITRATION_FILTER) return;
    if (!publicClient) return;

    const windowEpochs = contractConfig.arbitrationSubmissionWindowEpochs;

    const candidates = allPolls.filter(
      (poll) => poll.finalizationEpoch > poll.deadlineEpoch + windowEpochs
    );

    const missing = candidates.filter(
      (poll) => arbitrationMap[poll.pollAddress] === undefined
    );

    if (missing.length === 0) return;

    const loadFlags = async () => {
      // Batch all calls using multicall
      const BATCH_SIZE = 200;
      const newFlags: Record<string, boolean> = {};

      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const batch = missing.slice(i, i + BATCH_SIZE);

        try {
          const results = await publicClient.multicall({
            contracts: batch.map((poll) => ({
              address: poll.pollAddress,
              abi: PREDICTION_POLL_ABI,
              functionName: "arbitrationStarted",
            })),
            allowFailure: true,
          });

          results.forEach((result, idx) => {
            const pollAddress = batch[idx].pollAddress;
            newFlags[pollAddress] =
              result.status === "success" ? (result.result as boolean) : false;
          });
        } catch {
          // If multicall fails, mark all as false
          batch.forEach((poll) => {
            newFlags[poll.pollAddress] = false;
          });
        }
      }

      // Single state update with all results
      setArbitrationMap((prev) => ({ ...prev, ...newFlags }));
    };

    loadFlags();
  }, [statusFilter, allPolls, arbitrationMap, publicClient, contractConfig]);

  // Filter and search polls
  useEffect(() => {
    let filtered = [...allPolls];

    // Apply status filter
    if (statusFilter === ARBITRATION_FILTER) {
      filtered = filtered.filter((poll) => arbitrationMap[poll.pollAddress]);
    } else if (statusFilter !== 0) {
      filtered = filtered.filter((poll) => {
        return (statusFilter & (1 << poll.status)) !== 0;
      });
    }

    // Apply category filter
    if (categoryFilters.size > 0) {
      filtered = filtered.filter((poll) => categoryFilters.has(poll.category));
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (poll) =>
          poll.question.toLowerCase().includes(query) ||
          poll.rules.toLowerCase().includes(query) ||
          poll.pollAddress.toLowerCase().includes(query) ||
          poll.creator.toLowerCase().includes(query)
      );
    }

    // Sort order depends on filter type
    const currentEpoch = getCurrentEpoch();

    // Arbitration filter: sort by finalizationEpoch ASC (nearest arbitration end first)
    if (statusFilter === ARBITRATION_FILTER) {
      filtered.sort((a, b) => a.finalizationEpoch - b.finalizationEpoch);
    } else {
      // Default sort order:
      // 1. Pending polls by deadlineEpoch ASC (closest deadline first)
      // 2. Resolved polls awaiting finalization by finalizationEpoch ASC (nearest first)
      // 3. Already finalized polls by finalizationEpoch DESC (recent first, old last)
      filtered.sort((a, b) => {
        const aIsPending = a.status === PollStatus.Pending;
        const bIsPending = b.status === PollStatus.Pending;
        const aIsFinalized = !aIsPending && a.finalizationEpoch <= currentEpoch;
        const bIsFinalized = !bIsPending && b.finalizationEpoch <= currentEpoch;
        const aAwaitingFinalization =
          !aIsPending && a.finalizationEpoch > currentEpoch;
        const bAwaitingFinalization =
          !bIsPending && b.finalizationEpoch > currentEpoch;

        // Pending polls first
        if (aIsPending && !bIsPending) return -1;
        if (!aIsPending && bIsPending) return 1;
        if (aIsPending && bIsPending) {
          return a.deadlineEpoch - b.deadlineEpoch;
        }

        // Awaiting finalization before already finalized
        if (aAwaitingFinalization && bIsFinalized) return -1;
        if (aIsFinalized && bAwaitingFinalization) return 1;

        // Both awaiting finalization: ASC (nearest first)
        if (aAwaitingFinalization && bAwaitingFinalization) {
          return a.finalizationEpoch - b.finalizationEpoch;
        }

        // Both already finalized: DESC (recent first, old last)
        return b.finalizationEpoch - a.finalizationEpoch;
      });
    }

    setFilteredPolls(filtered);
  }, [allPolls, searchQuery, statusFilter, categoryFilters, arbitrationMap]);

  // Reset to page 1 only when filters or search change (skip if page was restored from navigation)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Also skip if we just restored a page from navigation
    if (wasRestoredFromNav.current) {
      wasRestoredFromNav.current = false; // Clear for future filter changes
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilters]);

  // Toggle category filter
  const toggleCategoryFilter = (category: number) => {
    const newFilters = new Set(categoryFilters);
    if (newFilters.has(category)) {
      newFilters.delete(category);
    } else {
      newFilters.add(category);
    }
    setCategoryFilters(newFilters);
  };

  // Clear all category filters
  const clearCategoryFilters = () => {
    setCategoryFilters(new Set());
  };

  // Check if we're on desktop (will be used for dual-column compact view)
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 640);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Pagination - show multiple pages on desktop compact mode
  const showMultiColumns = isCompactView && isDesktop;
  const totalPages = Math.ceil(filteredPolls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = showMultiColumns
    ? startIndex + itemsPerPage * columnCount
    : startIndex + itemsPerPage;
  const paginatedPolls = filteredPolls.slice(startIndex, endIndex);

  // Split polls into columns for desktop compact view
  const columnPolls: PollInfo[][] = [];
  if (showMultiColumns) {
    for (let i = 0; i < columnCount; i++) {
      columnPolls.push(
        paginatedPolls.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
      );
    }
  }

  // Effective total pages (divided by column count when showing multi columns)
  const effectiveTotalPages = showMultiColumns
    ? Math.ceil(totalPages / columnCount)
    : totalPages;

  // Handle page change with scroll to top
  const handlePageChange = (newPage: number) => {
    setCurrentPage(
      showMultiColumns ? (newPage - 1) * columnCount + 1 : newPage
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Current effective page for display
  const effectiveCurrentPage = showMultiColumns
    ? Math.ceil(currentPage / columnCount)
    : currentPage;

  // Handle activity ticker click
  const handleActivityClick = (
    marketAddress: `0x${string}`,
    marketType: "amm" | "pariMutuel",
    pollAddress: `0x${string}`
  ) => {
    if (onMarketClick) {
      sessionStorage.setItem("returnToViewMode", String(viewMode));
      onMarketClick(
        marketAddress,
        marketType,
        pollAddress,
        "allPolls",
        currentPage,
        statusFilter,
        Array.from(categoryFilters)
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar + Activity Ticker */}
      <div className="card">
        {/* Loading overlay - full width when loading */}
        {isLoading ? (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-primary-600 dark:text-primary-400 animate-spin" />
              <div>
                <p className="text-gray-900 dark:text-white font-medium text-sm">
                  Scanning polls...
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
        ) : (
          <>
            {/* Desktop: Search + Activity Ticker side by side */}
            <div className="hidden sm:flex gap-4">
              {/* Search - left side */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search polls..."
                  className="input pl-10 h-12"
                />
              </div>
              {/* Activity Ticker - right side */}
              <div className="flex-1 min-w-0 border-l border-gray-200 dark:border-slate-700 pl-4">
                <ActivityTicker onMarketClick={handleActivityClick} />
              </div>
            </div>

            {/* Mobile: Activity Ticker with expandable search */}
            <div className="sm:hidden">
              {mobileSearchExpanded ? (
                /* Expanded search */
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search polls..."
                    className="input pl-10 pr-10 h-12"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setMobileSearchExpanded(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                /* Activity Ticker with search icon */
                <div className="flex items-center gap-2 h-12">
                  <button
                    onClick={() => setMobileSearchExpanded(true)}
                    className="flex-shrink-0 p-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <ActivityTicker onMarketClick={handleActivityClick} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        {/* Mobile: Collapsible toggle + Compact view toggle */}
        <div className="sm:hidden flex items-center justify-between">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center space-x-2 flex-1"
          >
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Filters
            </span>
            {activeFiltersCount > 0 && (
              <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                filtersExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            onClick={toggleMobileView}
            className={`p-2 rounded-lg transition-all ${
              isCompactView
                ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
            }`}
            title={isCompactView ? "Expanded view" : "Compact view"}
          >
            {isCompactView ? (
              <Grid2X2 className="w-5 h-5" />
            ) : (
              <LayoutList className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Filter content - always visible on sm+, collapsible on mobile */}
        <div
          className={`${
            filtersExpanded ? "block mt-4" : "hidden"
          } sm:block sm:mt-0`}
        >
          {/* Status Filter */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center space-x-2 sm:hidden">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Status:
                </span>
              </div>
              <button
                onClick={() => setStatusFilter(0)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  statusFilter === 0
                    ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                    : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-slate-600/50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter(1 << PollStatus.Pending)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  statusFilter === 1 << PollStatus.Pending
                    ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                    : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-slate-600/50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() =>
                  setStatusFilter(
                    (1 << PollStatus.Yes) |
                      (1 << PollStatus.No) |
                      (1 << PollStatus.Unknown)
                  )
                }
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  statusFilter ===
                  ((1 << PollStatus.Yes) |
                    (1 << PollStatus.No) |
                    (1 << PollStatus.Unknown))
                    ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                    : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-slate-600/50"
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setStatusFilter(ARBITRATION_FILTER)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  statusFilter === ARBITRATION_FILTER
                    ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                    : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-slate-600/50"
                }`}
              >
                Arbitration
              </button>
            </div>
            {/* Desktop: View mode toggle */}
            <button
              onClick={cycleViewMode}
              className={`hidden sm:flex p-2.5 rounded-lg transition-all ${
                isCompactView
                  ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                  : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-slate-600/50"
              }`}
              title={
                viewMode === 0
                  ? "2 columns"
                  : viewMode === 1
                  ? "3 columns"
                  : "Expanded view"
              }
            >
              {viewMode === 0 ? (
                <LayoutList className="w-5 h-5" />
              ) : viewMode === 1 ? (
                <Grid2X2 className="w-5 h-5" />
              ) : (
                <Grid3X3 className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Category Filter */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3 sm:mb-2">
              <div className="flex items-center space-x-2 sm:hidden">
                <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Categories:
                </span>
              </div>
              {categoryFilters.size > 0 && (
                <button
                  onClick={clearCategoryFilters}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-11">
              {Object.entries(POLL_CATEGORY_LABELS).map(([value, label]) => {
                const categoryValue = Number(value);
                const isSelected = categoryFilters.has(categoryValue);
                return (
                  <button
                    key={value}
                    onClick={() => toggleCategoryFilter(categoryValue)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                      isSelected
                        ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                        : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-slate-600/50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">
          Found {filteredPolls.length} poll
          {filteredPolls.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Poll Grid - always show polls if they exist */}
      {paginatedPolls.length > 0 && (
        <>
          {showMultiColumns ? (
            // Desktop compact: 2 or 3 columns showing multiple pages, rows aligned
            <div className="flex flex-col gap-2">
              {columnPolls[0]?.map((poll, index) => {
                return (
                  <div
                    key={poll.pollAddress}
                    className={`grid gap-4 ${
                      columnCount === 2 ? "grid-cols-2" : "grid-cols-3"
                    }`}
                  >
                    {/* Render all columns for this row */}
                    {columnPolls.map((column, colIndex) => {
                      const columnPoll = column[index];
                      return columnPoll ? (
                        <PollCard
                          key={columnPoll.pollAddress}
                          poll={columnPoll}
                          compact={true}
                          onMarketClick={
                            onMarketClick
                              ? (
                                  addr: `0x${string}`,
                                  type: "amm" | "pariMutuel",
                                  pollAddr: `0x${string}`
                                ) => {
                                  sessionStorage.setItem(
                                    "returnToViewMode",
                                    String(viewMode)
                                  );
                                  onMarketClick(
                                    addr,
                                    type,
                                    pollAddr,
                                    "allPolls",
                                    currentPage,
                                    statusFilter,
                                    Array.from(categoryFilters)
                                  );
                                }
                              : undefined
                          }
                        />
                      ) : (
                        <div key={`empty-${colIndex}`} /> // Empty placeholder for alignment
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            // Mobile compact or expanded view
            <div
              className={
                isCompactView
                  ? "flex flex-col gap-2"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              }
            >
              {paginatedPolls.map((poll) => (
                <PollCard
                  key={poll.pollAddress}
                  poll={poll}
                  compact={isCompactView}
                  onMarketClick={
                    onMarketClick
                      ? (
                          addr: `0x${string}`,
                          type: "amm" | "pariMutuel",
                          pollAddr: `0x${string}`
                        ) => {
                          sessionStorage.setItem(
                            "returnToViewMode",
                            String(viewMode)
                          );
                          onMarketClick(
                            addr,
                            type,
                            pollAddr,
                            "allPolls",
                            currentPage,
                            statusFilter,
                            Array.from(categoryFilters)
                          );
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* No polls message - only when not loading AND no polls */}
      {!isLoading && paginatedPolls.length === 0 && (
        <div className="card text-center">
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
            No polls found
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            {searchQuery
              ? "Try adjusting your search query or filters"
              : "Try adjusting the filters or create the first poll"}
          </p>
        </div>
      )}

      {/* Loading message - only when loading AND no polls yet */}
      {isLoading && paginatedPolls.length === 0 && (
        <div className="card text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
            Loading polls...
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Progress: {loadProgress}%
          </p>
        </div>
      )}

      {/* Pagination - show if polls exist */}
      {paginatedPolls.length > 0 && (
        <>
          {effectiveTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <button
                onClick={() =>
                  handlePageChange(Math.max(1, effectiveCurrentPage - 1))
                }
                disabled={effectiveCurrentPage === 1}
                className="btn-secondary flex items-center gap-1 px-2 md:px-4"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-1 md:gap-2">
                {Array.from(
                  { length: Math.min(5, effectiveTotalPages) },
                  (_, i) => {
                    // Show first 2, current, last 2 pages
                    let pageNum;
                    if (effectiveTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (effectiveCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      effectiveCurrentPage >=
                      effectiveTotalPages - 2
                    ) {
                      pageNum = effectiveTotalPages - 4 + i;
                    } else {
                      pageNum = effectiveCurrentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 md:w-11 md:h-11 rounded-lg text-sm md:text-base font-medium transition-all ${
                          effectiveCurrentPage === pageNum
                            ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() =>
                  handlePageChange(
                    Math.min(effectiveTotalPages, effectiveCurrentPage + 1)
                  )
                }
                disabled={effectiveCurrentPage === effectiveTotalPages}
                className="btn-secondary flex items-center gap-1 px-2 md:px-4"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Info */}
      <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
        Showing {filteredPolls.length} total polls
        {showMultiColumns &&
          ` (Page ${effectiveCurrentPage} of ${effectiveTotalPages})`}
      </div>
    </div>
  );
};

export default AllPolls;
