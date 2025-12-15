/**
 * Polls Cache Utility
 * Two-tier caching: confirmed polls (finalized) and future polls (pending/can change)
 *
 * What is cached:
 * - ONLY epoch numbers (not poll data itself)
 * - Poll data is ALWAYS fetched fresh from blockchain via getPollsByEpochs()
 *
 * Cache is automatically invalidated when:
 * - Contract address changes
 * - Deployment timestamp changes
 * - Cache version changes (after deployment/config update)
 * - Cache expires (based on cacheExpiryMs from config)
 */

import { getContractConfig } from "@/config/contract";

interface PollsCache {
  version: string; // Cache version (invalidate on deployment)
  deploymentTimestamp: number; // Contract deployment timestamp (invalidate if changed)
  lastCheckedEpoch: number;
  confirmedEpochs: number[]; // Epochs with finalized polls (stable, won't change)
  futureEpochs: number[]; // Epochs with pending polls (need revalidation)
  timestamp: number;
}

const CACHE_KEY_PREFIX = "polls-cache-v2-";

export const getPollsCache = (
  contractAddress: string,
  currentVersion: string,
  deploymentTimestamp: number
): PollsCache | null => {
  const config = getContractConfig();
  const key = CACHE_KEY_PREFIX + contractAddress.toLowerCase();
  const cached = localStorage.getItem(key);

  if (!cached) return null;

  try {
    const data = JSON.parse(cached) as PollsCache;

    // Check if cache expired (uses config value)
    if (Date.now() - data.timestamp > config.cacheExpiryMs) {
      console.log("Cache expired, invalidating");
      localStorage.removeItem(key);
      return null;
    }

    // Check if version changed (new deployment)
    if (data.version !== currentVersion) {
      console.log(
        `Cache version mismatch (${data.version} → ${currentVersion}), invalidating`
      );
      localStorage.removeItem(key);
      return null;
    }

    // Check if deployment timestamp changed (contract redeployed)
    if (data.deploymentTimestamp !== deploymentTimestamp) {
      console.log(
        `Deployment timestamp changed (${data.deploymentTimestamp} → ${deploymentTimestamp}), invalidating`
      );
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

export const savePollsCache = (
  contractAddress: string,
  version: string,
  deploymentTimestamp: number,
  lastCheckedEpoch: number,
  confirmedEpochs: number[],
  futureEpochs: number[]
): void => {
  const key = CACHE_KEY_PREFIX + contractAddress.toLowerCase();

  const cache: PollsCache = {
    version,
    deploymentTimestamp,
    lastCheckedEpoch,
    confirmedEpochs: [...new Set(confirmedEpochs)].sort((a, b) => b - a),
    futureEpochs: [...new Set(futureEpochs)].sort((a, b) => b - a),
    timestamp: Date.now(),
  };

  localStorage.setItem(key, JSON.stringify(cache));
};

export const clearPollsCache = (contractAddress: string): void => {
  const key = CACHE_KEY_PREFIX + contractAddress.toLowerCase();
  localStorage.removeItem(key);
};
