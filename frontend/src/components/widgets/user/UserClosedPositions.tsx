"use client";

import React from "react";
import { useClosedPositionsInfiniteQuery } from "@/lib/queries/closed-positions.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import {
  formatCompactCurrency,
  formatNumber,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { ClosedPosition } from "@/lib/models/frontend.models";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "../shared-table-styles";
import type {
  PositionActivityLookup,
  SelectablePosition,
} from "./userActivity.types";
import { getPositionKey } from "@/lib/utils/position.utils";
import { getPolymarketEventUrl } from "@/lib/utils/polymarket.utils";
import { PositionActivitySubRow } from "./PositionActivitySubRow";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[18px_minmax(220px,2fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(110px,1fr)] items-center gap-4";

type ClosedPositionRowProps = {
  position: ClosedPosition;
  isSelected: boolean;
  onTogglePosition?: (position: SelectablePosition, checked: boolean) => void;
  activityState?: PositionActivityLookup[string];
};

function ClosedPositionRow({
  position,
  isSelected,
  onTogglePosition,
  activityState,
}: ClosedPositionRowProps) {
  const totalBought = position.totalBought || 0;
  const avgPrice = position.avgPrice || 0;
  const realizedPnl = position.realizedPnl || 0;
  const relativeTime = position.timestamp
    ? formatRelativeTime(position.timestamp)
    : "-";

  const pnlPercent = totalBought > 0 ? (realizedPnl / totalBought) * 100 : 0;
  const marketUrl = getPolymarketEventUrl(position.slug);

  const pnlColor =
    realizedPnl > 0
      ? "text-outcome-yes"
      : realizedPnl < 0
      ? "text-outcome-no"
      : "text-muted-foreground";

  const toggleSelection = (next: boolean) => {
    onTogglePosition?.(position, next);
  };

  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a")) return;
    toggleSelection(!isSelected);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSelection(!isSelected);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          POSITION_ROW_GRID_CLASSES,
          TABLE_ROW_CLASSES,
          "cursor-pointer"
        )}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
      >
        <div
          className="flex justify-center"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Checkbox
            aria-label="Select closed position"
            checked={isSelected}
            onCheckedChange={(checked) => toggleSelection(Boolean(checked))}
          />
        </div>
        <div className="flex min-w-0 overflow-hidden">
          <a
            href={marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full truncate font-medium hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {position.title}
          </a>
        </div>
        <div>
          <div className="font-semibold">{position.outcome}</div>
        </div>
        <div>
          <div className="font-semibold">
            {formatNumber(avgPrice * 100, 1)}%
          </div>
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
        <div className="text-xs text-muted-foreground text-right">
          {relativeTime}
        </div>
      </div>
      {isSelected ? (
        <PositionActivitySubRow
          marketTitle={position.title}
          activityState={activityState}
        />
      ) : null}
    </div>
  );
}

type UserClosedPositionsProps = {
  userId: string;
  selectedPositionKeys?: Set<string>;
  onTogglePosition?: (position: SelectablePosition, checked: boolean) => void;
  positionActivities?: PositionActivityLookup;
};

export function UserClosedPositions({
  userId,
  selectedPositionKeys = new Set(),
  onTogglePosition,
  positionActivities,
}: UserClosedPositionsProps) {
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
          <div></div>
          <div>Market</div>
          <div>Outcome</div>
          <div>Avg Price</div>
          <div>Final Price</div>
          <div>Total Bought</div>
          <div>Realized PnL</div>
          <div className="text-right">Time</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
        {allPositions.map((position) => {
          const key = getPositionKey(position);
          return (
            <ClosedPositionRow
              key={key}
              position={position}
              isSelected={selectedPositionKeys.has(key)}
              onTogglePosition={onTogglePosition}
              activityState={positionActivities?.[key]}
            />
          );
        })}
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
