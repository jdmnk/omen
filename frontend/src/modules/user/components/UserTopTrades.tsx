"use client";

import React from "react";
import { useRecentTradesInfiniteQuery } from "@/lib/queries/recent-trades.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import {
  formatCompactCurrency,
  formatNumber,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Trade } from "@/lib/models/api.models";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "../../../components/widgets/shared-table-styles";

const TRADE_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(220px,2fr)_minmax(80px,0.8fr)_minmax(70px,0.7fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(90px,0.9fr)_minmax(110px,1fr)] items-center gap-4";

function TradeRow({ trade }: { trade: Trade }) {
  const size = trade.size || 0;
  const price = trade.price || 0;
  const amount = size * price;
  const relativeTime = trade.timestamp
    ? formatRelativeTime(trade.timestamp)
    : "-";

  const sideColor =
    trade.side === "BUY" ? "text-outcome-yes" : "text-outcome-no";

  return (
    <div className={cn(TRADE_ROW_GRID_CLASSES, TABLE_ROW_CLASSES)}>
      <div className="min-w-0 overflow-hidden">
        <Link
          href={`/market/${trade.slug}`}
          className="block truncate hover:underline font-medium"
        >
          {trade.title}
        </Link>
      </div>
      <div>
        <div className="font-semibold">{trade.outcome}</div>
      </div>
      <div className={cn("font-semibold", sideColor)}>{trade.side}</div>
      <div>
        <div className="font-semibold">{formatNumber(size, 0)}</div>
      </div>
      <div>
        <div className="font-semibold">{formatNumber(price * 100, 1)}%</div>
      </div>
      <div>
        <div className="font-semibold">{formatCompactCurrency(amount)}</div>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {relativeTime}
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

  const { scrollRef, sentinelRef } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

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
    <div ref={scrollRef} className="flex flex-col h-full overflow-auto">
      <div className={TABLE_HEADER_CONTAINER_CLASSES}>
        <div className={cn(TRADE_ROW_GRID_CLASSES, TABLE_HEADER_CLASSES)}>
          <div>Market</div>
          <div>Outcome</div>
          <div>Side</div>
          <div>Size</div>
          <div>Price</div>
          <div>Amount</div>
          <div className="text-right">Time</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
        {allTrades.map((trade, index) => (
          <TradeRow key={`${trade.transactionHash}-${index}`} trade={trade} />
        ))}
        {hasNextPage && <div ref={sentinelRef} className="h-4" />}
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
