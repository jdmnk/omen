"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTopHolders } from "./fetch/fetch-top-holders";

export function useTopHoldersQuery(conditionId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery<any[]>({
    queryKey: ["top-holders", conditionId],
    queryFn: () => fetchTopHolders(conditionId),
    staleTime: 60000,
    // refetchInterval: 60000,
  });
}
