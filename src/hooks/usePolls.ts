import { useContext } from "react";
import { PollsContext } from "@/context/PollsContext";

export const usePolls = () => {
  const ctx = useContext(PollsContext);
  if (!ctx) {
    throw new Error("usePolls must be used within PollsProvider");
  }
  return ctx;
};


