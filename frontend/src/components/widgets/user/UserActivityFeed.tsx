"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
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

const ACTIVITY_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(220px,2fr)_minmax(80px,0.8fr)_minmax(70px,0.7fr)_minmax(80px,0.8fr)_minmax(80px,0.8fr)_minmax(90px,0.9fr)_minmax(110px,1fr)] items-center gap-4";

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
  const sideColor =
    entry.side?.toUpperCase() === "BUY"
      ? "text-outcome-yes"
      : entry.side?.toUpperCase() === "SELL"
      ? "text-outcome-no"
      : "text-muted-foreground";

  return (
    <div className={cn(ACTIVITY_ROW_GRID_CLASSES, TABLE_ROW_CLASSES)}>
      <div className="min-w-0 overflow-hidden">
        <a
          href={marketUrl}
          className="block truncate font-medium hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {entry.title ?? entry.slug ?? "Market"}
        </a>
      </div>
      <div>
        <div className="font-semibold">{entry.outcome ?? "-"}</div>
      </div>
      <div className="font-semibold text-xs text-muted-foreground">
        {entry.type}
      </div>
      <div>
        <div className="font-semibold">
          {entry.size !== undefined && entry.size !== null
            ? formatNumber(size, size >= 1 ? 0 : 2)
            : "-"}
        </div>
      </div>
      <div>
        <div className="font-semibold">
          {entry.price !== undefined && entry.price !== null
            ? `${formatNumber(price * 100, 1)}%`
            : "-"}
        </div>
      </div>
      <div className="font-semibold">
        {amount ? formatCompactCurrency(amount) : "-"}
      </div>
      <div className={cn("text-xs text-muted-foreground text-right", sideColor)}>
        {isTrade ? entry.side?.toUpperCase() : relativeTime}
      </div>
    </div>
  );
}

export function UserActivityFeed({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-activity", userId],
    queryFn: () => fetchUserActivityEntries(userId, undefined, 500),
    enabled: Boolean(userId),
    staleTime: 60_000,
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

  const entries = data ?? [];

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No activity found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className={TABLE_HEADER_CONTAINER_CLASSES}>
        <div className={cn(ACTIVITY_ROW_GRID_CLASSES, TABLE_HEADER_CLASSES)}>
          <div>Market</div>
          <div>Outcome</div>
          <div>Type</div>
          <div>Size</div>
          <div>Price</div>
          <div>Amount</div>
          <div className="text-right">Side/Time</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
        {entries.map((entry, index) => (
          <ActivityRow key={`${entry.transactionHash ?? index}-${index}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}
