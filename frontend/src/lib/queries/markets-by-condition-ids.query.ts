"use client";

import { useQuery } from "@tanstack/react-query";
import { Market } from "@/lib/models/api.models";
import { getBaseUrl } from "../api";

export function useMarketsByConditionIdsQuery(
  conditionIds: string[],
  enabled: boolean = true
) {
  return useQuery<Market[]>({
    queryKey: ["markets-by-condition-ids", conditionIds.sort().join(",")],
    queryFn: async () => {
      if (!conditionIds || conditionIds.length === 0) {
        return [];
      }

      // Build query parameters - FastAPI accepts multiple query params with same name
      const params = new URLSearchParams();
      conditionIds.forEach((id) => {
        params.append("condition_ids", id);
      });

      const response = await fetch(
        `${getBaseUrl()}/markets/by-condition-ids?${params.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch markets: ${response.statusText}`
        );
      }

      const data = (await response.json()) as Market[];
      return data;
    },
    enabled: enabled && conditionIds.length > 0,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}

