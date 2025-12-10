import { EthereumClient, w3mConnectors, w3mProvider } from "@web3modal/ethereum";
import { configureChains, createClient } from "wagmi";
import { sepolia } from "wagmi/chains";

import NFT_ABI from "./NFT_ABI.json";
import USDT_ABI from "./USDT_ABI.json";

// Environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "f4252fe8d879bcfadd3c7bfbb829f4a6";
const nftContractAddress = import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '0x508F3368A6CB61e9037A5E73c9F436b558DEABA3';
const usdtContractAddress = import.meta.env.VITE_USDT_CONTRACT_ADDRESS || '0x07F1E75eDdd894C7D153e76b65a758c5e1C58E11';

// Validate required environment variables
if (!projectId) {
  console.error('Missing VITE_WALLETCONNECT_PROJECT_ID in environment variables');
}

export const NFT_ContractConfig = {
  address: nftContractAddress,
  abi: NFT_ABI
};

export const USDT_ContractConfig = {
  address: usdtContractAddress,
  abi: USDT_ABI
};

export { projectId };

// Configure chains and providers
const { provider, chains } = configureChains(
  [sepolia],
  [w3mProvider({ projectId })]
);

export const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 2, chains }),
  provider,
});

export const ethereumClient = new EthereumClient(wagmiClient, chains);

