"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { useMarketsByConditionIdsQuery } from "@/lib/queries/markets-by-condition-ids.query";
import { Market } from "@/lib/models/api.models";
import { cn } from "@/lib/utils";
import { WatchlistButton } from "./WatchlistButton";

const INITIAL_LIMIT = 10;

export function WatchlistWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { watchlist, getConditionIds } = useWatchlist();

  // Get conditionIds from watchlist items (filter out empty ones from migrated data)
  const conditionIds = useMemo(() => {
    return getConditionIds().filter((id) => id && id.length > 0);
  }, [getConditionIds]);

  // Fetch watchlisted markets by conditionIds
  const { data: fetchedMarkets } = useMarketsByConditionIdsQuery(
    conditionIds,
    false // disable for now (dont need extra data) conditionIds.length > 0
  );

  // Merge watchlist items with fetched market data
  // Show watchlist items immediately (using stored title) even before API loads
  const watchlistedMarkets = useMemo(() => {
    // Create a map of fetched markets by conditionId for quick lookup
    const fetchedMarketsMap = new Map<string, Market>();
    if (fetchedMarkets) {
      fetchedMarkets.forEach((market) => {
        fetchedMarketsMap.set(market.conditionId, market);
      });
    }

    return watchlist.map((item) => {
      const fetchedMarket = fetchedMarketsMap.get(item.conditionId);

      // Use fetched market data if available, otherwise use stored watchlist item data
      if (fetchedMarket) {
        return {
          question: fetchedMarket.question || item.title,
          slug: fetchedMarket.slug || item.slug,
        };
      } else {
        // Use stored data for immediate display before API loads
        return {
          question: item.title,
          slug: item.slug,
        };
      }
    });
  }, [watchlist, fetchedMarkets]);

  if (watchlistedMarkets.length === 0) {
    return null;
  }

  const displayItems = isExpanded
    ? watchlistedMarkets
    : watchlistedMarkets.slice(0, INITIAL_LIMIT);
  const hasMore = watchlistedMarkets.length > INITIAL_LIMIT;
  const remainingCount = watchlistedMarkets.length - INITIAL_LIMIT;

  return (
    <div>
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1 text-xs text-brand-foreground hover:text-brand-foreground/80 transition-colors cursor-pointer"
      >
        <span>Watchlist ({watchlistedMarkets.length})</span>
        {hasMore && (
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <>
                <span className="text-xs">Show less</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span className="text-xs">Show {remainingCount} more</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </div>
        )}
      </button>

      {/* Watchlist Items */}
      <div className="space-y-1">
        {displayItems.map((market, index) => {
          // Find the corresponding watchlist item for unwatchlist
          const watchlistItem = watchlist.find(
            (item) => item.slug === market.slug
          );

          if (!watchlistItem) return null;

          return (
            <Link
              key={`${market.slug}-${index}`}
              href={`/market/${market.slug}`}
              className={cn(
                "w-full text-left px-3 py-2 text-xs block",
                "transition-colors",
                "hover:bg-brand-background cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex gap-3 items-center">
                {/* Star Icon - Clickable to unwatchlist */}
                <WatchlistButton
                  slug={watchlistItem.slug}
                  conditionId={watchlistItem.conditionId}
                  title={watchlistItem.title}
                  className="shrink-0"
                />

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {market.question || "Loading..."}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
