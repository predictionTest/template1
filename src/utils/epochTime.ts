/**
 * Epoch and timestamp utilities for Prediction Oracle
 * Epoch: 5-minute time periods used by the contract for poll scheduling
 */

import { getContractConfig } from "@/config/contract";

/**
 * Convert timestamp to epoch number
 * @param timestamp Unix timestamp in seconds
 * @returns Epoch number
 */
export function timestampToEpoch(timestamp: number): number {
  const config = getContractConfig();
  return Math.floor(timestamp / config.epochLength);
}

/**
 * Convert epoch number to timestamp
 * @param epoch Epoch number
 * @returns Unix timestamp in seconds (start of epoch)
 */
export function epochToTimestamp(epoch: number): number {
  const config = getContractConfig();
  return epoch * config.epochLength;
}

/**
 * Get current epoch number
 * @returns Current epoch number
 */
export function getCurrentEpoch(): number {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  return timestampToEpoch(now);
}

/**
 * Calculate timestamp for a future date/time selected by user
 * User selects time in their local timezone, we need to convert to UTC timestamp
 * @param targetDate Target date/time (from user input)
 * @returns Unix timestamp in seconds
 */
export function calculateTimestamp(targetDate: Date): number {
  return Math.floor(targetDate.getTime() / 1000);
}

/**
 * Calculate Date from epoch number
 * @param epoch Epoch number
 * @returns Date object representing start of epoch
 */
export function epochToDate(epoch: number): Date {
  const timestamp = epochToTimestamp(epoch);
  return new Date(timestamp * 1000);
}

/**
 * Format time difference in human-readable format
 * @param date Target date
 * @returns Human-readable time difference (e.g., "in 2 hours", "in 3 days")
 */
export function formatTimeDifference(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs < 0) {
    const absDiffMs = Math.abs(diffMs);
    const diffMinutes = Math.floor(absDiffMs / 60000);
    const diffHours = Math.floor(absDiffMs / 3600000);
    const diffDays = Math.floor(absDiffMs / 86400000);

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  } else if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
  } else {
    return `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  }
}

/**
 * Format date to readable string with time
 * @param date Date object
 * @returns Formatted date string (e.g., "Nov 18, 2024 15:30")
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Validate that target timestamp is at least one epoch in the future
 * @param timestamp Target timestamp in seconds
 * @returns true if valid, false otherwise
 */
export function validateTargetTimestamp(timestamp: number): boolean {
  const config = getContractConfig();
  const now = Math.floor(Date.now() / 1000);
  const minTimestamp = now + config.epochLength;
  return timestamp >= minTimestamp;
}
