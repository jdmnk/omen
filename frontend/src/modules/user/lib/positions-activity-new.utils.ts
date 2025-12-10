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
  let countNumExposureChanges = 0;

  for (const entry of sortedActivity) {
    if (entry.size && entry.size < 0) {
      console.warn("entry.size is negative!", entry.size, entry);
    }
    // exposure INCREASE events
    if (entry.type === "TRADE" && entry.side === "BUY") {
      if (entry.size && entry.size !== 0) {
        exposure += entry.size;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    } else if (entry.type === "SPLIT") {
      if (entry.size && entry.size !== 0) {
        exposure += entry.size / 2;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    } else if (entry.type === "CONVERT") {
      // CONVERT decreases exposure for the position being converted FROM
      if (entry.size && entry.size !== 0) {
        exposure -= entry.size;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    }

    // exposure DECREASE events
    else if (entry.type === "TRADE" && entry.side === "SELL") {
      if (entry.size && entry.size !== 0) {
        exposure -= entry.size;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    } else if (entry.type === "MERGE") {
      if (entry.size && entry.size !== 0) {
        exposure -= entry.size / 2;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    } else if (entry.type === "REDEEM") {
      if (entry.size && entry.size !== 0) {
        exposure -= entry.size;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    }

    newActivityEntries.push({
      ...entry,
      cumExposure: exposure,
    });
  }

  // reverse back to timestamp DESC
  const reversedNewActivityEntries = newActivityEntries.reverse();

  console.log("countNumExposureChanges", countNumExposureChanges);

  if (countNumExposureChanges !== activity.length) {
    console.warn(
      "Processed activity has missing entries. countNumExposureChanges !== activity.length",
      countNumExposureChanges,
      activity.length
    );
  }

  return reversedNewActivityEntries;
}
