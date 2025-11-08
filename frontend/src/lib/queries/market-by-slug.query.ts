"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "../api";
import { Market } from "@/lib/models/api.models";

export function useMarketBySlugQuery(slug: string | undefined) {
  return useQuery<Market>({
    queryKey: ["market-by-slug", slug],
    queryFn: async () => {
      const response = await fetch(
        `${getBaseUrl()}/markets/search-slug?slug=${encodeURIComponent(slug!)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch market: ${response.statusText}`);
      }

      const data = (await response.json()) as Market;
      console.log(data);
      return data;
    },
    enabled: !!slug && slug.length > 0,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}
