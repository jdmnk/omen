"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "../api";

type SearchMarket = {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  category?: string | null;
  liquidity?: string | null;
  volume?: string | null;
  outcomePrices?: string | null;
  outcomes?: string | null;
  active: boolean;
  closed: boolean;
  icon?: string | null;
  image?: string | null;
};

type SearchEvent = {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  active: boolean;
  closed: boolean;
  liquidity?: number | null;
  volume?: number | null;
  volume24hr?: number | null;
  markets?: SearchMarket[] | null;
};

type SearchResponse = {
  events: SearchEvent[] | null;
  markets: SearchMarket[] | null;
  tags: unknown[] | null;
  profiles: unknown[] | null;
  pagination: unknown | null;
};

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
