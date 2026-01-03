"use client";

import { UserWatchlist } from "@/components/watchlists/UserWatchlist";
import { MarketWatchlist } from "@/components/watchlists/MarketWatchlist";

export function MainWatchlists() {
  return (
    <div className="grid gap-3 md:gap-5">
      <div className="grid gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          User Watchlist
        </div>
        <UserWatchlist />
      </div>
      <div className="grid gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Market Watchlist
        </div>
        <MarketWatchlist />
      </div>
    </div>
  );
}
