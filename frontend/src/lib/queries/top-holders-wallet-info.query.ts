"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "../api";
import type { TopHolder } from "../queries/top-holders.query";

export interface TopHolderWalletInfo extends TopHolder {
  walletCreatedAt: string | null;
  walletLastTransfer: string | null;
  walletBalance: number | null;
}

export function useTopHoldersWalletInfoQuery(
  holders: TopHolder[] | undefined,
  enabled: boolean = true
) {
  return useQuery<TopHolderWalletInfo[]>({
    queryKey: [
      "top-holders-wallet-info",
      holders?.map((h) => h.proxyWallet).join(","),
    ],
    queryFn: async () => {
      if (!holders || holders.length === 0) {
        return [];
      }

      const base = getBaseUrl();
      const url = `${base}/markets/top-holders-wallet-info`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holders,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch top holders wallet info");
      }

      const data = (await res.json()) as TopHolderWalletInfo[];
      return data ?? [];
    },
    enabled: enabled && !!holders && holders.length > 0,
    staleTime: 120000, // 2 minutes
    retry: 2,
    placeholderData: keepPreviousData,
  });
}
