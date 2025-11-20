"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api.const";
import type { TopHolder } from "../queries/top-holders.query";

export interface TopHolderPnl extends TopHolder {
  avgPrice: number | null;
  realizedPnl: number | null;
  totalBought: number | null;
}

export function useTopHoldersPnlQuery(
  holders: TopHolder[] | undefined,
  token1: string,
  token2: string
) {
  return useQuery<TopHolderPnl[]>({
    queryKey: [
      "top-holders-pnl",
      holders?.map((h) => h.proxyWallet).join(","),
      token1,
      token2,
    ],
    queryFn: async () => {
      if (!holders || holders.length === 0) {
        return [];
      }

      const base = getBaseUrl();
      const url = `${base}/markets/top-holders-pnl`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holders,
          token1,
          token2,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch top holders PnL");
      }

      const data = (await res.json()) as TopHolderPnl[];
      return data ?? [];
    },
    enabled: !!holders && holders.length > 0 && !!token1 && !!token2,
    staleTime: 120000, // 2 minutes
    retry: 2,
    placeholderData: keepPreviousData,
  });
}
