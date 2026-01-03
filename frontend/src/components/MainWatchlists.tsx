"use client";

import { UserWatchlist } from "@/components/watchlists/UserWatchlist";
import { MarketWatchlist } from "@/components/watchlists/MarketWatchlist";

export function MainWatchlists() {
  return (
    <div className="grid gap-3 md:gap-5">
      <UserWatchlist />
      <MarketWatchlist />
    </div>
  );
}
