import { sonic } from "viem/chains";
import { CollateralToken } from "./abi";

// Collateral tokens configuration
export const COLLATERAL_TOKENS: CollateralToken[] = [
  {
    address: "0xc6020e5492c2892fD63489797ce3d431ae101d5e",
    name: "TEST USD Coin",
    symbol: "USDC",
    decimals: 6,
  },
];

// Enable/disable mock token minting button (for testnet only)
export const ENABLE_MOCK_MINT = true;

// Amount to mint when clicking the mint button (1 million tokens)
export const MOCK_MINT_AMOUNT = 1_000_000;

// Contract configuration for Sonic Network
// Update with your deployed contract address

export const CONTRACT_CONFIG = {
  // Replace with your deployed PredictionOracle contract address on Sonic
  address: "0xf7384f3bB90A465C0f0B688cAB8b3C16bef0778E" as `0x${string}`,

  // Replace with your deployed MarketFactory contract address on Sonic
  marketFactoryAddress:
    "0x017277d36f80422a5d0aA5B8C93f5ae57BA2A317" as `0x${string}`,

  // Timestamp when contract was deployed (no polls exist before this)
  deploymentTimestamp: 1762315400, // Update this with actual deployment timestamp

  // Cache version - increment this after each deployment to invalidate user caches
  // Format: YYYY-MM-DD-N (date + deployment number)
  cacheVersion: "2024-11-18-1",

  // Epoch length in seconds (matches contract EPOCH_LENGTH constant)
  epochLength: 300, // 5 minutes

  // Pending timeout in epochs (matches contract PENDING_TIMEOUT_EPOCHS constant)
  pendingTimeoutEpochs: 5,

  // Arbitration submission window in epochs (matches ARBITRATION_SUBMISSION_WINDOW in PredictionPoll)
  arbitrationSubmissionWindowEpochs: 288,

  // How many epochs forward to scan for polls
  scanFutureEpochs: 20000, // ~70 days at 5 min per epoch

  // Epoch chunk size for scanning (to avoid gas limit)
  chunkSize: 5000,

  // Cache loading: how many epochs to load at once when reading from cache
  // Smaller = safer for gas limits, larger = faster loading
  cacheChunkSize: 100,

  // Retry: minimum chunk size when retrying failed requests
  minRetryChunkSize: 10,

  // Cache expiry time in milliseconds
  // Since we only cache epoch numbers (not poll data), and poll data is always fetched fresh,
  // we can use a very long expiry time
  cacheExpiryMs: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Sonic Network configuration (from viem/chains)
  chainId: sonic.id,
  blockExplorerUrl: sonic.blockExplorers.default.url,
} as const;

// Environment-based configuration
export const getContractConfig = () => {
  const envAddress = import.meta.env.VITE_ORACLE_CONTRACT_ADDRESS;
  const envMarketFactoryAddress = import.meta.env
    .VITE_MARKET_FACTORY_CONTRACT_ADDRESS;
  const envDeploymentTimestamp = import.meta.env.VITE_DEPLOYMENT_TIMESTAMP;
  const envCacheVersion = import.meta.env.VITE_CACHE_VERSION;
  const envScanFutureEpochs = import.meta.env.VITE_SCAN_FUTURE_EPOCHS;
  const envChunkSize = import.meta.env.VITE_CHUNK_SIZE;
  const envCacheChunkSize = import.meta.env.VITE_CACHE_CHUNK_SIZE;
  const envMinRetryChunkSize = import.meta.env.VITE_MIN_RETRY_CHUNK_SIZE;
  const envEpochLength = import.meta.env.VITE_EPOCH_LENGTH;
  const envCacheExpiryMs = import.meta.env.VITE_CACHE_EXPIRY_MS;
  const envPendingTimeoutEpochs = import.meta.env.VITE_PENDING_TIMEOUT_EPOCHS;
  const envArbitrationSubmissionWindowEpochs = import.meta.env
    .VITE_ARBITRATION_SUBMISSION_WINDOW_EPOCHS;

  const chunkSize = envChunkSize
    ? parseInt(envChunkSize)
    : CONTRACT_CONFIG.chunkSize;

  return {
    address: (envAddress || CONTRACT_CONFIG.address) as `0x${string}`,
    marketFactoryAddress: (envMarketFactoryAddress ||
      CONTRACT_CONFIG.marketFactoryAddress) as `0x${string}`,
    deploymentTimestamp: envDeploymentTimestamp
      ? parseInt(envDeploymentTimestamp)
      : CONTRACT_CONFIG.deploymentTimestamp,
    cacheVersion: envCacheVersion || CONTRACT_CONFIG.cacheVersion,
    scanFutureEpochs: envScanFutureEpochs
      ? parseInt(envScanFutureEpochs)
      : CONTRACT_CONFIG.scanFutureEpochs,
    chunkSize,
    cacheChunkSize: envCacheChunkSize
      ? parseInt(envCacheChunkSize)
      : CONTRACT_CONFIG.cacheChunkSize,
    minRetryChunkSize: envMinRetryChunkSize
      ? parseInt(envMinRetryChunkSize)
      : CONTRACT_CONFIG.minRetryChunkSize,
    epochLength: envEpochLength
      ? parseInt(envEpochLength)
      : CONTRACT_CONFIG.epochLength,
    cacheExpiryMs: envCacheExpiryMs
      ? parseInt(envCacheExpiryMs)
      : CONTRACT_CONFIG.cacheExpiryMs,
    pendingTimeoutEpochs: envPendingTimeoutEpochs
      ? parseInt(envPendingTimeoutEpochs)
      : CONTRACT_CONFIG.pendingTimeoutEpochs,
    arbitrationSubmissionWindowEpochs: envArbitrationSubmissionWindowEpochs
      ? parseInt(envArbitrationSubmissionWindowEpochs)
      : CONTRACT_CONFIG.arbitrationSubmissionWindowEpochs,
    chainId: sonic.id,
    blockExplorerUrl: sonic.blockExplorers.default.url,
  };
};
