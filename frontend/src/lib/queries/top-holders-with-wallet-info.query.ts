"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTopHoldersWithWalletInfo } from "./fetch/fetch-top-holders-with-wallet-info";
import { TopHolder } from "@/lib/models/api.models";

export function useTopHoldersWithWalletInfoQuery(
  conditionId: string,
  token1: string,
  token2: string
) {
  return useQuery<TopHolder[]>({
    queryKey: ["top-holders-with-wallet-info", conditionId, token1, token2],
    queryFn: () => fetchTopHoldersWithWalletInfo(conditionId, token1, token2),
    enabled: !!conditionId && !!token1 && !!token2,
    staleTime: 60000, // 1 minute
  });
}
