"use client";

import React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "../../../components/shared-table-styles";
import {
  formatCompactCurrency,
  formatPrice,
  formatNumber,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import { getOutcomeColorClass } from "@/lib/ui/color.utils";
import { cn } from "@/lib/utils";
import { fetchUserActivityPage } from "@/modules/user/lib/queries/user-activity.query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { getPolymarketEventUrl } from "@/lib/utils/polymarket.utils";
import type { Activity } from "@/lib/models/frontend.models";
import {
  getActivityMarketLabel,
  getActivityTypeLabel,
} from "@/modules/user/lib/activity.utils";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";

const ACTIVITY_ROW_GRID_CLASSES =
  "grid grid-cols-[60px_1fr_minmax(80px,auto)] items-center gap-3";
const PAGE_SIZE = 100;

function ActivityRow({ entry }: { entry: Activity }) {
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
  const isYield = typeUpper === "YIELD";
  const isReward = typeUpper === "REWARD";
  const sharesLabel =
    !isYield && !isReward && entry.size !== undefined && entry.size !== null
      ? `${formatNumber(size, size >= 1 ? 1 : 2)} shares`
      : null;
  const shouldShowOutcome = !["YIELD", "REWARD"].includes(typeUpper);
  const priceLabel = formatPrice(entry.price, { maximumFractionDigits: 0 });
  const typeColor =
    isTrade && entry.side?.toUpperCase() === "BUY"
      ? "text-outcome-yes"
      : isTrade && entry.side?.toUpperCase() === "SELL"
      ? "text-outcome-no"
      : "text-muted-foreground";

  const outcomeColor = getOutcomeColorClass(
    entry.outcomeIndex,
    "text-foreground"
  );

  // Get icon URL - activity entries might have an icon field or we derive from slug
  const iconUrl = (entry as Activity & { icon?: string }).icon;

  return (
    <div className={cn(ACTIVITY_ROW_GRID_CLASSES, TABLE_ROW_CLASSES)}>
      {/* Type */}
      <div className={cn("text-[13px] font-medium", typeColor)}>
        {typeLabel}
      </div>
      {/* Market info: icon, title, outcome/price + shares */}
      <div className="flex items-center gap-2 min-w-0">
        {iconUrl && (
          <div className="relative h-8 w-8 shrink-0">
            <Image src={iconUrl} alt="" fill className="rounded object-cover" />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          {marketUrl ? (
            <a
              href={marketUrl}
              className="truncate font-medium text-sm leading-tight hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {marketLabel}
              <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-50" />
            </a>
          ) : (
            <span className="truncate font-medium text-sm leading-tight">
              {marketLabel}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {shouldShowOutcome && entry.outcome && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  outcomeColor,
                  entry.outcomeIndex === 0
                    ? "bg-outcome-yes/15"
                    : "bg-outcome-no/15"
                )}
              >
                {entry.outcome} {priceLabel}
              </span>
            )}
            {sharesLabel && <span>{sharesLabel}</span>}
          </div>
        </div>
      </div>
      {/* Amount + Time */}
      <div className="text-right">
        <div className="font-semibold text-sm">
          {amount ? formatCompactCurrency(amount) : "-"}
        </div>
        <div className="text-xs text-muted-foreground">{relativeTime}</div>
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
