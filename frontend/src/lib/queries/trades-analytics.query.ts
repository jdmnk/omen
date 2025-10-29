"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketTradesAnalytics } from "./fetch/fetch-market-trades-analytics";
import { UserHoldingsSummary } from "../models/api.models";

export function useTradesAnalyticsQuery(conditionId: string) {
  return useQuery<UserHoldingsSummary[]>({
    queryKey: ["trades-analytics", conditionId],
    queryFn: () => fetchMarketTradesAnalytics(conditionId),
    staleTime: 60000,
    refetchInterval: 60000,
  });
}
