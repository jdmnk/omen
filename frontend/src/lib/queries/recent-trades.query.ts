"use client";

import { useQuery } from "@tanstack/react-query";
import { Trade } from "../models/api.models";
import { DATA_API_HOST } from "../api";

export function useRecentTradesQuery(conditionId: string, minAmount?: number) {
  return useQuery<Trade[]>({
    queryKey: ["recent-trades", conditionId, minAmount],
    queryFn: async () => {
      const url = new URL(`${DATA_API_HOST}/trades`);
      url.searchParams.set("market", conditionId);
      url.searchParams.set("limit", "50"); // max 10000!
      url.searchParams.set("offset", "0");
      url.searchParams.set("filterType", "CASH");
      url.searchParams.set("filterAmount", (minAmount || 10).toString());
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    staleTime: 30000, // 30 seconds
    // refetchInterval: 30000, // auto-refetch every 30 seconds
  });
}
