"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchMarketSearch,
  SearchParams,
  SearchResponse,
} from "./fetch/fetch-market-search";

export function useMarketSearchQuery(
  params: SearchParams,
  enabled: boolean = true
) {
  return useQuery<SearchResponse>({
    queryKey: ["market-search", params],
    queryFn: () => fetchMarketSearch(params),
    enabled: enabled && params.q.trim().length > 0,
  });
}
