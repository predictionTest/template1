import { PollStatus } from "@/config/abi";

export interface PollInfo {
  pollAddress: `0x${string}`;
  question: string;
  rules: string;
  sources: string[];
  deadlineEpoch: number;
  finalizationEpoch: number;
  checkEpoch: number;
  creator: `0x${string}`;
  arbiter: `0x${string}`;
  status: PollStatus;
  category: number;
  resolutionReason: string;
}

export interface CreatePollFormData {
  question: string;
  rules: string;
  sources: string[];
  targetTimestamp: string;
  arbiter: string;
  category: number;
}

// Market state from MarketFactory.getMarketsState
export interface MarketState {
  isLive: boolean;
  collateralTvl: bigint;
  yesChance: number; // 0-1_000_000_000 scale
  marketAddress: `0x${string}`;
  collateralToken: `0x${string}`;
}

// Combined market info for a poll (AMM + PariMutuel)
export interface PollMarkets {
  amm: MarketState | null;
  pariMutuel: MarketState | null;
}
