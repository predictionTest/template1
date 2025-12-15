// ABI for PredictionPariMutuel contract
export const PARI_MUTUEL_ABI = [
  // View functions
  {
    type: "function",
    name: "marketState",
    inputs: [],
    outputs: [
      { name: "isLive", type: "bool", internalType: "bool" },
      { name: "collateralTvl", type: "uint256", internalType: "uint256" },
      { name: "yesChance", type: "uint32", internalType: "uint32" },
      { name: "collateral", type: "address", internalType: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMarketInfo",
    inputs: [],
    outputs: [
      {
        name: "info",
        type: "tuple",
        internalType: "struct IPredictionPariMutuel.MarketInfo",
        components: [
          { name: "creator", type: "address", internalType: "address" },
          { name: "pollAddress", type: "address", internalType: "address" },
          { name: "collateralToken", type: "address", internalType: "address" },
          { name: "protocolFeeRate", type: "uint24", internalType: "uint24" },
          {
            name: "marketCloseTimestamp",
            type: "uint32",
            internalType: "uint32",
          },
          {
            name: "marketStartTimestamp",
            type: "uint32",
            internalType: "uint32",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totals",
    inputs: [],
    outputs: [
      {
        name: "total",
        type: "tuple",
        internalType: "struct IPredictionPariMutuel.TotalsInfo",
        components: [
          { name: "collateralYes", type: "uint256", internalType: "uint256" },
          { name: "collateralNo", type: "uint256", internalType: "uint256" },
          { name: "sharesYes", type: "uint256", internalType: "uint256" },
          { name: "sharesNo", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPosition",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "position",
        type: "tuple",
        internalType: "struct IPredictionPariMutuel.Position",
        components: [
          { name: "collateralYes", type: "uint128", internalType: "uint128" },
          { name: "collateralNo", type: "uint128", internalType: "uint128" },
          { name: "sharesYes", type: "uint128", internalType: "uint128" },
          { name: "sharesNo", type: "uint128", internalType: "uint128" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPositionPayout",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "payout",
        type: "tuple",
        internalType: "struct IPredictionPariMutuel.PositionPayout",
        components: [
          { name: "potentialYesWin", type: "uint256", internalType: "uint256" },
          { name: "potentialNoWin", type: "uint256", internalType: "uint256" },
          { name: "refundIfUnknown", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateBuy",
    inputs: [
      { name: "isYes", type: "bool", internalType: "bool" },
      { name: "collateralAmount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "sharesOut", type: "uint256", internalType: "uint256" },
      { name: "payoutIfWin", type: "uint256", internalType: "uint256" },
      { name: "fee", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecentHourlySnapshots",
    inputs: [
      { name: "offset", type: "uint32", internalType: "uint32" },
      { name: "limit", type: "uint32", internalType: "uint32" },
    ],
    outputs: [
      {
        name: "snapshots",
        type: "tuple[]",
        internalType: "struct IPredictionPariMutuel.HourlySnapshot[]",
        components: [
          { name: "yesChance", type: "uint32", internalType: "uint32" },
          {
            name: "collateralYesRatio",
            type: "uint32",
            internalType: "uint32",
          },
          { name: "bets", type: "uint32", internalType: "uint32" },
          { name: "volume", type: "uint128", internalType: "uint128" },
        ],
      },
      { name: "hasMore", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecentNonZeroHourlySnapshots",
    inputs: [
      { name: "offset", type: "uint32", internalType: "uint32" },
      { name: "limit", type: "uint32", internalType: "uint32" },
    ],
    outputs: [
      {
        name: "snapshots",
        type: "tuple[]",
        internalType: "struct IPredictionPariMutuel.HourlySnapshotWithHour[]",
        components: [
          { name: "hour", type: "uint32", internalType: "uint32" },
          {
            name: "snapshot",
            type: "tuple",
            internalType: "struct IPredictionPariMutuel.HourlySnapshot",
            components: [
              { name: "yesChance", type: "uint32", internalType: "uint32" },
              {
                name: "collateralYesRatio",
                type: "uint32",
                internalType: "uint32",
              },
              { name: "bets", type: "uint32", internalType: "uint32" },
              { name: "volume", type: "uint128", internalType: "uint128" },
            ],
          },
        ],
      },
      { name: "hasMore", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "firstSnapshotHour",
    inputs: [],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "curveFlattener",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "curveOffset",
    inputs: [],
    outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pollAddress",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "creator",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "collateralToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "marketCloseTimestamp",
    inputs: [],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "marketStartTimestamp",
    inputs: [],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "protocolFeeRate",
    inputs: [],
    outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
    stateMutability: "view",
  },
  // Write functions
  {
    type: "function",
    name: "buy",
    inputs: [
      { name: "isYes", type: "bool", internalType: "bool" },
      { name: "collateralAmount", type: "uint256", internalType: "uint256" },
      { name: "minSharesOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "sharesOut", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "redeemWinnings",
    inputs: [],
    outputs: [
      { name: "collateralAmount", type: "uint256", internalType: "uint256" },
      { name: "fee", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawProtocolFees",
    inputs: [],
    outputs: [
      { name: "totalAmount", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "protocolFeesCollected",
    inputs: [],
    outputs: [{ name: "", type: "uint112", internalType: "uint112" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "PositionPurchased",
    inputs: [
      {
        name: "buyer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "isYes", type: "bool", indexed: true, internalType: "bool" },
      {
        name: "collateralIn",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "sharesOut",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
  },
  {
    type: "event",
    name: "WinningsRedeemed",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "collateralAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      { name: "outcome", type: "uint8", indexed: false, internalType: "uint8" },
      { name: "fee", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
] as const;

// Types for PariMutuel data
export interface PariMutuelPosition {
  collateralYes: bigint;
  collateralNo: bigint;
  sharesYes: bigint;
  sharesNo: bigint;
}

export interface PariMutuelPositionPayout {
  potentialYesWin: bigint;
  potentialNoWin: bigint;
  refundIfUnknown: bigint;
}

export interface PariMutuelTotals {
  collateralYes: bigint;
  collateralNo: bigint;
  sharesYes: bigint;
  sharesNo: bigint;
}

export interface PariMutuelMarketInfo {
  creator: `0x${string}`;
  pollAddress: `0x${string}`;
  collateralToken: `0x${string}`;
  protocolFeeRate: number;
  marketCloseTimestamp: number;
  marketStartTimestamp: number;
}

export interface HourlySnapshot {
  yesChance: number;
  collateralYesRatio: number;
  bets: number;
  volume: bigint;
}

export interface HourlySnapshotWithHour {
  hour: number;
  snapshot: HourlySnapshot;
}

// Scale constants
export const SNAPSHOT_SCALE = 1_000_000_000n;
export const BPS_DENOMINATOR = 1_000_000;

// Poll ABI for getFinalizedStatus and additional info
export const POLL_ABI = [
  {
    type: "function",
    name: "getFinalizedStatus",
    inputs: [],
    outputs: [
      { name: "isFinalized", type: "bool", internalType: "bool" },
      {
        name: "status",
        type: "uint8",
        internalType: "enum PollStatus",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStatus",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum PollStatus",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFinalizationEpoch",
    inputs: [],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "arbitrationStarted",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;
