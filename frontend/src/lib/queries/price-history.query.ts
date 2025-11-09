"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { POLYMARKET_CLOB_URL } from "../api";
import { Interval } from "../models/api.models";

type PriceHistoryResponse = {
  history: PriceHistoryPoint[];
};

export type PriceHistoryPoint = {
  t: number; // unix timestamp in seconds
  p: number; // price in USDC
};

export function usePriceHistoryQuery(
  clobTokenId: string,
  interval: Interval,
  fidelity: number
) {
  const query = useQuery<PriceHistoryResponse>({
    queryKey: ["price-history", clobTokenId, interval, fidelity],
    queryFn: async () => {
      const res = await fetch(
        `${POLYMARKET_CLOB_URL}/prices-history?market=${clobTokenId}&interval=${interval}&fidelity=${fidelity}`
      );

      if (!res.ok) {
        throw new Error(
          `Failed to fetch price history: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();
      return data;
    },
    retry: 1,
    staleTime: 60000, // 1 minute
    placeholderData: keepPreviousData, // Keep previous data on refetch errors
  });
  return query;
}
