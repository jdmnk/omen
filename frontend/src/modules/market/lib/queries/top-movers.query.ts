"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api.const";

export interface TopMover {
  clob_token_id: string;
  question: string;
  slug: string;
  icon: string;
  last_price: number | null;
  price_delta: number | null;
  fetched_at: string;
}

export interface TopMoversResponse {
  movers: TopMover[];
  fetched_at: string;
}

export function useTopMoversQuery(limit: number = 30) {
  return useQuery<TopMoversResponse>({
    queryKey: ["top-movers", limit],
    queryFn: async () => {
      const response = await fetch(
        `${getBaseUrl()}/markets/top-movers?limit=${limit}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch top movers: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}
