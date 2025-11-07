"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTopHoldersPositions } from "./fetch/fetch-top-holders-positions";
import { UserPosition } from "@/lib/models/api.models";

export function useTopHoldersPositionsQuery(
  wallets: string[] | undefined,
  positionsPerHolder: number = 100
) {
  return useQuery<Record<string, UserPosition[]>>({
    queryKey: ["top-holders-positions", wallets?.join(","), positionsPerHolder],
    queryFn: () => fetchTopHoldersPositions(wallets!, positionsPerHolder),
    enabled: !!wallets && wallets.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 0, // dont wanna retry not so spam the api
  });
}
