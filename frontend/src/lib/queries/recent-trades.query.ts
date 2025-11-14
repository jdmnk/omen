"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Trade } from "../models/api.models";
import { DATA_API_HOST } from "../api.const";

export function useRecentTradesQuery(
  conditionId?: string,
  minAmount?: number,
  user?: string,
  limit: number = 50
) {
  return useQuery<Trade[]>({
    queryKey: ["recent-trades", conditionId, minAmount, user, limit],
    queryFn: async () => {
      const url = new URL(`${DATA_API_HOST}/trades`);
      if (conditionId) {
        url.searchParams.set("market", conditionId);
      }
      if (user) {
        url.searchParams.set("user", user);
      }
      url.searchParams.set("limit", limit.toString()); // max 10000!
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
    placeholderData: keepPreviousData, // Keep previous data on refetch errors
  });
}
