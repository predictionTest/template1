import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Coins,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PREDICTION_ORACLE_ABI } from "@/config/abi";
import {
  getContractConfig,
  COLLATERAL_TOKENS,
  ENABLE_MOCK_MINT,
  MOCK_MINT_AMOUNT,
} from "@/config/contract";
import { PollInfo } from "@/types";
import PollCard from "./PollCard";
import CreateMarketForm from "./CreateMarketForm";
import { useMarkets } from "@/hooks/useMarkets";

// MockERC20 ABI for mint function
const MOCK_ERC20_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface MyPollsProps {
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

const MyPolls = ({ onMarketClick }: MyPollsProps) => {
  const { address } = useAccount();
  const contractConfig = getContractConfig();
  const { loadMarketsForPolls, refreshMarketsForPolls } = useMarkets();

  // Refresh market data for poll we just visited (to show updated prices)
  useEffect(() => {
    const pollToRefresh = sessionStorage.getItem("refreshPollMarket");
    if (pollToRefresh) {
      sessionStorage.removeItem("refreshPollMarket");
      refreshMarketsForPolls([pollToRefresh as `0x${string}`]);
    }
  }, [refreshMarketsForPolls]);
  const [polls, setPolls] = useState<PollInfo[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedPollForMarket, setSelectedPollForMarket] =
    useState<PollInfo | null>(null);
  const [selectedMarketType, setSelectedMarketType] = useState<
    "amm" | "pariMutuel"
  >("amm");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const maxResults = 10;

  // Mock mint transaction
  const {
    writeContract: writeMint,
    data: mintHash,
    isPending: isMintPending,
  } = useWriteContract();

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } =
    useWaitForTransactionReceipt({ hash: mintHash });

  // Handle mint success
  useEffect(() => {
    if (isMintSuccess) {
      setIsMinting(false);
    }
  }, [isMintSuccess]);

  const handleMint = () => {
    if (!address) return;
    const token = COLLATERAL_TOKENS[0];
    const amount = parseUnits(MOCK_MINT_AMOUNT.toString(), token.decimals);
    setIsMinting(true);
    writeMint({
      address: token.address as `0x${string}`,
      abi: MOCK_ERC20_ABI,
      functionName: "mint",
      args: [address, amount],
    });
  };

  const { data, isError, isLoading, refetch } = useReadContract({
    address: contractConfig.address,
    abi: PREDICTION_ORACLE_ABI,
    functionName: "getPollsByCreator",
    args: address ? [address, BigInt(maxResults), BigInt(offset)] : undefined,
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (data) {
      const [pollsData, hasMoreData] = data as [PollInfo[], boolean];
      // Sort by deadlineEpoch DESC - newest first
      const sortedPolls = [...pollsData].sort(
        (a, b) => Number(b.deadlineEpoch) - Number(a.deadlineEpoch)
      );
      setPolls(sortedPolls);
      setHasMore(hasMoreData);

      // Load market states for these polls
      if (sortedPolls.length > 0) {
        loadMarketsForPolls(sortedPolls.map((p) => p.pollAddress));
      }
    }
  }, [data, loadMarketsForPolls]);

  // Handle create market button click
  const handleCreateMarket = (
    poll: PollInfo,
    marketType: "amm" | "pariMutuel"
  ) => {
    setSelectedPollForMarket(poll);
    setSelectedMarketType(marketType);
  };

  // Handle back from create market form
  const handleBackFromCreateMarket = () => {
    setSelectedPollForMarket(null);
  };

  // Handle successful market creation
  const handleMarketCreated = () => {
    setSelectedPollForMarket(null);
    // Refetch polls to update the view
    refetch();
  };

  const loadMore = () => {
    setOffset(offset + maxResults);
    refetch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadPrevious = () => {
    setOffset(Math.max(0, offset - maxResults));
    refetch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load your polls</p>
        </div>
      </div>
    );
  }

  // Show create market form if a poll is selected
  if (selectedPollForMarket) {
    return (
      <CreateMarketForm
        poll={selectedPollForMarket}
        initialMarketType={selectedMarketType}
        onBack={handleBackFromCreateMarket}
        onSuccess={handleMarketCreated}
      />
    );
  }

  if (polls.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-gray-400 text-lg">
          You haven't created any polls yet
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Create your first prediction poll to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          My Polls ({polls.length})
        </h2>
        <div className="flex items-center gap-2">
          {ENABLE_MOCK_MINT && (
            <button
              onClick={handleMint}
              disabled={isMinting || isMintPending || isMintConfirming}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors disabled:opacity-50 border border-amber-500/30"
              title={`Mint ${MOCK_MINT_AMOUNT.toLocaleString()} test USDC`}
            >
              {isMintPending || isMintConfirming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Coins className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                Mint {MOCK_MINT_AMOUNT.toLocaleString()} USDC
              </span>
              <span className="sm:hidden">Mint 1M USDC</span>
            </button>
          )}
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh polls"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map((poll) => (
          <PollCard
            key={poll.pollAddress}
            poll={poll}
            isOwner={true}
            onCreateMarket={handleCreateMarket}
            onMarketClick={
              onMarketClick
                ? (addr, type, poll) =>
                    onMarketClick(addr, type, poll, "myPolls", 1, 0, [])
                : undefined
            }
          />
        ))}
      </div>

      {/* Pagination */}
      {(hasMore || offset > 0) && (
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <button
            onClick={loadPrevious}
            disabled={offset === 0}
            className="btn-secondary flex items-center gap-1 px-2 md:px-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="text-gray-400 text-sm md:text-base">
            Page {Math.floor(offset / maxResults) + 1}
          </span>
          <button
            onClick={loadMore}
            disabled={!hasMore}
            className="btn-secondary flex items-center gap-1 px-2 md:px-4"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyPolls;
