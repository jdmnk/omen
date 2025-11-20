"use client";

import { useQuery } from "@tanstack/react-query";
import { Market } from "@/lib/models/api.models";
import { getBaseUrl } from "@/lib/api.const";

export function useMarketsByConditionIdsQuery(
  conditionIds: string[],
  enabled: boolean = true
) {
  return useQuery<Market[]>({
    queryKey: ["markets-by-condition-ids", [...conditionIds].sort().join(",")],
    queryFn: async () => {
      if (!conditionIds || conditionIds.length === 0) {
        return [];
      }

      // POST to backend with JSON body to avoid query parsing issues / long URLs
      const response = await fetch(`${getBaseUrl()}/markets/by-condition-ids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition_ids: conditionIds }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch markets: ${response.statusText}`);
      }

      const data = (await response.json()) as Market[];
      return data;
    },
    enabled: enabled && conditionIds.length > 0,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}
