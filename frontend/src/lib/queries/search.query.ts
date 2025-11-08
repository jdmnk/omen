"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "../api";
import type { SearchResponse } from "../models/api.models";

export function useMarketSearchQuery(query: string, enabled: boolean = true) {
  return useQuery<SearchResponse>({
    queryKey: ["market-search", query],
    queryFn: async () => {
      if (!query.trim()) {
        return {
          events: null,
          markets: null,
          tags: null,
          profiles: null,
          pagination: null,
        };
      }

      const res = await fetch(
        `${getBaseUrl()}/markets/search?q=${encodeURIComponent(query)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch search results");
      }

      return res.json();
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 300000, // 5 minutes
  });
}
