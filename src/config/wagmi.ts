import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sonic } from "viem/chains";
import { http } from "viem";

// Get WalletConnect project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

if (!projectId) {
  console.warn(
    "⚠️ WalletConnect Project ID not found. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file"
  );
}

// Get custom RPC endpoint from environment (optional)
const customRpcUrl = import.meta.env.VITE_RPC_ENDPOINT;

// Configure with Sonic network (built-in from viem/chains)
export const config = getDefaultConfig({
  appName: "Prediction Oracle",
  projectId,
  chains: [sonic],
  // Use custom RPC if provided, otherwise use default from sonic chain
  transports: customRpcUrl
    ? {
        [sonic.id]: http(customRpcUrl, {
          timeout: 30_000, // 30 seconds max for RPC requests
          retryCount: 3, // 3 retry attempts
          retryDelay: 150, // 150ms between retries
        }),
      }
    : undefined,
  ssr: false,
});
