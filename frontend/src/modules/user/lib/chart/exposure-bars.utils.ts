import { ProcessedActivity } from "@/lib/models/frontend.models";
import { HistogramData, Time } from "lightweight-charts";

export function getExposureBars(
  activity: ProcessedActivity[]
): HistogramData<Time>[] {
  const filtered = activity.filter((entry) => entry.cumExposure !== undefined);

  // Sort by timestamp ascending
  const sorted = filtered.sort((a, b) => a.timestamp - b.timestamp);

  // Deduplicate by timestamp (keep last value for each timestamp)
  const unique = new Map<number, HistogramData<Time>>();
  for (const entry of sorted) {
    unique.set(entry.timestamp, {
      time: entry.timestamp as Time,
      value: entry.cumExposure ?? 0,
    });
  }

  return Array.from(unique.values());
}
