"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TopHolderAnalysis } from "@/lib/models/api.models";
import { getBaseUrl } from "../api";
import type { TopHolder } from "../queries/top-holders.query";

export function useEnrichHoldersQuery(
  holders: TopHolder[] | undefined,
  token1: string,
  token2: string
) {
  return useQuery<TopHolderAnalysis[]>({
    queryKey: ["enrich-holders", holders?.map((h) => h.proxyWallet).join(","), token1, token2],
    queryFn: async () => {
      if (!holders || holders.length === 0) {
        return [];
      }

      const base = getBaseUrl();
      const url = `${base}/markets/enrich-holders`;

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
        throw new Error("Failed to enrich holders");
      }

      const data = (await res.json()) as TopHolderAnalysis[];
      return data ?? [];
    },
    enabled: !!holders && holders.length > 0 && !!token1 && !!token2,
    staleTime: 120000, // 2 minutes
    retry: 3,
    placeholderData: keepPreviousData,
  });
}

