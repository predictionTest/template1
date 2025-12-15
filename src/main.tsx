import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
  type Theme,
} from "@rainbow-me/rainbowkit";
import { config } from "./config/wagmi";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { PollsProvider } from "./context/PollsContext";
import { MarketsProvider } from "./context/MarketsContext";
import { PositionsProvider } from "./context/PositionsContext";
import App from "./App";
import "./index.css";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

// Custom RainbowKit theme matching our design
const customDarkTheme: Theme = {
  ...darkTheme(),
  colors: {
    ...darkTheme().colors,
    accentColor: "#3b82f6", // blue-500
    accentColorForeground: "#ffffff",
    connectButtonBackground: "#1e293b", // slate-800
    connectButtonBackgroundError: "#ef4444",
    connectButtonInnerBackground: "#334155", // slate-700
    connectButtonText: "#f1f5f9", // slate-100
    connectButtonTextError: "#ffffff",
    modalBackground: "#1e293b",
    modalBorder: "#334155",
    modalText: "#f1f5f9",
    modalTextSecondary: "#94a3b8",
    profileForeground: "#1e293b",
    selectedOptionBorder: "#3b82f6",
  },
  radii: {
    ...darkTheme().radii,
    connectButton: "12px",
    modal: "16px",
    menuButton: "12px",
  },
  shadows: {
    ...darkTheme().shadows,
    connectButton: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
};

const customLightTheme: Theme = {
  ...lightTheme(),
  colors: {
    ...lightTheme().colors,
    accentColor: "#2563eb", // blue-600
    accentColorForeground: "#ffffff",
    connectButtonBackground: "#ffffff",
    connectButtonBackgroundError: "#ef4444",
    connectButtonInnerBackground: "#f1f5f9", // slate-100
    connectButtonText: "#1e293b", // slate-800
    connectButtonTextError: "#ffffff",
    modalBackground: "#ffffff",
    modalBorder: "#e2e8f0", // slate-200
    modalText: "#1e293b",
    modalTextSecondary: "#64748b",
    profileForeground: "#ffffff",
    selectedOptionBorder: "#2563eb",
  },
  radii: {
    ...lightTheme().radii,
    connectButton: "12px",
    modal: "16px",
    menuButton: "12px",
  },
  shadows: {
    ...lightTheme().shadows,
    connectButton: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
};

// Wrapper component to use theme context
const RainbowKitWithTheme = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  return (
    <RainbowKitProvider
      theme={theme === "dark" ? customDarkTheme : customLightTheme}
      modalSize="compact"
    >
      {children}
    </RainbowKitProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWithTheme>
            <PollsProvider>
              <MarketsProvider>
                <PositionsProvider>
                  <App />
                </PositionsProvider>
              </MarketsProvider>
            </PollsProvider>
          </RainbowKitWithTheme>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </React.StrictMode>
);
