// PredictionOracle Contract ABI
export const PREDICTION_ORACLE_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_operatorGasFee", type: "uint256", internalType: "uint256" },
      { name: "_protocolFee", type: "uint256", internalType: "uint256" },
      { name: "_pollImplementation", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createPoll",
    inputs: [
      { name: "_question", type: "string", internalType: "string" },
      { name: "_rules", type: "string", internalType: "string" },
      { name: "_sources", type: "string[]", internalType: "string[]" },
      { name: "_targetTimestamp", type: "uint256", internalType: "uint256" },
      { name: "_arbiter", type: "address", internalType: "address" },
      { name: "_category", type: "uint8", internalType: "uint8" },
    ],
    outputs: [
      { name: "pollAddress", type: "address", internalType: "address" },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getPollsByCreator",
    inputs: [
      { name: "_creator", type: "address", internalType: "address" },
      { name: "_maxResults", type: "uint256", internalType: "uint256" },
      { name: "_offset", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "polls",
        type: "tuple[]",
        internalType: "struct PollInfo[]",
        components: [
          { name: "pollAddress", type: "address", internalType: "address" },
          { name: "question", type: "string", internalType: "string" },
          { name: "rules", type: "string", internalType: "string" },
          { name: "sources", type: "string[]", internalType: "string[]" },
          { name: "deadlineEpoch", type: "uint32", internalType: "uint32" },
          { name: "finalizationEpoch", type: "uint32", internalType: "uint32" },
          { name: "checkEpoch", type: "uint32", internalType: "uint32" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "arbiter", type: "address", internalType: "address" },
          { name: "status", type: "uint8", internalType: "enum PollStatus" },
          { name: "category", type: "uint8", internalType: "uint8" },
          { name: "resolutionReason", type: "string", internalType: "string" },
        ],
      },
      { name: "hasMore", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPollsByEpochRange",
    inputs: [
      { name: "_fromEpoch", type: "uint32", internalType: "uint32" },
      { name: "_toEpoch", type: "uint32", internalType: "uint32" },
      { name: "_statusFilter", type: "uint256", internalType: "uint256" },
      { name: "_typeFilter", type: "uint256", internalType: "uint256" },
      { name: "_maxResults", type: "uint256", internalType: "uint256" },
      { name: "_startIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "polls",
        type: "tuple[]",
        internalType: "struct PollInfo[]",
        components: [
          { name: "pollAddress", type: "address", internalType: "address" },
          { name: "question", type: "string", internalType: "string" },
          { name: "rules", type: "string", internalType: "string" },
          { name: "sources", type: "string[]", internalType: "string[]" },
          { name: "deadlineEpoch", type: "uint32", internalType: "uint32" },
          { name: "finalizationEpoch", type: "uint32", internalType: "uint32" },
          { name: "checkEpoch", type: "uint32", internalType: "uint32" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "arbiter", type: "address", internalType: "address" },
          { name: "status", type: "uint8", internalType: "enum PollStatus" },
          { name: "category", type: "uint8", internalType: "uint8" },
          { name: "resolutionReason", type: "string", internalType: "string" },
        ],
      },
      { name: "nextEpoch", type: "uint32", internalType: "uint32" },
      { name: "nextIndex", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPollsByEpochs",
    inputs: [
      { name: "_epochs", type: "uint32[]", internalType: "uint32[]" },
      { name: "_statusFilter", type: "uint256", internalType: "uint256" },
      { name: "_typeFilter", type: "uint256", internalType: "uint256" },
      { name: "_maxResults", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "polls",
        type: "tuple[]",
        internalType: "struct PollInfo[]",
        components: [
          { name: "pollAddress", type: "address", internalType: "address" },
          { name: "question", type: "string", internalType: "string" },
          { name: "rules", type: "string", internalType: "string" },
          { name: "sources", type: "string[]", internalType: "string[]" },
          { name: "deadlineEpoch", type: "uint32", internalType: "uint32" },
          { name: "finalizationEpoch", type: "uint32", internalType: "uint32" },
          { name: "checkEpoch", type: "uint32", internalType: "uint32" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "arbiter", type: "address", internalType: "address" },
          { name: "status", type: "uint8", internalType: "enum PollStatus" },
          { name: "category", type: "uint8", internalType: "uint8" },
          { name: "resolutionReason", type: "string", internalType: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "operatorGasFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "protocolFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "refreshPollFree",
    inputs: [
      { name: "_pollAddress", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "refreshPollPaid",
    inputs: [
      { name: "_pollAddress", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getCurrentEpoch",
    inputs: [],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentCheckEpoch",
    inputs: [
      { name: "_pollAddress", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "EPOCH_LENGTH",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PENDING_TIMEOUT_EPOCHS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "PollCreated",
    inputs: [
      { name: "pollAddress", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "deadlineEpoch", type: "uint32", indexed: false },
      { name: "question", type: "string", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PollRefreshed",
    inputs: [
      { name: "pollAddress", type: "address", indexed: true },
      { name: "oldCheckEpoch", type: "uint32", indexed: false },
      { name: "newCheckEpoch", type: "uint32", indexed: false },
      { name: "wasFree", type: "bool", indexed: false },
    ],
    anonymous: false,
  },
] as const;

// Poll Status Enum
export enum PollStatus {
  Pending = 0,
  Yes = 1,
  No = 2,
  Unknown = 3,
}

export const POLL_STATUS_LABELS: Record<PollStatus, string> = {
  [PollStatus.Pending]: "Pending",
  [PollStatus.Yes]: "Yes",
  [PollStatus.No]: "No",
  [PollStatus.Unknown]: "Unknown",
};

export const POLL_STATUS_COLORS: Record<PollStatus, string> = {
  [PollStatus.Pending]: "bg-yellow-100 text-yellow-800",
  [PollStatus.Yes]: "bg-green-100 text-green-800",
  [PollStatus.No]: "bg-red-100 text-red-800",
  [PollStatus.Unknown]: "bg-gray-100 text-gray-800",
};

// Poll Category Enum
export enum PollCategory {
  Politics = 0,
  Sports = 1,
  Finance = 2,
  Crypto = 3,
  Culture = 4,
  Technology = 5,
  Science = 6,
  Entertainment = 7,
  Health = 8,
  Environment = 9,
  Other = 10,
}

export const POLL_CATEGORY_LABELS: Record<PollCategory, string> = {
  [PollCategory.Politics]: "Politics",
  [PollCategory.Sports]: "Sports",
  [PollCategory.Finance]: "Finance",
  [PollCategory.Crypto]: "Crypto",
  [PollCategory.Culture]: "Culture",
  [PollCategory.Technology]: "Technology",
  [PollCategory.Science]: "Science",
  [PollCategory.Entertainment]: "Entertainment",
  [PollCategory.Health]: "Health",
  [PollCategory.Environment]: "Environment",
  [PollCategory.Other]: "Other",
};

export const POLL_CATEGORY_COLORS: Record<PollCategory, string> = {
  [PollCategory.Politics]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [PollCategory.Sports]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  [PollCategory.Finance]:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  [PollCategory.Crypto]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  [PollCategory.Culture]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  [PollCategory.Technology]:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  [PollCategory.Science]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  [PollCategory.Entertainment]:
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  [PollCategory.Health]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [PollCategory.Environment]:
    "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  [PollCategory.Other]:
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

// MarketFactory Contract ABI
export const MARKET_FACTORY_ABI = [
  {
    type: "function",
    name: "getMarketsState",
    inputs: [
      {
        name: "_pollAddresses",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    outputs: [
      {
        name: "states",
        type: "tuple[]",
        internalType: "struct IMarketFactory.MarketState[]",
        components: [
          { name: "isLive", type: "bool", internalType: "bool" },
          { name: "collateralTvl", type: "uint256", internalType: "uint256" },
          { name: "yesChance", type: "uint32", internalType: "uint32" },
          { name: "marketAddress", type: "address", internalType: "address" },
          { name: "collateralToken", type: "address", internalType: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createMarket",
    inputs: [
      { name: "_pollAddress", type: "address", internalType: "address" },
      { name: "_collateral", type: "address", internalType: "address" },
      { name: "_initialLiquidity", type: "uint256", internalType: "uint256" },
      {
        name: "_distributionHint",
        type: "uint256[2]",
        internalType: "uint256[2]",
      },
      { name: "_feeTier", type: "uint24", internalType: "uint24" },
      {
        name: "_maxPriceImbalancePerHour",
        type: "uint24",
        internalType: "uint24",
      },
    ],
    outputs: [
      { name: "marketAddress", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createPariMutuel",
    inputs: [
      { name: "_pollAddress", type: "address", internalType: "address" },
      { name: "_collateral", type: "address", internalType: "address" },
      { name: "_initialLiquidity", type: "uint256", internalType: "uint256" },
      {
        name: "_distributionHint",
        type: "uint256[2]",
        internalType: "uint256[2]",
      },
      { name: "_curveFlattener", type: "uint8", internalType: "uint8" },
      { name: "_curveOffset", type: "uint24", internalType: "uint24" },
    ],
    outputs: [
      { name: "pariMutuelPool", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "MIN_FEE_TIER",
    inputs: [],
    outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_FEE_TIER",
    inputs: [],
    outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "BPS_DENOMINATOR",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "protocolFeeRate",
    inputs: [],
    outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWhitelistedCollaterals",
    inputs: [],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "marketCloseBufferEpochs",
    inputs: [],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformTreasury",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
] as const;

// ERC20 ABI for approve and balanceOf
export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
] as const;

// Collateral tokens configuration
export interface CollateralToken {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
}

// Market creation constants
export const MARKET_CONSTANTS = {
  MIN_FEE_TIER: 500, // 0.05%
  MAX_FEE_TIER: 10000, // 1%
  BPS_DENOMINATOR: 1_000_000,
  FEE_TIER_PRESETS: [
    { label: "0.05%", value: 500 },
    { label: "0.1%", value: 1000 },
    { label: "0.3%", value: 3000 },
    { label: "0.5%", value: 5000 },
    { label: "1%", value: 10000 },
  ],
  PRICE_IMBALANCE_PRESETS: [
    { label: "Disabled", value: 0 },
    { label: "5%", value: 50000 },
    { label: "10%", value: 100000 },
    { label: "15%", value: 150000 },
  ],
  CURVE_OFFSET_PRESETS: [
    { label: "0%", value: 0 },
    { label: "10%", value: 100000 },
    { label: "20%", value: 200000 },
    { label: "30%", value: 300000 },
  ],
};
