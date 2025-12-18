"use client";

import React from "react";
import { useClosedPositionsInfiniteQuery } from "@/modules/user/lib/queries/closed-positions.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { ClosedPosition, Position } from "@/lib/models/frontend.models";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "../../../components/shared-table-styles";
import type { PositionActivityLookup } from "../userActivity.types";
import { getPositionKey } from "@/modules/user/lib/position.utils";
import { PositionActivitySubRow } from "./positions/PositionActivitySubRow";
import { PositionMarketLinkButton } from "./positions/PositionMarketLinkButton";
import { MarketInfoCell } from "./positions/MarketInfoCell";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[18px_1fr_80px_minmax(120px,auto)_24px] items-center gap-3";

type ClosedPositionRowProps = {
  position: ClosedPosition;
  isSelected: boolean;
  onTogglePosition?: (position: Position, checked: boolean) => void;
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

  const pnlPercent = totalBought > 0 ? (realizedPnl / totalBought) * 100 : 0;
  const isWin = realizedPnl > 0;
  const isLoss = realizedPnl < 0;
  const pnlColor = isWin
    ? "text-outcome-yes"
    : isLoss
    ? "text-outcome-no"
    : "text-muted-foreground";

  const toggleSelection = (next: boolean) => {
    onTogglePosition?.(position, next);
  };

  const handleRowClick = () => {
    toggleSelection(!isSelected);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSelection(!isSelected);
    }
  };

  // Calculate shares from totalBought and avgPrice
  const shares = avgPrice > 0 ? totalBought / avgPrice : 0;

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
        <MarketInfoCell
          icon={position.icon}
          title={position.title}
          outcome={position.outcome}
          outcomeIndex={position.outcomeIndex}
          shares={shares}
          price={avgPrice}
        />
        {/* Cost */}
        <div className="text-right">
          <span className="font-semibold text-sm">
            {formatCompactCurrency(totalBought)}
          </span>
        </div>
        {/* Value + Realized PnL */}
        <div className="text-right">
          <div className="font-semibold text-sm">
            {formatCompactCurrency(totalBought + realizedPnl)}
          </div>
          <div className={cn("text-xs", pnlColor)}>
            {formatCompactCurrency(realizedPnl)} ({formatNumber(pnlPercent, 2)}
            %)
          </div>
        </div>
        {/* Link */}
        <div className="flex justify-end">
          <PositionMarketLinkButton slug={position.eventSlug} />
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
  onTogglePosition?: (position: Position, checked: boolean) => void;
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
          <div className="text-right">Total Bet</div>
          <div className="text-right">Value</div>
          <div></div>
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
