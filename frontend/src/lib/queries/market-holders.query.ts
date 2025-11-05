"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketHolders } from "./fetch/fetch-market-holders";
import { MarketHoldersResponse } from "@/lib/models/api.models";

export function useMarketHoldersQuery(
  conditionId: string,
  limit: number = 100,
  minBalance: number = 1
) {
  return useQuery<MarketHoldersResponse>({
    queryKey: ["market-holders", conditionId, limit, minBalance],
    queryFn: () => fetchMarketHolders(conditionId, limit, minBalance),
    enabled: !!conditionId,
    staleTime: 60000, // 1 minute
  });
}

