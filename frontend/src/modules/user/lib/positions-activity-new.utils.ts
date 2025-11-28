import { ClosedPosition, MarketActivityEntry } from "@/lib/models/api.models";

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
): MarketActivityEntry {
  return {
    type: "POSITION_OPENED",
    timestamp,
    conditionId: context.conditionId,
    outcome: context.outcome,
    outcomeIndex: context.outcomeIndex,
    title: context.title,
    slug: context.slug,
    eventSlug: context.eventSlug,
  };
}

function createPositionClosedEntry(
  context: PositionContext,
  timestamp: number
): MarketActivityEntry {
  return {
    type: "POSITION_CLOSED",
    timestamp,
    conditionId: context.conditionId,
    outcome: context.outcome,
    outcomeIndex: context.outcomeIndex,
    title: context.title,
    slug: context.slug,
    eventSlug: context.eventSlug,
  };
}

function createCombinedTradeEntry(
  context: PositionContext,
  timestamp: number,
  size: number,
  side: string,
  count: number
): MarketActivityEntry {
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
    // count: count,
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
}): MarketActivityEntry[] {
  console.log("activityEntries", activityEntries);
  console.log("closedPositions", closedPositions);
  console.log("context", context);

  // only TRADES for now
  if (combineConsecutiveEvents) {
    const reversedActivity = [...activityEntries].reverse();
    activityEntries = combineConsecutiveTrades(reversedActivity).reverse();
  }

  // if there's no closed positions, then all entries belong to the current open position
  if (closedPositions.length === 0) {
    return [
      ...activityEntries,
      createPositionOpenedEntry(context, activityEntries[0].timestamp),
    ];
  }

  // create a full projection of the position activity timeline
  let currentOpenAmount = 0;
  let currentActivityCount = 0;
  const reversedActivity = [...activityEntries].reverse();
  const newActivityEntries: MarketActivityEntry[] = [];

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
      newActivityEntries.push(entry);
    }
    // SELLS subtract from open amount
    else if (entry.type === "TRADE" && entry.side === "SELL") {
      currentOpenAmount -= entry.size ?? 0; // in TRADE we always have size tho
      currentActivityCount++;
      newActivityEntries.push(entry);
    }

    // this is also a close of a position (means the event finished)
    if (entry.type === "REDEEM") {
      currentOpenAmount = 0;
      currentActivityCount = 0;
      newActivityEntries.push(entry);
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
