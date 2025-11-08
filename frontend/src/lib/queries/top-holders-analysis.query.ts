"use client";

import { useQuery } from "@tanstack/react-query";
import { TopHolderAnalysis } from "@/lib/models/api.models";
import { getBaseUrl } from "../api";

export function useTopHoldersAnalysisQuery(
  conditionId: string,
  token1: string,
  token2: string
) {
  return useQuery<TopHolderAnalysis[]>({
    queryKey: ["top-holders-analysis", conditionId, token1, token2],
    queryFn: async () => {
      const base = getBaseUrl();
      const url = new URL(`${base}/markets/top-holders-analysis`);
      url.searchParams.set("condition_id", conditionId);
      url.searchParams.set("token1", token1);
      url.searchParams.set("token2", token2);

      const res = await fetch(url.toString(), { cache: "no-store" });

      if (!res.ok) {
        throw new Error("Failed to fetch top holders with wallet info");
      }

      const data = (await res.json()) as TopHolderAnalysis[];
      return data ?? [];
    },
    enabled: !!conditionId && !!token1 && !!token2,
    staleTime: 120000, // 2 minutes
    retry: 3,
  });
}
