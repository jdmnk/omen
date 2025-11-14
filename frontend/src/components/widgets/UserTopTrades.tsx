"use client";

import React from "react";
import { useRecentTradesInfiniteQuery } from "@/lib/queries/recent-trades.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Trade } from "@/lib/models/api.models";
import InfiniteScroll from "@/components/ui/infinite-scroll";

const TRADE_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(300px,2fr)_minmax(80px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center gap-4";

function TradeRow({ trade }: { trade: Trade }) {
  const size = trade.size || 0;
  const price = trade.price || 0;
  const amount = size * price;

  const sideColor =
    trade.side === "BUY" ? "text-outcome-yes" : "text-outcome-no";

  return (
    <div
      className={cn(
        TRADE_ROW_GRID_CLASSES,
        "py-3 border-b border-border/50 last:border-0 text-sm hover:bg-muted/20"
      )}
    >
      <div className="min-w-0 overflow-hidden">
        <Link
          href={`/market/${trade.slug}`}
          className="block truncate hover:underline font-medium"
        >
          {trade.title}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">
          {trade.outcome}
        </div>
      </div>
      <div className={cn("font-semibold", sideColor)}>{trade.side}</div>
      <div>
        <div className="font-semibold">{formatNumber(size, 0)}</div>
        <div className="text-xs text-muted-foreground">shares</div>
      </div>
      <div>
        <div className="font-semibold">{formatNumber(price * 100, 1)}%</div>
      </div>
      <div>
        <div className="font-semibold">{formatCompactCurrency(amount)}</div>
      </div>
    </div>
  );
}

export function UserTopTrades({ userId }: { userId: string }) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecentTradesInfiniteQuery(undefined, undefined, userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading trades..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Error loading trades
      </div>
    );
  }

  const allTrades = data?.pages.flatMap((page) => page) || [];

  if (allTrades.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No trades found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-4 py-3 bg-muted/20 sticky top-0 z-10">
        <div className={cn(TRADE_ROW_GRID_CLASSES, "text-xs font-bold")}>
          <div>Market</div>
          <div>Side</div>
          <div>Size</div>
          <div>Price</div>
          <div>Amount</div>
        </div>
      </div>
      <div className="px-4">
        <InfiniteScroll
          isLoading={isFetchingNextPage}
          hasMore={!!hasNextPage}
          next={fetchNextPage}
          threshold={0.8}
        >
          {allTrades.map((trade, index) => (
            <TradeRow key={`${trade.transactionHash}-${index}`} trade={trade} />
          ))}
        </InfiniteScroll>
      </div>
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}
      {!hasNextPage && allTrades.length > 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          All {allTrades.length} trades loaded
        </div>
      )}
    </div>
  );
}
