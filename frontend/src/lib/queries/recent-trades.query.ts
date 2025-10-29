"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketRecentTrades } from "./fetch/fetch-market-recent-trades";
import { Trade } from "../models/api.models";

export function useRecentTradesQuery(conditionId: string, minAmount?: number) {
  return useQuery<Trade[]>({
    queryKey: ["recent-trades", conditionId, minAmount],
    queryFn: () => fetchMarketRecentTrades(conditionId, minAmount),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // auto-refetch every 30 seconds
  });
}
