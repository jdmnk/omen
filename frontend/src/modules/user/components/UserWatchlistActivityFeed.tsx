"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  TABLE_HEADER_CLASSES,
  TABLE_ROW_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
} from "../../../components/shared-table-styles";
import {
  formatAddress,
  formatCompactCurrency,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { fetchUserActivityEntries } from "@/modules/user/lib/queries/user-activity.query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { getPolymarketEventUrl } from "@/lib/utils/polymarket.utils";
import type { Activity } from "@/lib/models/frontend.models";
import {
  getActivityMarketLabel,
  getActivityTypeLabel,
} from "@/modules/user/lib/activity.utils";
import type { UserWatchlistItem } from "@/lib/hooks/use-user-watchlist";
import { MarketInfoCell } from "./positions/MarketInfoCell";
import { Checkbox } from "@/components/ui/checkbox";

const ACTIVITY_ROW_GRID_CLASSES =
  "grid grid-cols-[140px_72px_1fr_minmax(80px,auto)] items-center gap-3";
const PAGE_SIZE = 50;

type WatchlistActivityRow = {
  entry: Activity;
  user: UserWatchlistItem;
};

function ActivityRow({ item }: { item: WatchlistActivityRow }) {
  const { entry, user } = item;
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

  const iconUrl = (entry as Activity & { icon?: string }).icon;

  const hideSharesAndPrice = ["YIELD", "REWARD"].includes(typeUpper);
  const hidePrice = ["SPLIT", "MERGE", "REDEEM", "CONVERSION"].includes(
    typeUpper
  );
  const displayName = user.name || formatAddress(user.proxyWallet);

  return (
    <div className={cn(ACTIVITY_ROW_GRID_CLASSES, TABLE_ROW_CLASSES)}>
      <div className="text-[13px] font-medium truncate">{displayName}</div>
      <div className={cn("text-[13px] font-medium", typeColor)}>
        {typeLabel}
      </div>
      <MarketInfoCell
        icon={iconUrl}
        title={marketLabel}
        outcome={hideSharesAndPrice ? undefined : entry.outcome}
        outcomeIndex={entry.outcomeIndex}
        shares={hideSharesAndPrice ? undefined : entry.size}
        price={hideSharesAndPrice || hidePrice ? undefined : entry.price}
        href={marketUrl}
      />
      <div className="text-right">
        <div className="font-semibold text-sm">
          {amount !== undefined ? formatCompactCurrency(amount) : "-"}
        </div>
        <div className="text-xs text-muted-foreground">{relativeTime}</div>
      </div>
    </div>
  );
}

export function UserWatchlistActivityFeed({
  watchlist,
}: {
  watchlist: UserWatchlistItem[];
}) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() =>
    watchlist.map((user) => user.proxyWallet)
  );

  useEffect(() => {
    setSelectedUserIds((prev) => {
      const watchlistIds = watchlist.map((user) => user.proxyWallet);
      const watchlistSet = new Set(watchlistIds);
      const merged = new Set(prev);
      watchlistIds.forEach((id) => merged.add(id));
      return Array.from(merged).filter((id) => watchlistSet.has(id));
    });
  }, [watchlist]);

  const selectedWatchlist = useMemo(
    () =>
      watchlist.filter((user) => selectedUserIds.includes(user.proxyWallet)),
    [watchlist, selectedUserIds]
  );

  const activityQueries = useQueries({
    queries: selectedWatchlist.map((user) => ({
      queryKey: ["user-watchlist-activity", user.proxyWallet],
      queryFn: () =>
        fetchUserActivityEntries(user.proxyWallet, undefined, PAGE_SIZE),
      enabled: Boolean(user.proxyWallet),
      staleTime: 60_000,
    })),
  });

  const isLoading = activityQueries.some((query) => query.isLoading);

  const entries = useMemo(() => {
    const combined = selectedWatchlist.flatMap((user, index) => {
      const data = activityQueries[index]?.data ?? [];
      return data.map((entry) => ({ entry, user }));
    });
    return combined.sort((a, b) => b.entry.timestamp - a.entry.timestamp);
  }, [selectedWatchlist, activityQueries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading activity..." size="sm" />
      </div>
    );
  }

  if (selectedWatchlist.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Select users to load activity
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No activity found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="px-3 py-2 border-b border-brand-stroke">
        <div className="text-[11px] uppercase text-muted-foreground mb-2">
          Filter users
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {watchlist.map((user) => {
            const isChecked = selectedUserIds.includes(user.proxyWallet);
            const displayName = user.name || formatAddress(user.proxyWallet);
            return (
              <label
                key={user.proxyWallet}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    setSelectedUserIds((prev) => {
                      const next = new Set(prev);
                      if (checked) {
                        next.add(user.proxyWallet);
                      } else {
                        next.delete(user.proxyWallet);
                      }
                      return Array.from(next);
                    });
                  }}
                  aria-label={`Toggle ${displayName}`}
                />
                <span className="truncate max-w-[140px]">{displayName}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div className={TABLE_HEADER_CONTAINER_CLASSES}>
        <div className={cn(ACTIVITY_ROW_GRID_CLASSES, TABLE_HEADER_CLASSES)}>
          <div>User</div>
          <div>Type</div>
          <div>Market</div>
          <div className="text-right">Amount</div>
        </div>
      </div>
      <div className={TABLE_CONTENT_CONTAINER_CLASSES}>
        {entries.map((item, index) => (
          <ActivityRow
            key={`${item.entry.transactionHash ?? item.entry.type}-${index}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}
