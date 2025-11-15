"use client";

import React from "react";
import { useClosedPositionsInfiniteQuery } from "@/lib/queries/closed-positions.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ClosedPosition } from "@/lib/models/frontend.models";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "./shared-table-styles";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(250px,2fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(100px,1fr)] items-center gap-4";

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
    <div className={cn(POSITION_ROW_GRID_CLASSES, TABLE_ROW_CLASSES)}>
      <div className="min-w-0 overflow-hidden">
        <Link
          href={`/market/${position.slug}`}
          className="block truncate hover:underline font-medium"
        >
          {position.title}
        </Link>
      </div>
      <div>
        <div className="font-semibold">{position.outcome}</div>
      </div>
      <div>
        <div className="font-semibold">{formatNumber(avgPrice * 100, 1)}%</div>
      </div>
      <div>
        <div className="font-semibold">
          {formatNumber(position.curPrice * 100, 1)}%
        </div>
      </div>
      <div>
        <div className="font-semibold">
          {formatCompactCurrency(totalBought)}
        </div>
      </div>
      <div className={cn("flex items-center gap-1", pnlColor)}>
        <div className="font-semibold">
          {formatCompactCurrency(realizedPnl)}
        </div>
        <div className="opacity-75">
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
  } = useClosedPositionsInfiniteQuery(userId, "TIMESTAMP");

  const { scrollRef, sentinelRef } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

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
    <div ref={scrollRef} className="flex flex-col h-full overflow-auto">
      <div className={TABLE_HEADER_CONTAINER_CLASSES}>
        <div className={cn(POSITION_ROW_GRID_CLASSES, TABLE_HEADER_CLASSES)}>
          <div>Market</div>
          <div>Outcome</div>
          <div>Avg Price</div>
          <div>Final Price</div>
          <div>Total Bought</div>
          <div>Realized PnL</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
        {allPositions.map((position, index) => (
          <ClosedPositionRow
            key={`${position.conditionId}-${position.outcomeIndex}-${index}`}
            position={position}
          />
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
          All {allPositions.length} closed positions loaded
        </div>
      )}
    </div>
  );
}
