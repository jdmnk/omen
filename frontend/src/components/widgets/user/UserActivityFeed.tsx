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
import {
  getActivityMarketLabel,
  getActivityTypeLabel,
} from "@/lib/utils/activity.utils";

const ACTIVITY_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(70px,0.7fr)_minmax(200px,1.8fr)_minmax(180px,1.4fr)_minmax(140px,1fr)] items-center gap-4";

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
  const isRedeem = typeUpper === "REDEEM";
  const outcomeLabel = isYield ? "-" : entry.outcome ?? "-";
  const sharesLabel =
    !isYield && entry.size !== undefined && entry.size !== null
      ? `${formatNumber(size, size >= 1 ? 0 : 2)} shares`
      : null;
  const priceLabel =
    !isRedeem && entry.price !== undefined && entry.price !== null
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
      <div className="flex flex-col text-sm">
        <span
          className={cn(
            "font-semibold",
            outcomeLabel.toLowerCase().includes("yes")
              ? "text-outcome-yes"
              : outcomeLabel.toLowerCase().includes("no")
              ? "text-outcome-no"
              : "text-foreground"
          )}
        >
          {combinedOutcomeLabel}
        </span>
        {sharesLabel && (
          <span className="text-[11px] text-muted-foreground">
            {sharesLabel}
          </span>
        )}
      </div>
      <div className="flex flex-col text-right text-sm">
        <span className="font-semibold">
          {amount ? formatCompactCurrency(amount) : "-"}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {relativeTime}
        </span>
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
          <div>Type</div>
          <div>Market</div>
          <div>Outcome / Size</div>
          <div className="text-right">Amount / Time</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
        {entries.map((entry, index) => (
          <ActivityRow
            key={`${entry.transactionHash ?? entry.type}-${index}`}
            entry={entry}
          />
        ))}
      </div>
    </div>
  );
}
