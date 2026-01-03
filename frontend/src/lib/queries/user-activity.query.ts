"use client";

import { DATA_API_HOST } from "@/lib/api.const";
import type { Activity } from "@/lib/models/frontend.models";

export async function fetchUserActivityPage(
  userId: string,
  conditionId: string | undefined,
  pageSize: number,
  offset: number
): Promise<{ entries: Activity[]; rawCount: number }> {
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
  const rawCount = payload.length;
  // No filtering or mapping on API fetch side - return raw entries as-is
  return { entries: payload, rawCount };
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
    const { entries: pageEntries, rawCount } = await fetchUserActivityPage(
      userId,
      conditionId,
      PAGE_SIZE,
      offset
    );

    // If we got no entries from the API, we've reached the end
    if (rawCount === 0) break;

    allEntries.push(...pageEntries);

    // If we've collected enough entries, stop
    if (allEntries.length >= limit) break;

    // If the API returned fewer entries than requested, we've reached the last page
    // Use rawCount (not filtered length) to determine if there are more pages
    if (rawCount < PAGE_SIZE) break;

    offset += PAGE_SIZE;
  }

  // Sort by timestamp descending (newest first) and limit results
  return allEntries.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
