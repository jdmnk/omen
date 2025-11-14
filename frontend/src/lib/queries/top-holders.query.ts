"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DATA_API_HOST } from "../api.const";

// Blacklist of wallet addresses to exclude from top holders (same as backend)
const BLACKLISTED_WALLETS: Set<string> = new Set([
  "0xa5ef39c3d3e10d0b270233af41cac69796b12966", // negrisk adapter burn address
]);

export interface TopHolder {
  proxyWallet: string;
  bio: string | null;
  asset: string;
  pseudonym: string | null;
  amount: number;
  displayUsernamePublic: boolean;
  outcomeIndex: number;
  name: string | null;
  profileImage: string | null;
  profileImageOptimized: string | null;
}

function filterBlacklistedWallets(holders: TopHolder[]): TopHolder[] {
  const blacklistNormalized = new Set(
    Array.from(BLACKLISTED_WALLETS).map((addr) => addr.toLowerCase())
  );

  return holders.filter(
    (h) =>
      h.proxyWallet && !blacklistNormalized.has(h.proxyWallet.toLowerCase())
  );
}

export function useTopHoldersQuery(
  conditionId: string,
  minBalance: number = 1,
  limit: number = 500
) {
  return useQuery<TopHolder[]>({
    queryKey: ["top-holders", conditionId, minBalance, limit],
    queryFn: async () => {
      const url = new URL(`${DATA_API_HOST}/holders`);
      url.searchParams.set("market", conditionId);
      url.searchParams.set("minBalance", minBalance.toString());
      url.searchParams.set("limit", limit.toString());

      const res = await fetch(url.toString(), { cache: "no-store" });

      if (!res.ok) {
        throw new Error("Failed to fetch top holders");
      }

      const data = (await res.json()) as Array<{
        token: string;
        holders: TopHolder[];
      }>;

      // Aggregate holders from both YES and NO outcomes
      const combinedHolders: TopHolder[] = [];
      if (data.length > 0) {
        data.forEach((item) => {
          combinedHolders.push(...(item.holders || []));
        });
      }

      // Filter out blacklisted wallets
      return filterBlacklistedWallets(combinedHolders);
    },
    enabled: !!conditionId,
    staleTime: 120000, // 2 minutes
    retry: 3,
    placeholderData: keepPreviousData,
  });
}
