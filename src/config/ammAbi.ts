// ABI for PredictionAMM contract

export const AMM_ABI = [
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
        name: "",
        type: "tuple",
        internalType: "struct IPredictionAMM.MarketInfo",
        components: [
          { name: "creator", type: "address", internalType: "address" },
          { name: "pollAddress", type: "address", internalType: "address" },
          { name: "yesToken", type: "address", internalType: "address" },
          { name: "noToken", type: "address", internalType: "address" },
          { name: "collateralToken", type: "address", internalType: "address" },
          { name: "tradingFee", type: "uint24", internalType: "uint24" },
          { name: "protocolFeeRate", type: "uint24", internalType: "uint24" },
          {
            name: "maxPriceImbalancePerHour",
            type: "uint24",
            internalType: "uint24",
          },
          { name: "closeTimestamp", type: "uint32", internalType: "uint32" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReserves",
    inputs: [],
    outputs: [
      { name: "_reserveYes", type: "uint112", internalType: "uint112" },
      { name: "_reserveNo", type: "uint112", internalType: "uint112" },
      { name: "_totalLP", type: "uint256", internalType: "uint256" },
      { name: "_protocolFees", type: "uint256", internalType: "uint256" },
      { name: "_collateralTvl", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getYesPrice",
    inputs: [],
    outputs: [{ name: "price", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getNoPrice",
    inputs: [],
    outputs: [{ name: "price", type: "uint256", internalType: "uint256" }],
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
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
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
    name: "yesToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "noToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tradingFee",
    inputs: [],
    outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
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
    name: "maxPriceImbalancePerHour",
    inputs: [],
    outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
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
    name: "firstCandleHour",
    inputs: [],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  // Hourly candles
  {
    type: "function",
    name: "getHourlyCandle",
    inputs: [{ name: "hour", type: "uint32", internalType: "uint32" }],
    outputs: [
      {
        name: "candle",
        type: "tuple",
        internalType: "struct IPredictionAMM.HourlyCandle",
        components: [
          { name: "openPrice", type: "uint32", internalType: "uint32" },
          { name: "highPrice", type: "uint32", internalType: "uint32" },
          { name: "lowPrice", type: "uint32", internalType: "uint32" },
          { name: "closePrice", type: "uint32", internalType: "uint32" },
          { name: "volume", type: "uint96", internalType: "uint96" },
          { name: "trades", type: "uint32", internalType: "uint32" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecentHourlyCandles",
    inputs: [
      { name: "offset", type: "uint32", internalType: "uint32" },
      { name: "limit", type: "uint32", internalType: "uint32" },
    ],
    outputs: [
      {
        name: "candles",
        type: "tuple[]",
        internalType: "struct IPredictionAMM.HourlyCandle[]",
        components: [
          { name: "openPrice", type: "uint32", internalType: "uint32" },
          { name: "highPrice", type: "uint32", internalType: "uint32" },
          { name: "lowPrice", type: "uint32", internalType: "uint32" },
          { name: "closePrice", type: "uint32", internalType: "uint32" },
          { name: "volume", type: "uint96", internalType: "uint96" },
          { name: "trades", type: "uint32", internalType: "uint32" },
        ],
      },
      { name: "hasMore", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecentNonZeroHourlyCandles",
    inputs: [
      { name: "offset", type: "uint32", internalType: "uint32" },
      { name: "limit", type: "uint32", internalType: "uint32" },
    ],
    outputs: [
      {
        name: "candles",
        type: "tuple[]",
        internalType: "struct IPredictionAMM.HourlyCandleWithHour[]",
        components: [
          { name: "hour", type: "uint32", internalType: "uint32" },
          {
            name: "candle",
            type: "tuple",
            internalType: "struct IPredictionAMM.HourlyCandle",
            components: [
              { name: "openPrice", type: "uint32", internalType: "uint32" },
              { name: "highPrice", type: "uint32", internalType: "uint32" },
              { name: "lowPrice", type: "uint32", internalType: "uint32" },
              { name: "closePrice", type: "uint32", internalType: "uint32" },
              { name: "volume", type: "uint96", internalType: "uint96" },
              { name: "trades", type: "uint32", internalType: "uint32" },
            ],
          },
        ],
      },
      { name: "hasMore", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  // Quoter functions
  {
    type: "function",
    name: "calcBuyYes",
    inputs: [
      { name: "collateralIn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "yesOut", type: "uint256", internalType: "uint256" },
      {
        name: "maxAllowedCollateralIn",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calcBuyNo",
    inputs: [
      { name: "collateralIn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "noOut", type: "uint256", internalType: "uint256" },
      {
        name: "maxAllowedCollateralIn",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calcSellYes",
    inputs: [{ name: "yesIn", type: "uint112", internalType: "uint112" }],
    outputs: [
      { name: "collateralOut", type: "uint256", internalType: "uint256" },
      { name: "protocolFee", type: "uint256", internalType: "uint256" },
      { name: "maxAllowedYesIn", type: "uint112", internalType: "uint112" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calcSellNo",
    inputs: [{ name: "noIn", type: "uint112", internalType: "uint112" }],
    outputs: [
      { name: "collateralOut", type: "uint256", internalType: "uint256" },
      { name: "protocolFee", type: "uint256", internalType: "uint256" },
      { name: "maxAllowedNoIn", type: "uint112", internalType: "uint112" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calcSwapExactIn",
    inputs: [
      { name: "yesToNo", type: "bool", internalType: "bool" },
      { name: "amountIn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "amountOut", type: "uint256", internalType: "uint256" },
      { name: "feeAmount", type: "uint256", internalType: "uint256" },
      { name: "maxAllowedAmountIn", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calcSwapExactOut",
    inputs: [
      { name: "yesToNo", type: "bool", internalType: "bool" },
      { name: "amountOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "amountIn", type: "uint256", internalType: "uint256" },
      { name: "feeAmount", type: "uint256", internalType: "uint256" },
      { name: "maxAllowedAmountIn", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  // Trading functions
  {
    type: "function",
    name: "buy",
    inputs: [
      { name: "isYes", type: "bool", internalType: "bool" },
      { name: "collateralAmtIn", type: "uint256", internalType: "uint256" },
      { name: "minTokenOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sell",
    inputs: [
      { name: "isYes", type: "bool", internalType: "bool" },
      { name: "tokenAmountIn", type: "uint112", internalType: "uint112" },
      { name: "minCollateralOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "collateralOut", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "swapExactIn",
    inputs: [
      { name: "yesToNo", type: "bool", internalType: "bool" },
      { name: "amountIn", type: "uint256", internalType: "uint256" },
      { name: "minAmountOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "swapExactOut",
    inputs: [
      { name: "yesToNo", type: "bool", internalType: "bool" },
      { name: "amountOut", type: "uint256", internalType: "uint256" },
      { name: "maxAmountIn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "amountIn", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  // Liquidity functions
  {
    type: "function",
    name: "addLiquidity",
    inputs: [
      { name: "collateralAmt", type: "uint256", internalType: "uint256" },
      {
        name: "distributionHint",
        type: "uint256[2]",
        internalType: "uint256[2]",
      },
      { name: "deadline", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "mintAmount", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeLiquidity",
    inputs: [
      { name: "sharesToBurn", type: "uint256", internalType: "uint256" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "minCollateralOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "calcRemoveLiquidity",
    inputs: [
      { name: "sharesToBurn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "yesToReturn", type: "uint256", internalType: "uint256" },
      { name: "noToReturn", type: "uint256", internalType: "uint256" },
      { name: "collateralToReturn", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  // Redeem
  {
    type: "function",
    name: "redeemWinnings",
    inputs: [],
    outputs: [
      { name: "collateralAmount", type: "uint256", internalType: "uint256" },
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
  // Events
  {
    type: "event",
    name: "BuyTokens",
    inputs: [
      {
        name: "buyer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "isYes", type: "bool", indexed: true, internalType: "bool" },
      {
        name: "tokensBought",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "collateralSpent",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "feeAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SellTokens",
    inputs: [
      {
        name: "seller",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "isYes", type: "bool", indexed: true, internalType: "bool" },
      {
        name: "tokensSold",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "collateralReceived",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "feeAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SwapTokens",
    inputs: [
      {
        name: "trader",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "yesToNo", type: "bool", indexed: true, internalType: "bool" },
      {
        name: "amountIn",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amountOut",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "feeAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LiquidityAdded",
    inputs: [
      {
        name: "provider",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "collateralAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "lpTokensMinted",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amounts",
        type: "tuple",
        indexed: false,
        internalType: "struct IPredictionAMM.OutcomeAmounts",
        components: [
          { name: "yesToAdd", type: "uint256", internalType: "uint256" },
          { name: "noToAdd", type: "uint256", internalType: "uint256" },
          { name: "yesToReturn", type: "uint256", internalType: "uint256" },
          { name: "noToReturn", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LiquidityRemoved",
    inputs: [
      {
        name: "provider",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "lpTokensBurned",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "yesTokensReceived",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "noTokensReceived",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "collateralReceived",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WinningsRedeemed",
    inputs: [
      {
        name: "redeemer",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "yesTokensBurned",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "noTokensBurned",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "collateralReceived",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

// Constants
export const AMM_BPS_DENOMINATOR = 1_000_000;
export const AMM_CANDLE_PRICE_SCALE = 1_000_000_000;
export const AMM_ONE = 10n ** 18n;

// Types
export interface AmmHourlyCandle {
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: bigint;
  trades: number;
}

export interface AmmHourlyCandleWithHour {
  hour: number;
  candle: AmmHourlyCandle;
}

export interface AmmMarketInfo {
  creator: `0x${string}`;
  pollAddress: `0x${string}`;
  yesToken: `0x${string}`;
  noToken: `0x${string}`;
  collateralToken: `0x${string}`;
  tradingFee: number;
  protocolFeeRate: number;
  maxPriceImbalancePerHour: number;
  closeTimestamp: number;
}

export interface AmmReserves {
  reserveYes: bigint;
  reserveNo: bigint;
  totalLP: bigint;
  protocolFees: bigint;
  collateralTvl: bigint;
}

// ERC20 ABI for outcome tokens
export const OUTCOME_TOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
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
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
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
