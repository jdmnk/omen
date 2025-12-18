"use client";

import React from "react";
import Image from "next/image";
import { useUserPositionsInfiniteQuery } from "@/modules/user/lib/queries/user-positions.query";
import { LoadingSpinner, Spinner } from "@/components/ui/spinner";
import {
  formatCompactCurrency,
  formatNumber,
  formatPrice,
} from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { OpenPosition, Position } from "@/lib/models/api.models";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TABLE_HEADER_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
  TABLE_ROW_CLASSES,
} from "../../../components/shared-table-styles";
import type { PositionActivityLookup } from "../userActivity.types";
import { getPositionKey } from "@/modules/user/lib/position.utils";
import { PositionActivitySubRow } from "./positions/PositionActivitySubRow";
import { PositionMarketLinkButton } from "./positions/PositionMarketLinkButton";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[18px_1fr_60px_60px_minmax(100px,auto)_32px] items-center gap-3";

type PositionRowProps = {
  position: OpenPosition;
  isSelected: boolean;
  onTogglePosition?: (position: Position, checked: boolean) => void;
  activityState?: PositionActivityLookup[string];
};

function PositionRow({
  position,
  isSelected,
  onTogglePosition,
  activityState,
}: PositionRowProps) {
  const size = position.size || 0;
  const avgPrice = position.avgPrice || 0;
  const currentPrice = position.curPrice || 0;
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
        {/* Market info: icon, title, outcome badge, shares */}
        <div className="flex items-center gap-2 min-w-0">
          {position.icon && (
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src={position.icon}
                alt=""
                fill
                className="rounded object-cover"
              />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="truncate font-medium text-sm leading-tight">
              {position.title}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  position.outcome === "Yes"
                    ? "bg-outcome-yes/15 text-outcome-yes"
                    : "bg-outcome-no/15 text-outcome-no"
                )}
              >
                {position.outcome}
              </span>
              <span>
                {formatNumber(size, 1)} shares at{" "}
                {formatPrice(avgPrice, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
        {/* AVG price */}
        <div className="text-center">
          <span className="font-semibold text-sm">
            {formatPrice(avgPrice, { maximumFractionDigits: 0 })}
          </span>
        </div>
        {/* CURRENT price */}
        <div className="text-center">
          <span className="font-semibold text-sm">
            {formatPrice(currentPrice, { maximumFractionDigits: 0 })}
          </span>
        </div>
        {/* VALUE with PnL */}
        <div className="text-right">
          <div className="font-semibold text-sm">
            {formatCompactCurrency(position.currentValue)}
          </div>
          <div className={cn("text-xs", pnlColor)}>
            {formatCompactCurrency(position.cashPnl)} (
            {formatNumber(position.percentPnl, 2)}%)
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

type UserPositionsProps = {
  userId: string;
  selectedPositionKeys?: Set<string>;
  onTogglePosition?: (position: Position, checked: boolean) => void;
  positionActivities?: PositionActivityLookup;
};

export function UserOpenPositions({
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
          <div className="text-center">Avg</div>
          <div className="text-center">Current</div>
          <div className="text-right">Value</div>
          <div></div>
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
