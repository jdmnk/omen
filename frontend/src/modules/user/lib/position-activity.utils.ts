import type {
  ClosedPosition,
  MarketActivityEntry,
} from "@/lib/models/frontend.models";

type PositionContext = {
  conditionId: string;
  outcome?: string | null;
  outcomeIndex?: number | null;
  title?: string | null;
  slug?: string | null;
  eventSlug?: string | null;
};

const EPSILON = 1e-6;

function isOutcomeMatch(
  entryOutcomeIndex: number | null | undefined,
  targetOutcomeIndex: number | null | undefined
) {
  if (targetOutcomeIndex === null || targetOutcomeIndex === undefined) {
    return true;
  }
  if (entryOutcomeIndex === null || entryOutcomeIndex === undefined) {
    return true;
  }
  return entryOutcomeIndex === targetOutcomeIndex;
}

function normalizeTimestamp(value?: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildLifecycleIntervals(
  entries: MarketActivityEntry[],
  outcomeIndex?: number | null
) {
  const trades = entries
    .filter(
      (entry) =>
        entry.type === "TRADE" &&
        isOutcomeMatch(entry.outcomeIndex, outcomeIndex) &&
        entry.timestamp !== undefined &&
        entry.timestamp !== null
    )
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp);

  let runningSize = 0;
  const intervals: { openedAt: number; closedAt?: number }[] = [];
  let currentInterval: { openedAt: number; closedAt?: number } | null = null;

  trades.forEach((trade) => {
    const side = (trade.side ?? "").toUpperCase();
    const size = trade.size ?? 0;
    const delta =
      side === "BUY" ? size : side === "SELL" ? -size : 0;

    const nextSize = runningSize + delta;

    if (Math.abs(runningSize) < EPSILON && Math.abs(nextSize) >= EPSILON) {
      currentInterval = { openedAt: trade.timestamp };
    }

    if (currentInterval && Math.abs(nextSize) < EPSILON) {
      currentInterval.closedAt = trade.timestamp;
      intervals.push(currentInterval);
      currentInterval = null;
    }

    runningSize = nextSize;
  });

  if (currentInterval) {
    intervals.push(currentInterval);
  }

  return intervals;
}

function buildLifecycleEntries(
  intervals: { openedAt: number; closedAt?: number }[],
  context: PositionContext
): MarketActivityEntry[] {
  const entries: MarketActivityEntry[] = [];

  intervals.forEach((interval, index) => {
    entries.push({
      type: "POSITION_OPENED",
      timestamp: interval.openedAt,
      conditionId: context.conditionId,
      outcome: context.outcome ?? null,
      outcomeIndex: context.outcomeIndex ?? null,
      title: context.title ?? null,
      slug: context.slug ?? null,
      eventSlug: context.eventSlug ?? null,
      transactionHash: `opened-${context.conditionId}-${context.outcomeIndex}-${index}`,
    });

    if (interval.closedAt) {
      entries.push({
        type: "POSITION_CLOSED",
        timestamp: interval.closedAt,
        conditionId: context.conditionId,
        outcome: context.outcome ?? null,
        outcomeIndex: context.outcomeIndex ?? null,
        title: context.title ?? null,
        slug: context.slug ?? null,
        eventSlug: context.eventSlug ?? null,
        transactionHash: `closed-${context.conditionId}-${context.outcomeIndex}-${index}`,
      });
    }
  });

  return entries;
}

function buildClosedPositionEntries(
  closedPositions: ClosedPosition[],
  context: PositionContext,
  existingClosedTimestamps: Set<number>
): MarketActivityEntry[] {
  return closedPositions.map((position, index) => ({
    type: "POSITION_CLOSED",
    timestamp: normalizeTimestamp(position.timestamp) ?? position.timestamp,
    conditionId: position.conditionId ?? context.conditionId,
    outcome: position.outcome ?? context.outcome ?? null,
    outcomeIndex: position.outcomeIndex ?? context.outcomeIndex ?? null,
    title: position.title ?? context.title ?? null,
    slug: position.slug ?? context.slug ?? null,
    eventSlug: position.eventSlug ?? context.eventSlug ?? null,
    transactionHash: `closed-api-${position.conditionId}-${position.outcomeIndex}-${index}`,
  })).filter((entry) => {
    const ts = entry.timestamp ?? 0;
    return !existingClosedTimestamps.has(ts);
  });
}

export function buildPositionActivityTimeline({
  entries,
  closedPositions = [],
  context,
}: {
  entries: MarketActivityEntry[];
  closedPositions?: ClosedPosition[];
  context: PositionContext;
}) {
  const intervals = buildLifecycleIntervals(entries, context.outcomeIndex);

  const closedTimestamps = new Set(
    intervals
      .map((interval) => interval.closedAt)
      .filter((value): value is number => value !== undefined)
  );

  const lifecycleEntries = buildLifecycleEntries(intervals, context);

  const closedEntries = buildClosedPositionEntries(
    closedPositions,
    context,
    closedTimestamps
  );

  const combined = [...entries, ...lifecycleEntries, ...closedEntries];

  const deduped = new Map<string, MarketActivityEntry>();

  combined.forEach((entry) => {
    const key = `${entry.type}-${entry.timestamp ?? "na"}-${
      entry.outcomeIndex ?? "all"
    }`;
    if (!deduped.has(key)) {
      deduped.set(key, entry);
    }
  });

  return Array.from(deduped.values())
    .filter((entry) =>
      isOutcomeMatch(entry.outcomeIndex, context.outcomeIndex)
    )
    .sort((a, b) => {
      const aTime = a.timestamp ?? 0;
      const bTime = b.timestamp ?? 0;
      if (aTime === bTime) return 0;
      return bTime - aTime;
    });
}
