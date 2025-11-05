"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrderbook, OrderBookResponse } from "./fetch/fetch-orderbook";

export function useOrderbookQuery(tokenId: string, enabled: boolean = true) {
  return useQuery<OrderBookResponse>({
    queryKey: ["orderbook", tokenId],
    queryFn: () => fetchOrderbook(tokenId),
    enabled: enabled && !!tokenId,
    staleTime: 0, // Always consider stale for real-time data
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}
