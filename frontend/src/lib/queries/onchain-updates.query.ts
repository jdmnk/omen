"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "../api";

export interface AncillaryDataUpdate {
  timestamp: number;
  update: string; // hex string with 0x prefix
}

export function useOnchainUpdatesQuery(
  questionId: string | undefined,
  owner: string | undefined
) {
  return useQuery<AncillaryDataUpdate[]>({
    queryKey: ["onchain-updates", questionId, owner],
    queryFn: async () => {
      const url = new URL(`${getBaseUrl()}/onchain/updates`);
      url.searchParams.set("question_id", questionId!);
      url.searchParams.set("owner", owner!);

      const response = await fetch(url.toString(), { cache: "no-store" });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch onchain updates: ${response.statusText}`
        );
      }

      const data = (await response.json()) as AncillaryDataUpdate[];
      return data;
    },
    enabled:
      !!questionId && !!owner && questionId.length > 0 && owner.length > 0,
    retry: 1,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: keepPreviousData,
  });
}
