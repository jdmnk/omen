"use client";

import { useEffect, useRef } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useOrderbookQuery } from "@/lib/queries/orderbook.query";
import { formatCurrency, formatNumber } from "@/lib/ui/format.utils";

type OrderBookProps = {
  tokenId: string;
};

export function OrderBook({ tokenId }: OrderBookProps) {
  const { data, isLoading, error } = useOrderbookQuery(tokenId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const midpointRef = useRef<HTMLDivElement>(null);

  // Scroll to center the spread/midpoint when data loads
  useEffect(() => {
    if (midpointRef.current && data) {
      midpointRef.current.scrollIntoView({
        behavior: "auto",
        block: "center",
      });
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
      <div className="flex items-center justify-center h-full text-destructive text-xs">
        Error loading orderbook
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No orderbook data
      </div>
    );
  }

  // Use pre-calculated values from query result
  const { sortedBids, sortedAsks, spread, midpointPrice } = data;

  return (
    <div className="flex flex-col px-3">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 grid grid-cols-3 gap-4 text-xs text-muted-foreground pb-2 border-b border-border shrink-0">
        <div className="text-left">Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Scrollable container */}
      <div ref={scrollContainerRef} className="overflow-y-auto py-2">
        <div className="flex flex-col">
          {/* Asks (Sell orders) - shown above midpoint */}
          <div className="space-y-0">
            {sortedAsks.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
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
                    className="grid grid-cols-3 gap-4 py-1 text-xs hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-left text-rose-500 font-medium">
                      {formatNumber(price, 4)}
                    </div>
                    <div className="text-right">{formatNumber(size, 1)}</div>
                    <div className="text-right text-muted-foreground">
                      {formatCurrency(cumulativeTotal, 1)}
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
              <div className="grid grid-cols-3 gap-4 text-xs">
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
              <div className="text-center py-4 text-xs text-muted-foreground">
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
                    className="grid grid-cols-3 gap-4 py-1 text-xs hover:bg-muted/50 transition-colors"
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
