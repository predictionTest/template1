import { useContext } from "react";
import { MarketsContext } from "@/context/MarketsContext";

export const useMarkets = () => {
  const ctx = useContext(MarketsContext);
  if (!ctx) {
    throw new Error("useMarkets must be used within MarketsProvider");
  }
  return ctx;
};



