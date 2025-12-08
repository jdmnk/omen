import {
  ClosedPosition,
  ProcessedActivity,
  Activity,
  OpenPosition,
  Position,
} from "@/lib/models/api.models";
import { isOpenPosition } from "./position.utils";

function combineConsecutiveTrades(list: Activity[]): Activity[] {
  const result: Activity[] = [];
  let buffer: Activity | null = null;
  console.log("list", list);

  for (const t of list) {
    if (!buffer) {
      buffer = { ...t };
      continue;
    }

    if (t.side === buffer.side) {
      buffer.size = (buffer.size ?? 0) + (t.size ?? 0);
      buffer.usdcSize = (buffer.usdcSize ?? 0) + (t.usdcSize ?? 0);
      buffer.timestamp = t.timestamp;
    } else {
      result.push(buffer);
      buffer = { ...t };
    }
  }

  if (buffer) result.push(buffer);
  return result;
}

export function getOpenPositionActivity({
  position,
  activity,
  closedPositions = [],
}: {
  position: OpenPosition;
  activity: Activity[];
  closedPositions?: ClosedPosition[];
}): ProcessedActivity[] {
  /*
    If current position is open, we can simply return all position activity AFTER the last closed position's timestamp
  */

  if (closedPositions.length > 0) {
    // Ensure closed positions are sorted by timestamp DESC
    closedPositions = closedPositions.sort((a, b) => b.timestamp - a.timestamp);
    const lastClosedPosition = closedPositions[closedPositions.length - 1];
    const lastClosedPositionTimestamp = lastClosedPosition.timestamp;
    return activity.filter(
      (entry) => entry.timestamp > lastClosedPositionTimestamp
    );
  }
  return activity;
}

export function getClosedPositionActivity({
  position,
  activity,
  closedPositions = [],
}: {
  position: ClosedPosition;
  activity: Activity[];
  closedPositions?: ClosedPosition[];
}): ProcessedActivity[] {
  /*
    If current position is closed, we need to find all activity that fits between the current position's start and end timestamps
  */
  if (!closedPositions.length) return [];

  // Sort closed positions newest first
  const sorted = [...closedPositions].sort((a, b) => b.timestamp - a.timestamp);

  // Find this position
  const idx = sorted.findIndex((p) => p.timestamp === position.timestamp);
  if (idx === -1) return [];

  // Determine start timestamp
  let startTimestamp: number;

  if (idx > 0) {
    // There is a newer closed position before this one
    startTimestamp = sorted[idx - 1].timestamp;
  } else {
    // This is the newest closed position
    startTimestamp = Math.min(...activity.map((e) => e.timestamp));
  }

  const endTimestamp = position.timestamp;

  // Activity newer than the newest closed position belongs to the open position
  const newestClosedTimestamp = sorted[0].timestamp;

  return activity.filter((entry) => {
    if (entry.timestamp > newestClosedTimestamp) return false;
    return entry.timestamp >= startTimestamp && entry.timestamp <= endTimestamp;
  });
}

export function getPositionActivity({
  position,
  activity,
  closedPositions = [],
}: {
  position: Position;
  activity: Activity[];
  closedPositions?: ClosedPosition[];
}): ProcessedActivity[] {
  console.log("position", position);
  console.log("activity", activity);
  console.log("closedPositions", closedPositions);

  if (isOpenPosition(position)) {
    return getOpenPositionActivity({
      position,
      activity,
      closedPositions,
    });
  } else {
    return getClosedPositionActivity({
      position,
      activity,
      closedPositions,
    });
  }
}

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
  const reversedActivity = [...activity].reverse();
  const newActivityEntries: ProcessedActivity[] = [];

  for (const entry of reversedActivity) {
    // exposure INCREASE events
    if (entry.type === "TRADE" && entry.side === "BUY") {
      exposure += entry.size ?? 0;
    } else if (entry.type === "SPLIT") {
      exposure += entry.size ?? 0;
    }
    // ??????????????????????????
    // if (entry.type === "CONVERT") {
    //   exposure -= entry.size ?? 0;
    // }

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
