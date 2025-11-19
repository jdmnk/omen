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
import { UserPosition } from "@/lib/models/api.models";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TABLE_HEADER_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
  TABLE_ROW_CLASSES,
} from "../shared-table-styles";
import type { PositionActivityLookup } from "./userActivity.types";
import { getPositionKey } from "@/lib/utils/position.utils";
import { getPolymarketEventUrl } from "@/lib/utils/polymarket.utils";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[18px_minmax(220px,2fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(100px,1fr)_minmax(110px,1fr)] items-center gap-4";

type PositionRowProps = {
  position: UserPosition;
  isSelected: boolean;
  onTogglePosition?: (position: UserPosition, checked: boolean) => void;
  activityState?: PositionActivityLookup[string];
};

function PositionRow({
  position,
  isSelected,
  onTogglePosition,
  activityState,
}: PositionRowProps) {
  const size = position.size || 0;
  const currentPrice = position.curPrice || 0;
  const marketUrl = getPolymarketEventUrl(position.slug);

  const pnlColor =
    position.cashPnl > 0
      ? "text-outcome-yes"
      : position.cashPnl < 0
      ? "text-outcome-no"
      : "text-muted-foreground";

  const toggleSelection = (next: boolean) => {
    onTogglePosition?.(position, next);
  };

  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a")) {
      return;
    }
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
            aria-label="Select position"
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
          <div className="font-semibold">{formatNumber(size, 0)}</div>
        </div>
        <div>
          <div className="font-semibold">
            {formatNumber(currentPrice * 100, 1)}%
          </div>
        </div>
        <div>
          <div className="font-semibold">
            {formatCompactCurrency(position.currentValue)}
          </div>
        </div>
        <div className={cn("flex items-center gap-1", pnlColor)}>
          <div className="font-semibold">
            {formatCompactCurrency(position.cashPnl)}
          </div>
          <div className="opacity-75">
            {position.percentPnl > 0 ? "+" : ""}
            {formatNumber(position.percentPnl, 1)}%
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {position.endDate ? new Date(position.endDate).toLocaleString() : "-"}
        </div>
      </div>
      {isSelected ? (
        <PositionTradesSubRow
          marketTitle={position.title}
          activityState={activityState}
        />
      ) : null}
    </div>
  );
}

function PositionTradesSubRow({
  marketTitle,
  activityState,
}: {
  marketTitle: string | null;
  activityState?: PositionActivityLookup[string];
}) {
  if (!activityState) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-brand-stroke/60 px-4 py-3 text-xs text-muted-foreground">
        Select a position to show its trade activity.
      </div>
    );
  }

  if (activityState.isLoading) {
    return (
      <div className="ml-7 flex items-center gap-2 rounded-md border border-dashed border-brand-stroke/60 px-4 py-3 text-xs text-muted-foreground">
        <Spinner size="sm" /> Loading trades for {marketTitle || "position"}...
      </div>
    );
  }

  if (activityState.isError) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-destructive/40 px-4 py-3 text-xs text-destructive">
        Unable to load trade history for this position.
      </div>
    );
  }

  const trades = activityState.trades ?? [];

  if (trades.length === 0) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        No trades found for this position.
      </div>
    );
  }

  return (
    <div className="ml-7 rounded-md border border-brand-stroke/70 bg-brand-background/40 px-3 py-2 text-[11px]">
      <div className="mb-1 flex items-center justify-between uppercase tracking-wide text-muted-foreground">
        <span className="font-semibold">Trade Activity</span>
        <span className="text-[10px]">
          Showing {Math.min(trades.length, 20)} of {trades.length}
        </span>
      </div>
      <div className="flex flex-col divide-y divide-brand-stroke/30">
        {trades.slice(0, 20).map((trade) => {
          const notional = trade.size * (trade.price ?? 0);
          const priceCents =
            trade.price !== undefined && trade.price !== null
              ? `${formatNumber(trade.price * 100, 1)}¢`
              : "-";
          const sizeDisplay =
            trade.size !== undefined && trade.size !== null
              ? formatNumber(trade.size, trade.size >= 1 ? 0 : 2)
              : "-";
          const timestamp = trade.timestamp
            ? formatRelativeTime(trade.timestamp)
            : "-";
          const isBuy = (trade.side ?? "").toUpperCase() === "BUY";

          return (
            <div
              key={`${trade.transactionHash}-${trade.timestamp}`}
              className="flex flex-wrap items-center gap-3 py-1 text-[11px]"
            >
              <span className="text-muted-foreground">{timestamp}</span>
              <span
                className={cn(
                  "font-semibold",
                  isBuy ? "text-outcome-yes" : "text-outcome-no"
                )}
              >
                {trade.side?.toUpperCase()} {trade.outcome}
              </span>
              <span className="text-foreground">
                {sizeDisplay} @ {priceCents}
              </span>
              <span className="ml-auto font-semibold text-foreground">
                {formatCompactCurrency(notional)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type UserPositionsProps = {
  userId: string;
  selectedPositionKeys?: Set<string>;
  onTogglePosition?: (position: UserPosition, checked: boolean) => void;
  positionActivities?: PositionActivityLookup;
};

export function UserPositions({
  userId,
  selectedPositionKeys = new Set(),
  onTogglePosition,
  positionActivities,
}: UserPositionsProps) {
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
      <div className="py-8 text-center text-sm text-destructive">
        Error loading positions
      </div>
    );
  }

  const allPositions = data?.pages.flatMap((page) => page) || [];

  if (allPositions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No positions found
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex h-full flex-col overflow-auto">
      <div className={TABLE_HEADER_CONTAINER_CLASSES}>
        <div className={cn(POSITION_ROW_GRID_CLASSES, TABLE_HEADER_CLASSES)}>
          <div></div>
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
        {allPositions.map((position) => {
          const key = getPositionKey(position);
          return (
            <PositionRow
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
        <div className="py-4 text-center text-xs text-muted-foreground">
          All {allPositions.length} positions loaded
        </div>
      )}
    </div>
  );
}
