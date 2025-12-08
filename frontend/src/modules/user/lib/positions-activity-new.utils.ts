import { ProcessedActivity, Activity, Position } from "@/lib/models/api.models";

export function getProcessedPositionActivity({
  position,
  activity,
}: {
  position: Position;
  activity: Activity[];
}): ProcessedActivity[] {
  console.log("position", position);
  console.log("activity", activity);

  // create a full projection of the position activity timeline
  let exposure = 0;
  // sort by timestamp ASC
  const sortedActivity = [...activity].sort(
    (a, b) => a.timestamp - b.timestamp
  );
  const newActivityEntries: ProcessedActivity[] = [];

  for (const entry of sortedActivity) {
    // exposure INCREASE events
    if (entry.type === "TRADE" && entry.side === "BUY") {
      exposure += entry.size ?? 0;
    } else if (entry.type === "SPLIT") {
      exposure += entry.size ?? 0;
    } else if (entry.type === "CONVERT") {
      // CONVERT decreases exposure for the position being converted FROM
      exposure -= entry.size ?? 0;
    }

    // exposure DECREASE events
    else if (entry.type === "TRADE" && entry.side === "SELL") {
      exposure -= entry.size ?? 0;
    } else if (entry.type === "MERGE") {
      exposure -= entry.size ?? 0;
    } else if (entry.type === "REDEEM") {
      exposure -= entry.size ?? 0;
    }

    newActivityEntries.push({
      ...entry,
      cumExposure: exposure,
    });
  }

  // reverse back to timestamp DESC
  const reversedNewActivityEntries = newActivityEntries.reverse();

  return reversedNewActivityEntries;
}
