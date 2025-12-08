import { ProcessedActivity } from "@/lib/models/frontend.models";
import { HistogramData, Time } from "lightweight-charts";

export function getExposureBars(
  activity: ProcessedActivity[]
): HistogramData<Time>[] {
  return activity
    .filter((entry) => entry.cumExposure !== undefined)
    .map((entry) => ({
      time: entry.timestamp as Time,
      value: entry.cumExposure ?? 0,
    }));
}
