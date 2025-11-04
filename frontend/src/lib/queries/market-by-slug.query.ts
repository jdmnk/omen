"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketBySlug } from "./fetch/fetch-market-by-slug";
import { MarketResponse } from "@/lib/models/api.models";

export function useMarketBySlugQuery(slug: string | undefined) {
  return useQuery<MarketResponse>({
    queryKey: ["market-by-slug", slug],
    queryFn: () => fetchMarketBySlug(slug!),
    enabled: !!slug && slug.length > 0,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}

