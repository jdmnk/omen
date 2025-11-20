"use client";

import { DATA_API_HOST } from "@/lib/api.const";
import type { MarketActivityEntry } from "@/lib/models/frontend.models";

type RawActivityEntry = {
  type?: string;
  timestamp?: number;
  conditionId?: string;
  asset?: string;
  side?: string;
  size?: number;
  price?: number;
  usdcSize?: number;
  outcome?: string;
  outcomeIndex?: number;
  title?: string;
  slug?: string;
  eventSlug?: string;
  transactionHash?: string;
};

function mapActivityEntry(entry: RawActivityEntry): MarketActivityEntry | null {
  if (!entry) return null;
  const timestamp = entry.timestamp ?? 0;
  if (!timestamp) return null;
  return {
    type: (entry.type || "").toUpperCase(),
    timestamp,
    conditionId: entry.conditionId ?? null,
    asset: entry.asset ?? null,
    side: entry.side ?? null,
    size: entry.size ?? null,
    price: entry.price ?? null,
    usdcSize: entry.usdcSize ?? null,
    outcome: entry.outcome ?? null,
    outcomeIndex: entry.outcomeIndex ?? null,
    title: entry.title ?? null,
    slug: entry.slug ?? null,
    eventSlug: entry.eventSlug ?? null,
    transactionHash: entry.transactionHash ?? null,
  };
}

export async function fetchUserActivityEntries(
  userId: string,
  conditionId?: string,
  limit: number = 500,
  offset: number = 0
): Promise<MarketActivityEntry[]> {
  if (!userId) return [];
  const url = new URL(`${DATA_API_HOST}/activity`);
  url.searchParams.set("user", userId);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  if (conditionId) {
    url.searchParams.set("market", conditionId);
  }
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.statusText}`);
  }
  const payload = await response.json();
  const entries: RawActivityEntry[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.activity)
    ? payload.activity
    : [];
  return entries
    .map(mapActivityEntry)
    .filter(
      (entry): entry is MarketActivityEntry =>
        Boolean(entry && (!conditionId || entry.conditionId === conditionId))
    )
    .sort((a, b) => b.timestamp - a.timestamp);
}
