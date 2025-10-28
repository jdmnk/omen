"use client";

import { useQuery } from "@tanstack/react-query";
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
  fidelity: number = 60
) {
  const query = useQuery<PriceHistoryResponse>({
    queryKey: ["price-history", clobTokenId, interval],
    queryFn: async () => {
      const res = await fetch(
        `${POLYMARKET_CLOB_URL}/prices-history?market=${clobTokenId}&interval=${interval}&fidelity=${fidelity}`
      );
      return res.json();
    },
  });
  return query;
}
