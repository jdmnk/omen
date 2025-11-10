"use client";

import { useMemo, useState } from "react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { useMarketsByConditionIdsQuery } from "@/lib/queries/markets-by-condition-ids.query";
import { Market } from "@/lib/models/api.models";
import { formatNumber, formatCompactCurrency } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { parseOutcomePrice, parseVolume } from "@/lib/api-parse.utils";

const INITIAL_LIMIT = 10;

function renderVolumeValue(volume: number) {
  if (volume <= 0) return undefined;
  return (
    <span>
      vol <span className="font-bold">{formatCompactCurrency(volume, 0)}</span>
    </span>
  );
}

function renderOddsValue(odds: number | null) {
  if (odds === null || odds <= 0) return undefined;
  return (
    <span className="text-outcome-neutral">
      p <span className="font-bold">{formatNumber(odds * 100, 1)}%</span>
    </span>
  );
}

export function WatchlistWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();
  const { watchlist, getConditionIds, toggleWatchlist } = useWatchlist();

  // Get conditionIds from watchlist items (filter out empty ones from migrated data)
  const conditionIds = useMemo(() => {
    return getConditionIds().filter((id) => id && id.length > 0);
  }, [getConditionIds]);

  // Fetch watchlisted markets by conditionIds
  const { data: fetchedMarkets, isLoading } = useMarketsByConditionIdsQuery(
    conditionIds,
    conditionIds.length > 0
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
          conditionId: fetchedMarket.conditionId,
          slug: fetchedMarket.slug || item.slug,
          icon: fetchedMarket.icon,
          image: fetchedMarket.image,
          displayImage: fetchedMarket.image || fetchedMarket.icon,
          outcomePrices: fetchedMarket.outcomePrices,
          volume: fetchedMarket.volume,
          odds: fetchedMarket.bestAsk - fetchedMarket.bestBid,
          closed: fetchedMarket.closed,
        };
      } else {
        // Use stored data for immediate display before API loads
        return {
          question: item.title,
          conditionId: item.conditionId,
          slug: item.slug,
          icon: null,
          image: null,
          displayImage: null,
          outcomePrices: null,
          volume: 0,
          odds: null,
          closed: false,
        };
      }
    });
  }, [watchlist, fetchedMarkets]);

  const handleSelectMarket = (slug: string) => {
    router.push(`/market/${slug}`);
  };

  const handleUnwatchlist = (
    e: React.MouseEvent,
    item: { slug: string; conditionId: string; title: string }
  ) => {
    e.stopPropagation();
    toggleWatchlist(item);
  };

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
          const odds = market.outcomePrices
            ? parseOutcomePrice(market.outcomePrices)
            : market.odds;
          const volume = market.volume || 0;

          // Find the corresponding watchlist item for unwatchlist
          const watchlistItem = watchlist.find(
            (item) => item.slug === market.slug
          );

          return (
            <button
              key={`${market.slug}-${index}`}
              onClick={() => handleSelectMarket(market.slug)}
              className={cn(
                "w-full text-left px-3 py-2 text-xs",
                "transition-colors",
                "hover:bg-brand-background cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Star Icon - Clickable to unwatchlist */}
                <button
                  onClick={(e) =>
                    watchlistItem && handleUnwatchlist(e, watchlistItem)
                  }
                  className={cn(
                    "shrink-0 mt-0.5 transition-all duration-200",
                    "hover:scale-110 active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  )}
                  aria-label="Remove from watchlist"
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="font-medium truncate mb-1">
                    {market.question || "Loading..."}
                  </div>

                  {/* Values */}
                  {(renderOddsValue(odds) || renderVolumeValue(volume)) && (
                    <div className="grid items-center gap-3 text-xs text-muted-foreground w-full grid-cols-[80px_1fr]">
                      <div>{renderOddsValue(odds)}</div>
                      <div>{renderVolumeValue(volume)}</div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
