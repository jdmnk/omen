"use client";

import { useEffect, useRef } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useOrderbookQuery } from "@/lib/queries/orderbook.query";
import { formatNumber } from "@/lib/ui/format.utils";

type OrderBookProps = {
  tokenId: string;
};

export function OrderBook({ tokenId }: OrderBookProps) {
  const { data, isLoading, error } = useOrderbookQuery(tokenId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const midpointRef = useRef<HTMLDivElement>(null);

  // Scroll to show 6 levels on each side on mount and when data changes
  useEffect(() => {
    if (scrollContainerRef.current && midpointRef.current && data) {
      const container = scrollContainerRef.current;
      const midpoint = midpointRef.current;

      // Calculate scroll position to show 6 levels above and below midpoint
      // We'll estimate row height (approximately 32px with padding)
      const rowHeight = 32;
      const levelsToShow = 6;
      const offsetToShow = levelsToShow * rowHeight;

      // Position scroll so midpoint is visible with 6 levels above it
      const midpointTop = midpoint.offsetTop;
      const scrollPosition = midpointTop - offsetToShow;

      container.scrollTop = Math.max(0, scrollPosition);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <LoadingSpinner message="Loading orderbook..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive text-sm">
        Error loading orderbook
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No orderbook data
      </div>
    );
  }

  // Sort bids descending (highest first) and asks ascending (lowest first)
  const sortedBids = [...data.bids]
    .sort((a, b) => Number(b.price) - Number(a.price))
    .slice(0, 50); // Show more levels for scrolling
  const sortedAsksAscending = [...data.asks]
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, 50); // Show more levels for scrolling

  // Reverse asks so highest are closest to midpoint
  const sortedAsks = [...sortedAsksAscending].reverse();

  // Calculate best bid and ask for spread (using original sorted order)
  const bestBid = sortedBids.length > 0 ? Number(sortedBids[0].price) : 0;
  const bestAsk =
    sortedAsksAscending.length > 0 ? Number(sortedAsksAscending[0].price) : 0;

  const spread = bestBid > 0 && bestAsk > 0 ? bestAsk - bestBid : 0;
  const midpointPrice =
    bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : 0;

  const LEVELS_TO_SHOW = 6;
  // Estimate: ~32px per row, ~60px for midpoint
  // Show 6 asks + midpoint + 6 bids = 6*32 + 60 + 6*32 = 252px
  const visibleHeight = LEVELS_TO_SHOW * 32 + 60 + LEVELS_TO_SHOW * 32;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pb-2 border-b border-border shrink-0">
        <div className="text-left">Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Scrollable container - shows exactly 6 levels + midpoint */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto"
        style={{ height: `${visibleHeight}px` }}
      >
        <div className="flex flex-col">
          {/* Asks (Sell orders) - shown above midpoint */}
          <div className="space-y-0">
            {sortedAsks.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No asks
              </div>
            ) : (
              sortedAsks.map((ask, index) => {
                const price = Number(ask.price);
                const size = Number(ask.size);

                // Calculate cumulative total from this level down to midpoint
                const cumulativeTotal = sortedAsks
                  .slice(index)
                  .reduce(
                    (sum, a) => sum + Number(a.price) * Number(a.size),
                    0
                  );

                return (
                  <div
                    key={`ask-${index}`}
                    className="grid grid-cols-3 gap-4 py-1 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-left text-rose-500 font-medium">
                      {formatNumber(price, 4)}
                    </div>
                    <div className="text-right">{formatNumber(size, 2)}</div>
                    <div className="text-right text-muted-foreground">
                      {formatNumber(cumulativeTotal, 2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Midpoint/Spread - centered */}
          {sortedBids.length > 0 && sortedAsks.length > 0 && (
            <div
              ref={midpointRef}
              className="py-1 border-y border-border bg-muted/30 shrink-0"
            >
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-left font-semibold">
                  {formatNumber(midpointPrice, 4)}
                </div>
                <div className="text-right text-muted-foreground">Spread</div>
                <div className="text-right font-semibold">
                  {formatNumber(spread, 4)}
                </div>
              </div>
            </div>
          )}

          {/* Bids (Buy orders) - shown below midpoint */}
          <div className="space-y-0">
            {sortedBids.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No bids
              </div>
            ) : (
              sortedBids.map((bid, index) => {
                const price = Number(bid.price);
                const size = Number(bid.size);

                // Calculate cumulative total from this level up to midpoint
                const cumulativeTotal = sortedBids
                  .slice(0, index + 1)
                  .reduce(
                    (sum, b) => sum + Number(b.price) * Number(b.size),
                    0
                  );

                return (
                  <div
                    key={`bid-${index}`}
                    className="grid grid-cols-3 gap-4 py-1 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-left text-emerald-500 font-medium">
                      {formatNumber(price, 4)}
                    </div>
                    <div className="text-right">{formatNumber(size, 2)}</div>
                    <div className="text-right text-muted-foreground">
                      {formatNumber(cumulativeTotal, 2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
