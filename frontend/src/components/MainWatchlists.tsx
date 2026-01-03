"use client";

import { UserWatchlist } from "@/components/watchlists/UserWatchlist";
import { MarketWatchlist } from "@/components/watchlists/MarketWatchlist";

export function MainWatchlists() {
  return (
    <>
      <UserWatchlist />
      <MarketWatchlist />
    </>
  );
}
