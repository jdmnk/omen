"use client";

import React from "react";
import { useClosedPositionsInfiniteQuery } from "@/lib/queries/closed-positions.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ClosedPosition } from "@/lib/models/frontend.models";
import InfiniteScroll from "@/components/ui/infinite-scroll";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(300px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center gap-4";

function ClosedPositionRow({ position }: { position: ClosedPosition }) {
  const totalBought = position.totalBought || 0;
  const avgPrice = position.avgPrice || 0;
  const realizedPnl = position.realizedPnl || 0;

  const pnlPercent = totalBought > 0 ? (realizedPnl / totalBought) * 100 : 0;

  const pnlColor =
    realizedPnl > 0
      ? "text-outcome-yes"
      : realizedPnl < 0
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
        <div className="font-semibold">
          {formatNumber(avgPrice * 100, 1)}%
        </div>
        <div className="text-xs text-muted-foreground">avg price</div>
      </div>
      <div>
        <div className="font-semibold">
          {formatNumber(position.curPrice * 100, 1)}%
        </div>
        <div className="text-xs text-muted-foreground">final price</div>
      </div>
      <div>
        <div className="font-semibold">
          {formatCompactCurrency(totalBought)}
        </div>
        <div className="text-xs text-muted-foreground">total bought</div>
      </div>
      <div className={cn("flex flex-col", pnlColor)}>
        <div className="font-semibold">{formatCompactCurrency(realizedPnl)}</div>
        <div className="text-xs">
          {pnlPercent > 0 ? "+" : ""}
          {formatNumber(pnlPercent, 1)}%
        </div>
      </div>
    </div>
  );
}

export function UserClosedPositions({ userId }: { userId: string }) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useClosedPositionsInfiniteQuery(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading closed positions..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Error loading closed positions
      </div>
    );
  }

  const allPositions = data?.pages.flatMap((page) => page) || [];

  if (allPositions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No closed positions found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-4 py-3 bg-muted/20 sticky top-0 z-10">
        <div className={cn(POSITION_ROW_GRID_CLASSES, "text-xs font-bold")}>
          <div>Market</div>
          <div>Avg Price</div>
          <div>Final Price</div>
          <div>Total Bought</div>
          <div>Realized PnL</div>
        </div>
      </div>
      <div className="px-4">
        <InfiniteScroll
          isLoading={isFetchingNextPage}
          hasMore={!!hasNextPage}
          next={fetchNextPage}
          threshold={0.8}
        >
          {allPositions.map((position, index) => (
            <ClosedPositionRow
              key={`${position.conditionId}-${position.outcomeIndex}-${index}`}
              position={position}
            />
          ))}
        </InfiniteScroll>
      </div>
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}
      {!hasNextPage && allPositions.length > 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          All {allPositions.length} closed positions loaded
        </div>
      )}
    </div>
  );
}

