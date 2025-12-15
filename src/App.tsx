import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BarChart3, PlusCircle, List, Wallet, LayoutGrid } from "lucide-react";
import CreatePollForm from "./components/CreatePollForm";
import MyPolls from "./components/MyPolls";
import AllPolls from "./components/AllPolls";
import Stats from "./components/Stats";
import Portfolio from "./components/Portfolio";
import Logo from "./components/Logo";
import TradingBackground from "./components/TradingBackground";
import ThemeToggle from "./components/ThemeToggle";
import MarketPage from "./components/MarketPage";

type Tab = "create" | "myPolls" | "allPolls" | "stats" | "market" | "portfolio";

interface MarketTabState {
  marketAddress: `0x${string}`;
  marketType: "amm" | "pariMutuel";
  pollAddress: `0x${string}`;
  sourceTab: "allPolls" | "myPolls" | "portfolio";
  sourcePage: number;
  sourceFilter: number;
  sourceCategories: number[];
}

// Parse market state from URL hash
const parseMarketFromHash = (): { tab: Tab; market: MarketTabState | null } => {
  const hash = window.location.hash.slice(1); // Remove #
  if (!hash) return { tab: "allPolls", market: null };

  // Check for market URL: #market/amm/0x.../0x... or #market/pari/0x.../0x...
  const marketMatch = hash.match(
    /^market\/(amm|pari)\/0x([a-fA-F0-9]{40})\/0x([a-fA-F0-9]{40})$/
  );
  if (marketMatch) {
    return {
      tab: "market",
      market: {
        marketAddress: `0x${marketMatch[2]}` as `0x${string}`,
        marketType: marketMatch[1] === "amm" ? "amm" : "pariMutuel",
        pollAddress: `0x${marketMatch[3]}` as `0x${string}`,
        sourceTab: "allPolls", // Default when coming from URL
        sourcePage: 1,
        sourceFilter: 0,
        sourceCategories: [],
      },
    };
  }

  // Check for simple tab names
  if (["create", "myPolls", "allPolls", "stats"].includes(hash)) {
    return { tab: hash as Tab, market: null };
  }

  return { tab: "allPolls", market: null };
};

function App() {
  // Initialize state from URL hash
  const initialState = parseMarketFromHash();
  const [activeTab, setActiveTab] = useState<Tab>(initialState.tab);
  const [marketTabState, setMarketTabState] = useState<MarketTabState | null>(
    initialState.market
  );
  const { isConnected } = useAccount();

  // Flag to prevent hashchange handler from overwriting programmatic navigation
  const isProgrammaticNavigation = useRef(false);

  // Sync URL hash with state
  useEffect(() => {
    isProgrammaticNavigation.current = true;
    if (activeTab === "market" && marketTabState) {
      const marketTypeShort =
        marketTabState.marketType === "amm" ? "amm" : "pari";
      window.location.hash = `market/${marketTypeShort}/${marketTabState.marketAddress}/${marketTabState.pollAddress}`;
    } else if (activeTab !== "allPolls") {
      window.location.hash = activeTab;
    } else {
      // Clear hash for default tab
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
      }
    }
    // Reset flag after a short delay to allow hashchange to fire
    setTimeout(() => {
      isProgrammaticNavigation.current = false;
    }, 100);
  }, [activeTab, marketTabState]);

  // Handle browser back/forward (only for actual browser navigation, not programmatic)
  useEffect(() => {
    const handleHashChange = () => {
      // Skip if this is a programmatic navigation (we already set the state)
      if (isProgrammaticNavigation.current) {
        return;
      }
      const { tab, market } = parseMarketFromHash();
      setActiveTab(tab);
      setMarketTabState(market);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Handle market click from poll cards
  const handleMarketClick = (
    marketAddress: `0x${string}`,
    marketType: "amm" | "pariMutuel",
    pollAddress: `0x${string}`,
    sourceTab: "allPolls" | "myPolls" | "portfolio" = "allPolls",
    sourcePage: number = 1,
    sourceFilter: number = 0,
    sourceCategories: number[] = []
  ) => {
    setMarketTabState({
      marketAddress,
      marketType,
      pollAddress,
      sourceTab,
      sourcePage,
      sourceFilter,
      sourceCategories,
    });
    setActiveTab("market");
  };

  // Handle back from market page - return to source tab with page, filter and categories
  const handleBackFromMarket = () => {
    const sourceTab = marketTabState?.sourceTab || "allPolls";
    const sourcePage = marketTabState?.sourcePage || 1;
    const sourceFilter = marketTabState?.sourceFilter ?? 0;
    const sourceCategories = marketTabState?.sourceCategories ?? [];
    const pollAddress = marketTabState?.pollAddress;

    // Store poll address to refresh market data on return
    if (pollAddress) {
      sessionStorage.setItem("refreshPollMarket", pollAddress);
    }

    setActiveTab(sourceTab);
    setMarketTabState(null);
    // Store page, filter and categories in sessionStorage so components can restore it
    sessionStorage.setItem("returnToPage", sourcePage.toString());
    sessionStorage.setItem("returnToFilter", sourceFilter.toString());
    sessionStorage.setItem(
      "returnToCategories",
      JSON.stringify(sourceCategories)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] relative transition-colors duration-300 overflow-x-hidden max-w-full flex flex-col">
      <TradingBackground />
      {/* Header */}
      <header className="bg-white/80 dark:bg-[#0B1121]/70 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 sticky top-0 z-50 shadow-sm dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] transition-colors duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Prediction Oracle
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Decentralized Predictions on Sonic
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="container mx-auto px-2 md:px-4 py-4 md:py-6 relative z-10">
        <div className="flex justify-between sm:justify-start sm:flex-wrap sm:gap-2 bg-white/60 dark:bg-[#0f172a]/60 p-2 rounded-2xl backdrop-blur-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)] transition-colors duration-300">
          <button
            onClick={() => setActiveTab("allPolls")}
            className={`flex items-center justify-center sm:justify-start space-x-0 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all ${
              activeTab === "allPolls"
                ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <List className="w-5 h-5 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">All Polls</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center justify-center sm:justify-start space-x-0 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all ${
              activeTab === "create"
                ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <PlusCircle className="w-5 h-5 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create Poll</span>
          </button>
          <button
            onClick={() => setActiveTab("myPolls")}
            className={`flex items-center justify-center sm:justify-start space-x-0 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all ${
              activeTab === "myPolls"
                ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <LayoutGrid className="w-5 h-5 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">My Polls</span>
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`flex items-center justify-center sm:justify-start space-x-0 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all ${
              activeTab === "portfolio"
                ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <Wallet className="w-5 h-5 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Portfolio</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center justify-center sm:justify-start space-x-0 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all ${
              activeTab === "stats"
                ? "bg-slate-200/90 dark:bg-[rgba(24,36,63,0.85)] text-slate-700 dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-slate-300 dark:border-white/[0.08]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <BarChart3 className="w-5 h-5 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Statistics</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12 relative z-10 flex-grow">
        {!isConnected &&
        activeTab !== "allPolls" &&
        activeTab !== "stats" &&
        activeTab !== "portfolio" ? (
          <div className="card text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Please connect your wallet to continue
            </p>
          </div>
        ) : (
          <>
            {activeTab === "create" && <CreatePollForm />}
            {activeTab === "myPolls" && (
              <MyPolls onMarketClick={handleMarketClick} />
            )}
            {activeTab === "allPolls" && (
              <AllPolls onMarketClick={handleMarketClick} />
            )}
            {activeTab === "stats" && <Stats />}
            {activeTab === "portfolio" && (
              <Portfolio
                onMarketClick={(addr, type, poll) =>
                  handleMarketClick(addr, type, poll, "portfolio", 1, 0, [])
                }
              />
            )}
            {activeTab === "market" && marketTabState && (
              <MarketPage
                marketAddress={marketTabState.marketAddress}
                marketType={marketTabState.marketType}
                pollAddress={marketTabState.pollAddress}
                onBack={handleBackFromMarket}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/60 dark:bg-[#0B1121]/70 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 relative z-10 transition-colors duration-300 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Prediction Oracle - Decentralized Prediction Market
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
