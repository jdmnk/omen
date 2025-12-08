import { Position, ProcessedActivity } from "@/lib/models/frontend.models";
import { formatPrice } from "@/lib/ui/format.utils";
import { SeriesMarker, Time } from "lightweight-charts";

export function createMarkerSizeScaler(entries: ProcessedActivity[]) {
  const sizes = entries
    .filter((e) => e.type === "TRADE")
    .map((e) => e.size || 1);

  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  // Handle edge case where all trades are equal
  if (minSize === maxSize) {
    return () => 1.5; // uniform medium size
  }

  return (raw: number) => {
    const normalized = (raw - minSize) / (maxSize - minSize); // 0 to 1
    return 1 + normalized * 2; // scale to 1 to 3
  };
}

export function getMarkers(activity: ProcessedActivity[]) {
  const markers: SeriesMarker<Time>[] = [];

  const scale = createMarkerSizeScaler(activity);

  for (const entry of activity) {
    if (entry.type !== "TRADE") continue;

    const time = entry.timestamp;
    const isBuy = entry.side === "BUY";

    const size = scale(entry.size || 1);

    markers.push({
      time: time as Time,
      position: isBuy ? "belowBar" : "aboveBar",
      color: isBuy ? "#22c55e" : "#ef4444",
      shape: "circle",
      text: formatPrice(entry.price, { maximumFractionDigits: 1 }),
      size,
    });
  }

  return markers;
}
