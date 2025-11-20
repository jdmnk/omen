"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api.const";

type MarketSuggestion = {
  slug: string;
  question: string;
};

export function useMarketAutocompleteQuery(
  query: string,
  enabled: boolean = true
) {
  return useQuery<MarketSuggestion[]>({
    queryKey: ["market-autocomplete", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const res = await fetch(
        `${getBaseUrl()}/markets/autocomplete?q=${encodeURIComponent(
          query
        )}&limit=10`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("Failed to fetch autocomplete suggestions");

      return res.json();
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 30000, // 30 seconds
  });
}
