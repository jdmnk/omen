"use client";

import React from "react";
import { useUserPositionsInfiniteQuery } from "@/lib/queries/user-positions.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import {
  formatCompactCurrency,
  formatNumber,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { UserPosition } from "@/lib/models/api.models";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "./shared-table-styles";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(220px,2fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(110px,1fr)] items-center gap-4";

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
        <div className="font-semibold">{formatNumber(size, 0)}</div>
      </div>
      <div>
        <div className="font-semibold">
          {formatNumber(currentPrice * 100, 1)}%
        </div>
      </div>
      <div>
        <div className="font-semibold">{formatCompactCurrency(totalValue)}</div>
      </div>
      <div className={cn("flex items-center gap-1", pnlColor)}>
        <div className="font-semibold">{formatCompactCurrency(pnl)}</div>
        <div className="opacity-75">
          {pnlPercent > 0 ? "+" : ""}
          {formatNumber(pnlPercent, 1)}%
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {position.endDate
          ? new Date(position.endDate).toLocaleDateString()
          : "-"}
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
      <div className={TABLE_HEADER_CONTAINER_CLASSES}>
        <div className={cn(POSITION_ROW_GRID_CLASSES, TABLE_HEADER_CLASSES)}>
          <div>Market</div>
          <div>Outcome</div>
          <div>Size</div>
          <div>Price</div>
          <div>Value</div>
          <div>PnL</div>
          <div className="text-right">End date</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
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
