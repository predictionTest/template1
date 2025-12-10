// Contract constants
export const MAX_NFT_PER_TX = 20;
export const NFT_PRICE_USDT = 1000;
export const MIN_CLAIM_AMOUNT = 1;

// Network constants
export const SEPOLIA_CHAIN_ID = 11155111;
export const ETHEREUM_CHAIN_ID = 1;

// Staking constants
export const STAKING_APY = 25;
export const REWARD_RATE_PER_DAY = 0.0685; // ~25% APY
export const MIN_STAKE_AMOUNT = 1;
export const UNSTAKE_COOLDOWN_DAYS = 7;

// UI constants
export const PAGINATION_LIMIT = 12;
export const TRANSACTION_HISTORY_LIMIT = 50;
export const REFRESH_INTERVAL = 30000; // 30 seconds

// Error messages
export const ERROR_MESSAGES = {
    WALLET_NOT_CONNECTED: 'Please connect your wallet',
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    INVALID_AMOUNT: 'Invalid amount',
    TRANSACTION_REJECTED: 'Transaction was rejected',
    NETWORK_ERROR: 'Network error occurred',
    CONTRACT_ERROR: 'Contract interaction failed',
    SUPPLY_EXCEEDED: 'Available supply exceeded',
    ZERO_AMOUNT: 'Amount must be greater than zero',
};

// Success messages
export const SUCCESS_MESSAGES = {
    TRANSACTION_CONFIRMED: 'Transaction confirmed successfully',
    NFT_MINTED: 'NFTs minted successfully',
    NFT_STAKED: 'NFTs staked successfully',
    NFT_UNSTAKED: 'NFTs unstaked successfully',
    REWARDS_CLAIMED: 'Rewards claimed successfully',
    APPROVAL_SUCCESS: 'Approval successful',
};

// Transaction types
export const TX_TYPES = {
    MINT: 'mint',
    STAKE: 'stake',
    UNSTAKE: 'unstake',
    CLAIM: 'claim',
    TRANSFER: 'transfer',
    APPROVE: 'approve',
};

// Status types
export const STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending',
};

// Local storage keys
export const STORAGE_KEYS = {
    THEME: 'app_theme',
    LANGUAGE: 'app_language',
    RECENT_TX: 'recent_transactions',
    USER_PREFERENCES: 'user_preferences',
};

// API endpoints (if you add backend)
export const API_ENDPOINTS = {
    STATS: '/api/stats',
    TRANSACTIONS: '/api/transactions',
    PRICES: '/api/prices',
    ANALYTICS: '/api/analytics',
};

// Chart colors
export const CHART_COLORS = {
    PRIMARY: '#3b82f6',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
    INFO: '#8b5cf6',
};

