"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchOrderbook,
  OrderBookLevel,
  OrderBookResponse,
} from "./fetch/fetch-orderbook";

export type OrderBookViewModel = {
  sortedBids: OrderBookLevel[];
  sortedAsks: OrderBookLevel[];
  bestBid: number;
  bestAsk: number;
  spread: number;
  midpointPrice: number;
};

export type OrderBookQueryResult = OrderBookResponse & OrderBookViewModel;

function calculateOrderBookViewModel(
  data: OrderBookResponse
): OrderBookViewModel {
  // Sort bids descending (highest first) and asks ascending (lowest first)
  const sortedBids = [...data.bids]
    .sort((a, b) => Number(b.price) - Number(a.price))
    .slice(0, 50); // Show more levels for scrolling
  const sortedAsksAscending = [...data.asks]
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, 50); // Show more levels for scrolling

  // Reverse asks so highest are closest to midpoint
  const sortedAsks = [...sortedAsksAscending].reverse();

  // Calculate best bid and ask for spread (using original sorted order)
  const bestBid = sortedBids.length > 0 ? Number(sortedBids[0].price) : 0;
  const bestAsk =
    sortedAsksAscending.length > 0 ? Number(sortedAsksAscending[0].price) : 0;

  const spread = bestBid > 0 && bestAsk > 0 ? bestAsk - bestBid : 0;
  const midpointPrice =
    bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : 0;

  return {
    sortedBids,
    sortedAsks,
    bestBid,
    bestAsk,
    spread,
    midpointPrice,
  };
}

export function useOrderbookQuery(tokenId: string, enabled: boolean = true) {
  return useQuery<OrderBookQueryResult>({
    queryKey: ["orderbook", tokenId],
    queryFn: async () => {
      const data = await fetchOrderbook(tokenId);
      const viewModel = calculateOrderBookViewModel(data);
      return {
        ...data,
        ...viewModel,
      };
    },
    enabled: enabled && !!tokenId,
    staleTime: 0, // Always consider stale for real-time data
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1,
    placeholderData: keepPreviousData,
  });
}
