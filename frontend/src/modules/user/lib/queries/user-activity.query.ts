"use client";

import { DATA_API_HOST } from "@/lib/api.const";
import type { Activity } from "@/lib/models/frontend.models";

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

function mapActivityEntry(entry: RawActivityEntry): Activity | null {
  if (!entry) return null;
  const timestamp = entry.timestamp ?? 0;
  if (!timestamp) return null;
  return {
    type: (entry.type || "").toUpperCase(),
    timestamp,
    conditionId: entry.conditionId,
    asset: entry.asset,
    side: entry.side,
    size: entry.size,
    price: entry.price,
    usdcSize: entry.usdcSize,
    outcome: entry.outcome,
    outcomeIndex: entry.outcomeIndex,
    title: entry.title,
    slug: entry.slug,
    eventSlug: entry.eventSlug,
    transactionHash: entry.transactionHash,
  };
}

export async function fetchUserActivityPage(
  userId: string,
  conditionId: string | undefined,
  pageSize: number,
  offset: number
): Promise<Activity[]> {
  const url = new URL(`${DATA_API_HOST}/activity`);
  url.searchParams.set("user", userId);
  url.searchParams.set("limit", String(pageSize));
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
    .filter((entry): entry is Activity =>
      Boolean(entry && (!conditionId || entry.conditionId === conditionId))
    )
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function fetchUserActivityEntries(
  userId: string,
  conditionId?: string,
  limit: number = 500
): Promise<Activity[]> {
  if (!userId) return [];
  const PAGE_SIZE = 500;
  const allEntries: Activity[] = [];
  let offset = 0;

  while (allEntries.length < limit) {
    const pageEntries = await fetchUserActivityPage(
      userId,
      conditionId,
      PAGE_SIZE,
      offset
    );
    if (pageEntries.length === 0) break;
    allEntries.push(...pageEntries);
    if (pageEntries.length < PAGE_SIZE) break;
    if (allEntries.length >= limit) break;
    offset += PAGE_SIZE;
  }

  return allEntries.slice(0, limit).sort((a, b) => b.timestamp - a.timestamp);
}
