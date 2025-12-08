import { ProcessedActivity } from "@/lib/models/frontend.models";
import { HistogramData, Time } from "lightweight-charts";

export function getExposureBars(
  activity: ProcessedActivity[],
  fidelitySeconds: number
): HistogramData<Time>[] {
  const filtered = activity.filter((entry) => entry.cumExposure !== undefined);

  if (filtered.length === 0) return [];

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

  const entries = Array.from(unique.values());
  if (entries.length === 0) return [];

  // Backfill gaps to make bars continuous
  const continuous: HistogramData<Time>[] = [];
  let lastValue = entries[0].value;

  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    const currentTime = current.time as number;

    // If not first entry, fill gap from previous to current
    if (i > 0) {
      const prevTime = entries[i - 1].time as number;
      const gap = currentTime - prevTime;

      // Fill gaps larger than fidelitySeconds
      if (gap > fidelitySeconds) {
        let fillTime = prevTime + fidelitySeconds;
        while (fillTime < currentTime) {
          continuous.push({
            time: fillTime as Time,
            value: lastValue,
          });
          fillTime += fidelitySeconds;
        }
      }
    }

    continuous.push(current);
    lastValue = current.value;
  }

  return continuous;
}
