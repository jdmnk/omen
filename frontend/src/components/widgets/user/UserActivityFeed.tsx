"use client";

import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "../shared-table-styles";
import {
  formatCompactCurrency,
  formatNumber,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { fetchUserActivityEntries } from "@/lib/queries/user-activity.query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { getPolymarketEventUrl } from "@/lib/utils/polymarket.utils";
import type { MarketActivityEntry } from "@/lib/models/frontend.models";
import {
  getActivityMarketLabel,
  getActivityTypeLabel,
} from "@/lib/utils/activity.utils";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";

const ACTIVITY_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(70px,0.7fr)_minmax(200px,1.6fr)_minmax(200px,1.4fr)_minmax(120px,0.9fr)_minmax(120px,0.9fr)] items-center gap-4";
const PAGE_SIZE = 100;

function ActivityRow({ entry }: { entry: MarketActivityEntry }) {
  const size = entry.size ?? 0;
  const price = entry.price ?? 0;
  const amount =
    entry.usdcSize ??
    (entry.size !== undefined && entry.price !== undefined ? size * price : 0);
  const relativeTime = entry.timestamp
    ? formatRelativeTime(entry.timestamp)
    : "-";
  const marketUrl = getPolymarketEventUrl(entry.slug ?? undefined);
  const isTrade = entry.type === "TRADE";
  const typeLabel = getActivityTypeLabel(entry);
  const marketLabel = getActivityMarketLabel(entry);
  const typeUpper = entry.type?.toUpperCase() ?? "";
  const isYield = typeUpper === "YIELD";
  const outcomeLabel = isYield ? "-" : entry.outcome ?? "-";
  const sharesLabel =
    !isYield && entry.size !== undefined && entry.size !== null
      ? `${formatNumber(size, size >= 1 ? 0 : 2)} shares`
      : null;
  const shouldShowPrice = !["YIELD", "REDEEM", "MERGE", "REWARD"].includes(
    typeUpper
  );
  const priceLabel =
    entry.price !== undefined && entry.price !== null
      ? `${formatNumber(price * 100, 1)}¢`
      : "-";
  const typeColor =
    isTrade && entry.side?.toUpperCase() === "BUY"
      ? "text-outcome-yes"
      : isTrade && entry.side?.toUpperCase() === "SELL"
      ? "text-outcome-no"
      : "text-muted-foreground";
  const combinedOutcomeLabel =
    outcomeLabel === "-" ? priceLabel : `${outcomeLabel} ${priceLabel}`;

  const outcomeColor =
    entry.outcomeIndex === 0
      ? "text-outcome-yes"
      : entry.outcomeIndex === 1
      ? "text-outcome-no"
      : "text-foreground";

  return (
    <div className={cn(ACTIVITY_ROW_GRID_CLASSES, TABLE_ROW_CLASSES)}>
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          typeColor
        )}
      >
        {typeLabel}
      </div>
      <div className="min-w-0 overflow-hidden">
        {entry.slug ? (
          <a
            href={marketUrl}
            className="block truncate font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {marketLabel}
          </a>
        ) : (
          <span className="block truncate font-medium text-foreground">
            {marketLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs">
        {shouldShowPrice && (
          <span className={cn("font-semibold", outcomeColor)}>
            {combinedOutcomeLabel}
          </span>
        )}
        {sharesLabel && (
          <span className="text-[11px] text-muted-foreground">
            {sharesLabel}
          </span>
        )}
      </div>
      <div className="font-semibold">
        {amount ? formatCompactCurrency(amount) : "-"}
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {relativeTime}
      </div>
    </div>
  );
}

export function UserActivityFeed({ userId }: { userId: string }) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["user-activity", userId],
    queryFn: ({ pageParam = 0 }) =>
      fetchUserActivityEntries(
        userId,
        undefined,
        PAGE_SIZE,
        pageParam as number
      ),
    enabled: Boolean(userId),
    staleTime: 60_000,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });

  const { scrollRef, sentinelRef } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading activity..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Error loading activity
      </div>
    );
  }

  const entries = data?.pages.flat() ?? [];

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No activity found
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex h-full flex-col overflow-auto">
      <div className={TABLE_HEADER_CONTAINER_CLASSES}>
        <div className={cn(ACTIVITY_ROW_GRID_CLASSES, TABLE_HEADER_CLASSES)}>
          <div>Type</div>
          <div>Market</div>
          <div>Outcome / Size</div>
          <div>Amount</div>
          <div className="text-right">Time</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
        {entries.map((entry, index) => (
          <ActivityRow
            key={`${entry.transactionHash ?? entry.type}-${index}`}
            entry={entry}
          />
        ))}
        {hasNextPage && <div ref={sentinelRef} className="h-4" />}
      </div>
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner message="Loading activity..." size="sm" />
        </div>
      )}
    </div>
  );
}
