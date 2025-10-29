"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPolymarketPositions } from "./fetch/fetch-polymarket-positions";
import { UserPosition } from "../models/api.models";

export function useUserPositionsQuery(userId: string) {
  return useQuery<UserPosition[]>({
    queryKey: ["user-positions", userId],
    queryFn: () => fetchPolymarketPositions(userId),
    staleTime: 60000, // 1 minute
  });
}
