"use client";

import { useQuery } from "@tanstack/react-query";

export type UserPnlPoint = {
  t: number; // timestamp
  p: number; // pnl value
};

// API interval values: 'max', 'all', '1m', '1w', '1d', '12h', '6h'
// API fidelity values: '1d', '18h', '12h', '3h', '1h'
export type UserPnlInterval = "12h" | "1d" | "1w" | "1m" | "max";

const INTERVAL_FIDELITY: Record<UserPnlInterval, string> = {
  "12h": "1h",
  "1d": "1h",
  "1w": "3h",
  "1m": "12h",
  max: "1d",
};

export function useUserPnlQuery(
  userAddress: string,
  interval: UserPnlInterval = "1m"
) {
  return useQuery<UserPnlPoint[]>({
    queryKey: ["user-pnl", userAddress, interval],
    queryFn: async () => {
      const fidelity = INTERVAL_FIDELITY[interval];
      const url = new URL("https://user-pnl-api.polymarket.com/user-pnl");
      url.searchParams.set("user_address", userAddress);
      url.searchParams.set("interval", interval);
      url.searchParams.set("fidelity", fidelity);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch user PnL: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
}
