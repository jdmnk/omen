import { ProcessedActivity, Activity, Position } from "@/lib/models/api.models";
import {
  isBuyTrade,
  isConversion,
  isMerge,
  isRedeem,
  isSellTrade,
  isSplit,
} from "./activity-type.utils";

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
    if (isBuyTrade(entry)) {
      if (entry.size && entry.size !== 0) {
        exposure += entry.size;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    } else if (isSplit(entry)) {
      if (entry.size && entry.size !== 0) {
        exposure += entry.size / 2;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    }

    // exposure DECREASE events
    else if (isSellTrade(entry)) {
      if (entry.size && entry.size !== 0) {
        exposure -= entry.size;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    } else if (isMerge(entry)) {
      if (entry.size && entry.size !== 0) {
        exposure -= entry.size / 2;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    } else if (isRedeem(entry)) {
      if (entry.size && entry.size !== 0) {
        exposure = 0;
        countNumExposureChanges++;
      } else {
        console.log("entry.size is 0 or undefined", entry);
      }
    }
    // TODO: INCOMPLETE - this also results in an increase on other outcomes
    else if (isConversion(entry)) {
      // CONVERSION decreases exposure for the position being converted FROM
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
