"use client";

import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "../../../components/shared-table-styles";
import {
  formatCompactCurrency,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { fetchUserActivityPage } from "@/lib/queries/user-activity.query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { getPolymarketEventUrl } from "@/lib/utils/polymarket.utils";
import type { Activity } from "@/lib/models/frontend.models";
import { getActivityMarketLabel, getActivityTypeLabel } from "@/lib/activity.utils";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { MarketInfoCell } from "@/components/positions/MarketInfoCell";

const ACTIVITY_ROW_GRID_CLASSES =
  "grid grid-cols-[60px_1fr_minmax(80px,auto)] items-center gap-3";
const PAGE_SIZE = 100;

function ActivityRow({
  entry,
  isCompact,
}: {
  entry: Activity;
  isCompact: boolean;
}) {
  const size = entry.size ?? 0;
  const price = entry.price ?? 0;
  const amount =
    entry.usdcSize ??
    (entry.size !== undefined && entry.price !== undefined ? size * price : 0);
  const relativeTime = entry.timestamp
    ? formatRelativeTime(entry.timestamp)
    : "-";
  const marketUrl = entry.eventSlug
    ? getPolymarketEventUrl(entry.eventSlug)
    : undefined;
  const isTrade = entry.type === "TRADE";
  const typeLabel = getActivityTypeLabel(entry);
  const marketLabel = getActivityMarketLabel(entry);
  const typeUpper = entry.type?.toUpperCase() ?? "";
  const typeColor =
    isTrade && entry.side?.toUpperCase() === "BUY"
      ? "text-outcome-yes"
      : isTrade && entry.side?.toUpperCase() === "SELL"
      ? "text-outcome-no"
      : "text-muted-foreground";

  // Get icon URL - activity entries might have an icon field
  const iconUrl = (entry as Activity & { icon?: string }).icon;

  // Don't show shares/price for YIELD/REWARD
  const hideSharesAndPrice = ["YIELD", "REWARD"].includes(typeUpper);
  // Don't show price for SPLIT, MERGE, REDEEM, CONVERSION
  const hidePrice = ["SPLIT", "MERGE", "REDEEM", "CONVERSION"].includes(
    typeUpper
  );

  return (
    <div className={cn(ACTIVITY_ROW_GRID_CLASSES, TABLE_ROW_CLASSES)}>
      {/* Type */}
      <div className={cn("text-xs font-medium", "")}>{typeLabel}</div>
      <MarketInfoCell
        icon={isCompact ? null : iconUrl}
        title={marketLabel}
        outcome={hideSharesAndPrice ? undefined : entry.outcome}
        outcomeIndex={entry.outcomeIndex}
        shares={hideSharesAndPrice ? undefined : entry.size}
        price={hideSharesAndPrice || hidePrice ? undefined : entry.price}
        href={marketUrl}
      />
      {/* Amount + Time */}
      <div className="text-right">
        <div className="font-semibold text-sm">
          {amount !== undefined ? formatCompactCurrency(amount) : "-"}
        </div>
        <div className="text-xs text-muted-foreground">{relativeTime}</div>
      </div>
    </div>
  );
}

export function UserActivityFeed({
  userId,
  isCompact = false,
}: {
  userId: string;
  isCompact?: boolean;
}) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["user-activity", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await fetchUserActivityPage(
        userId,
        undefined,
        PAGE_SIZE,
        pageParam as number
      );
      return result;
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
    getNextPageParam: (lastPage, allPages) => {
      // Use rawCount to determine if there are more pages
      if (lastPage.rawCount < PAGE_SIZE) return undefined;
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

  const entries = data?.pages.flatMap((page) => page.entries) ?? [];

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
          <div className="text-right">Amount</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
        {entries.map((entry, index) => (
          <ActivityRow
            key={`${entry.transactionHash ?? entry.type}-${index}`}
            entry={entry}
            isCompact={isCompact}
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
