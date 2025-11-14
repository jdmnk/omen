"use client";

import React from "react";
import { useUserPositionsInfiniteQuery } from "@/lib/queries/user-positions.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { UserPosition } from "@/lib/models/api.models";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(300px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center gap-4";

function PositionRow({ position }: { position: UserPosition }) {
  const size = position.size || 0;
  const currentPrice = position.curPrice || 0;
  const avgPrice = position.avgPrice || 0;
  const totalCost = position.totalBought * position.avgPrice || 0;

  const totalValue = size * currentPrice;
  const pnl = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

  const pnlColor =
    pnl > 0
      ? "text-outcome-yes"
      : pnl < 0
      ? "text-outcome-no"
      : "text-muted-foreground";

  return (
    <div
      className={cn(
        POSITION_ROW_GRID_CLASSES,
        "py-3 border-b border-border/50 last:border-0 text-sm hover:bg-muted/20"
      )}
    >
      <div className="min-w-0 overflow-hidden">
        <Link
          href={`/market/${position.slug}`}
          className="block truncate hover:underline font-medium"
        >
          {position.title}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">
          {position.outcome}
        </div>
      </div>
      <div>
        <div className="font-semibold">{formatNumber(size, 0)}</div>
        <div className="text-xs text-muted-foreground">shares</div>
      </div>
      <div>
        <div className="font-semibold">
          {formatNumber(currentPrice * 100, 1)}%
        </div>
        <div className="text-xs text-muted-foreground">
          avg: {formatNumber(avgPrice * 100, 1)}%
        </div>
      </div>
      <div>
        <div className="font-semibold">{formatCompactCurrency(totalValue)}</div>
        <div className="text-xs text-muted-foreground">
          cost: {formatCompactCurrency(totalCost)}
        </div>
      </div>
      <div className={cn("flex flex-col", pnlColor)}>
        <div className="font-semibold">{formatCompactCurrency(pnl)}</div>
        <div className="text-xs">
          {pnlPercent > 0 ? "+" : ""}
          {formatNumber(pnlPercent, 1)}%
        </div>
      </div>
    </div>
  );
}

export function UserPositions({ userId }: { userId: string }) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPositionsInfiniteQuery(userId);

  const { scrollRef, sentinelRef } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading positions..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Error loading positions
      </div>
    );
  }

  const allPositions = data?.pages.flatMap((page) => page) || [];

  if (allPositions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No positions found
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex flex-col h-full overflow-auto">
      <div className="px-4 py-3 bg-muted/20 sticky top-0 z-10">
        <div className={cn(POSITION_ROW_GRID_CLASSES, "text-xs font-bold")}>
          <div>Market</div>
          <div>Size</div>
          <div>Price</div>
          <div>Value</div>
          <div>PnL</div>
        </div>
      </div>
      <div className="px-4">
        {allPositions.map((position, index) => (
          <PositionRow key={`${position.slug}-${index}`} position={position} />
        ))}
        {hasNextPage && <div ref={sentinelRef} className="h-4" />}
      </div>
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}
      {!hasNextPage && allPositions.length > 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          All {allPositions.length} positions loaded
        </div>
      )}
    </div>
  );
}
