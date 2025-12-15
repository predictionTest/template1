import PariMutuelMarketPage from "./PariMutuelMarketPage";
import AmmMarketPage from "./AmmMarketPage";

interface MarketPageProps {
  marketAddress: `0x${string}`;
  marketType: "amm" | "pariMutuel";
  pollAddress: `0x${string}`;
  onBack: () => void;
}

const MarketPage = ({
  marketAddress,
  marketType,
  pollAddress,
  onBack,
}: MarketPageProps) => {
  // Use dedicated component for Pari-Mutuel
  if (marketType === "pariMutuel") {
    return (
      <PariMutuelMarketPage
        marketAddress={marketAddress}
        pollAddress={pollAddress}
        onBack={onBack}
      />
    );
  }

  // Use dedicated component for AMM
  return (
    <AmmMarketPage
      marketAddress={marketAddress}
      pollAddress={pollAddress}
      onBack={onBack}
    />
  );
};

export default MarketPage;
