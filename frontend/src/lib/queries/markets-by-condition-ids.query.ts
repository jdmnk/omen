"use client";

import { useQuery } from "@tanstack/react-query";
import { Market } from "@/lib/models/api.models";

const GAMMA_API_HOST = "https://gamma-api.polymarket.com";

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

      // Build query parameters - condition_ids accepts an array
      const params = new URLSearchParams();
      conditionIds.forEach((id) => {
        params.append("condition_ids", id);
      });
      params.append("limit", "100"); // Set a reasonable limit

      const response = await fetch(
        `${GAMMA_API_HOST}/markets?${params.toString()}`,
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

