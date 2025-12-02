import {
  ClosedPosition,
  MarketActivityChartModel,
  MarketActivityEntry,
} from "@/lib/models/api.models";

type PositionContext = {
  conditionId: string;
  outcome?: string | null;
  outcomeIndex?: number | null;
  title?: string | null;
  slug?: string | null;
  eventSlug?: string | null;
};
const EPSILON = 1e-3;

function createPositionOpenedEntry(
  context: PositionContext,
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
  context: PositionContext,
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
  context: PositionContext,
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
  context: PositionContext;
  combineConsecutiveEvents?: boolean;
}): MarketActivityChartModel[] {
  console.log("activityEntries", activityEntries);
  console.log("closedPositions", closedPositions);
  console.log("context", context);

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
        createPositionOpenedEntry(context, entry.timestamp)
      );
    }
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
        createPositionClosedEntry(context, entry.timestamp)
      );
    }
  }

  // reverse back to timestamp DESC
  const reversedNewActivityEntries = newActivityEntries.reverse();

  return reversedNewActivityEntries;
}
