"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api.const";
import type { SearchResponse } from "@/lib/models/api.models";

export function useUserSearchQuery(query: string, enabled: boolean = true) {
  return useQuery<SearchResponse>({
    queryKey: ["user-search", query],
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
        `${getBaseUrl()}/profiles/search?q=${encodeURIComponent(query)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch user search results");
      }

      return res.json();
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 60000, // 1 minute
  });
}
