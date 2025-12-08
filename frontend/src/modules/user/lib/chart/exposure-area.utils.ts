import { ProcessedActivity } from "@/lib/models/frontend.models";
import { Time } from "lightweight-charts";

export type ExposureAreaPoint = {
  time: Time;
  value: number;
};

/**
 * Creates stepped area chart data for exposure over time.
 * The stepped line shows how exposure changes at discrete points in time,
 * maintaining the previous value until a new value is set.
 */
export function getExposureArea(
  activity: ProcessedActivity[],
  fidelitySeconds: number
): ExposureAreaPoint[] {
  const filtered = activity.filter((entry) => entry.cumExposure !== undefined);

  if (filtered.length === 0) return [];

  // Sort by timestamp ascending
  const sorted = filtered.sort((a, b) => a.timestamp - b.timestamp);

  // Deduplicate by timestamp (keep last value for each timestamp)
  const unique = new Map<number, ExposureAreaPoint>();
  for (const entry of sorted) {
    unique.set(entry.timestamp, {
      time: entry.timestamp as Time,
      value: entry.cumExposure ?? 0,
    });
  }

  const entries = Array.from(unique.values());
  if (entries.length === 0) return [];

  // For stepped area charts, we need to create points that show the step transitions
  // ApexCharts will render this as a stepped line when curve: "stepline" is used
  const stepped: ExposureAreaPoint[] = [];
  let lastValue = entries[0].value;

  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    const currentTime = current.time as number;

    if (i > 0) {
      const prevTime = entries[i - 1].time as number;
      const prevValue = entries[i - 1].value;

      // If value changed, create a step: end previous value at current time, then start new value
      if (prevValue !== current.value) {
        // End previous value at current time (horizontal line end)
        stepped.push({
          time: currentTime as Time,
          value: prevValue,
        });
        // Start new value at current time (vertical step)
        stepped.push({
          time: currentTime as Time,
          value: current.value,
        });
      } else {
        // Value didn't change, but fill gaps if needed
        const gap = currentTime - prevTime;
        if (gap > fidelitySeconds) {
          // Fill gap with intermediate points to maintain continuity
          let fillTime = prevTime + fidelitySeconds;
          while (fillTime < currentTime) {
            stepped.push({
              time: fillTime as Time,
              value: lastValue,
            });
            fillTime += fidelitySeconds;
          }
        }
        // Add current point
        stepped.push(current);
      }
    } else {
      // First entry
      stepped.push(current);
    }

    lastValue = current.value;
  }

  // Extend bars into the future (to current time)
  if (stepped.length > 0) {
    const lastTime = stepped[stepped.length - 1].time as number;
    const now = Math.floor(Date.now() / 1000);
    if (lastTime < now) {
      stepped.push({
        time: now as Time,
        value: lastValue,
      });
    }
  }

  return stepped;
}

