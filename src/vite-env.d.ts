/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORACLE_CONTRACT_ADDRESS?: string;
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_DEPLOYMENT_BLOCK?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_RPC_ENDPOINT?: string;
  readonly VITE_BLOCK_EXPLORER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

