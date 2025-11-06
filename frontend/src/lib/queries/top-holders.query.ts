"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTopHolders } from "./fetch/fetch-top-holders";
import { TopHolder } from "@/lib/models/api.models";

export function useTopHoldersQuery(
  conditionId: string,
  token1: string,
  token2: string
) {
  return useQuery<TopHolder[]>({
    queryKey: ["top-holders", conditionId, token1, token2],
    queryFn: () => fetchTopHolders(conditionId, token1, token2),
    enabled: !!conditionId && !!token1 && !!token2,
    staleTime: 120000, // 2 minutes
    retry: 3,
  });
}
