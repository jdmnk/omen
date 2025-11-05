"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTopHoldersWithWalletInfo } from "./fetch/fetch-top-holders-with-wallet-info";
import { TopHolder } from "@/lib/models/api.models";

export function useTopHoldersWithWalletInfoQuery(
  conditionId: string,
  minBalance: number = 1,
  limit: number = 500
) {
  return useQuery<TopHolder[]>({
    queryKey: ["top-holders-with-wallet-info", conditionId, minBalance, limit],
    queryFn: () => fetchTopHoldersWithWalletInfo(conditionId, minBalance, limit),
    enabled: !!conditionId,
    staleTime: 60000, // 1 minute
  });
}

