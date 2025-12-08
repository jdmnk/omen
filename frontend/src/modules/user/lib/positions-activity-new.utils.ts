import {
  ClosedPosition,
  MarketActivityChartModel,
  MarketActivityEntry,
  UserPosition,
} from "@/lib/models/api.models";
import { isOpenPosition, Position } from "../userActivity.types";

const EPSILON = 1e-3;

function createPositionOpenedEntry(
  context: Position,
  timestamp: number
): MarketActivityChartModel {
  return {
    type: "POSITION_OPENED",
    timestamp,
    conditionId: context.conditionId,
    outcome: context.outcome,
    outcomeIndex: context.outcomeIndex,
    title: context.title,
    slug: context.slug,
    eventSlug: context.eventSlug,
    cumExposure: 0,
    countActivities: 0,
  };
}

function createPositionClosedEntry(
  context: Position,
  timestamp: number
): MarketActivityChartModel {
  return {
    type: "POSITION_CLOSED",
    timestamp,
    conditionId: context.conditionId,
    outcome: context.outcome,
    outcomeIndex: context.outcomeIndex,
    title: context.title,
    slug: context.slug,
    eventSlug: context.eventSlug,
    cumExposure: 0,
    countActivities: 0,
  };
}

function createCombinedTradeEntry(
  context: Position,
  timestamp: number,
  size: number,
  side: string,
  countActivities: number,
  cumExposure: number
): MarketActivityChartModel {
  return {
    type: "TRADE",
    timestamp,
    conditionId: context.conditionId,
    outcome: context.outcome,
    outcomeIndex: context.outcomeIndex,
    title: context.title,
    slug: context.slug,
    eventSlug: context.eventSlug,
    size: size,
    side: side,
    cumExposure,
    countActivities,
  };
}

function combineConsecutiveTrades(
  list: MarketActivityEntry[]
): MarketActivityEntry[] {
  const result: MarketActivityEntry[] = [];
  let buffer: MarketActivityEntry | null = null;
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

/**
 *
 * @param entries - sorted by timestamp DESC
 * @param closedPositions - sorted by timestamp DESC
 * @param context - the position context
 * @returns
 */
export function buildPositionActivityTimeline({
  activityEntries,
  closedPositions = [],
  context,
  combineConsecutiveEvents,
}: {
  activityEntries: MarketActivityEntry[];
  closedPositions?: ClosedPosition[];
  context: Position;
  combineConsecutiveEvents?: boolean;
}): MarketActivityChartModel[] {
  console.log("activityEntries", activityEntries);
  console.log("closedPositions", closedPositions);
  console.log("context", context);

  // if we have other positions,

  // only TRADES for now
  if (combineConsecutiveEvents) {
    const reversedActivity = [...activityEntries].reverse();
    activityEntries = combineConsecutiveTrades(reversedActivity).reverse();
  }

  // if there's no closed positions, then all entries belong to the current open position
  // if (closedPositions.length === 0) {
  //   return [
  //     ...activityEntries,
  //     createPositionOpenedEntry(context, activityEntries[0].timestamp),
  //   ];
  // }

  // create a full projection of the position activity timeline
  let currentOpenAmount = 0;
  let currentActivityCount = 0;
  const reversedActivity = [...activityEntries].reverse();
  const newActivityEntries: MarketActivityChartModel[] = [];

  // TODO: handle other types of events that could open a position
  for (const entry of reversedActivity) {
    // we assume first historical trade was what opened the position
    if (
      entry.type === "TRADE" &&
      entry.side === "BUY" &&
      currentOpenAmount === 0
    ) {
      newActivityEntries.push(
        createPositionOpenedEntry(context, entry.timestamp - 1)
      );
    }
    // if (entry.type === "SPLIT") {
    // BUYS add to open amount
    if (entry.type === "TRADE" && entry.side === "BUY") {
      currentOpenAmount += entry.size ?? 0; // in TRADE we always have size tho
      currentActivityCount++;
      newActivityEntries.push({
        ...entry,
        cumExposure: currentOpenAmount,
        countActivities: currentActivityCount,
      });
    }
    // SELLS subtract from open amount
    else if (entry.type === "TRADE" && entry.side === "SELL") {
      currentOpenAmount -= entry.size ?? 0; // in TRADE we always have size tho
      currentActivityCount++;
      newActivityEntries.push({
        ...entry,
        cumExposure: currentOpenAmount,
        countActivities: currentActivityCount,
      });
    }

    // this is also a close of a position (means the event finished)
    if (entry.type === "REDEEM") {
      newActivityEntries.push({
        ...entry,
        cumExposure: currentOpenAmount,
        countActivities: currentActivityCount,
      });
      currentOpenAmount = 0;
      currentActivityCount = 0;
    }

    // when current open amount drops to 0, user sold all their holdings
    // REDEEM also triggers here
    if (currentActivityCount > 0 && currentOpenAmount === 0) {
      newActivityEntries.push(
        createPositionClosedEntry(context, entry.timestamp + 1)
      );
    }
  }

  // reverse back to timestamp DESC
  const reversedNewActivityEntries = newActivityEntries.reverse();

  return reversedNewActivityEntries;
}

export function buildOpenPositionActivityTimeline({
  position,
  activityEntries,
  closedPositions = [],
}: {
  position: UserPosition;
  activityEntries: MarketActivityEntry[];
  closedPositions?: ClosedPosition[];
}): MarketActivityChartModel[] {
  /*
    If current position is open, we can simply return all position activity AFTER the last closed position's timestamp
  */

  if (closedPositions.length > 0) {
    // Ensure closed positions are sorted by timestamp DESC
    closedPositions = closedPositions.sort((a, b) => b.timestamp - a.timestamp);
    const lastClosedPosition = closedPositions[closedPositions.length - 1];
    const lastClosedPositionTimestamp = lastClosedPosition.timestamp;
    return activityEntries.filter(
      (entry) => entry.timestamp > lastClosedPositionTimestamp
    );
  }
  return activityEntries;
}

export function buildClosedPositionActivityTimeline({
  position,
  activityEntries,
  closedPositions = [],
}: {
  position: ClosedPosition;
  activityEntries: MarketActivityEntry[];
  closedPositions?: ClosedPosition[];
}): MarketActivityChartModel[] {
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
    startTimestamp = Math.min(...activityEntries.map((e) => e.timestamp));
  }

  const endTimestamp = position.timestamp;

  // Activity newer than the newest closed position belongs to the open position
  const newestClosedTimestamp = sorted[0].timestamp;

  return activityEntries.filter((entry) => {
    if (entry.timestamp > newestClosedTimestamp) return false;
    return entry.timestamp >= startTimestamp && entry.timestamp <= endTimestamp;
  });
}

export function buildPositionActivityTimeline2({
  position,
  activityEntries,
  closedPositions = [],
}: {
  position: Position;
  activityEntries: MarketActivityEntry[];
  closedPositions?: ClosedPosition[];
}): MarketActivityChartModel[] {
  console.log("position", position);
  console.log("activityEntries", activityEntries);
  console.log("closedPositions", closedPositions);
  if (isOpenPosition(position)) {
    return buildOpenPositionActivityTimeline({
      position,
      activityEntries,
      closedPositions,
    });
  } else {
    return buildClosedPositionActivityTimeline({
      position,
      activityEntries,
      closedPositions,
    });
  }
}
