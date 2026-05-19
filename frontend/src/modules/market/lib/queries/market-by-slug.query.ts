"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api.const";
import { Market } from "@/lib/models/api.models";

export function useMarketBySlugQuery(
  slug: string | undefined,
  initialData?: Market | null
) {
  return useQuery<Market>({
    queryKey: ["market-by-slug", slug],
    queryFn: async () => {
      const response = await fetch(
        `${getBaseUrl()}/markets/search-slug?slug=${encodeURIComponent(slug!)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch market: ${response.statusText}`);
      }

      return (await response.json()) as Market;
    },
    enabled: !!slug && slug.length > 0,
    initialData: initialData || undefined,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}
