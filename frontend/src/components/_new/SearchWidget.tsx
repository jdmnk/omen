"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useMarketSearchQuery } from "@/lib/queries/search.query";
import { useEventByIdQuery } from "@/lib/queries/event-by-id.query";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatNumber, formatCompactCurrency } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { parseOutcomePrice, parseVolume } from "@/lib/api-parse.utils";
import { Market } from "@/lib/models/api.models";
import { WatchlistWidget } from "./WatchlistWidget";

const INITIAL_LIMIT = 10;

function renderVolumeValue(volume: number) {
  if (volume <= 0) return undefined;
  return (
    <span>
      vol <span className="font-bold">{formatCompactCurrency(volume, 0)}</span>
    </span>
  );
}

function renderOddsValue(odds: number | null) {
  if (odds === null || odds <= 0) return undefined;
  return (
    <span className="text-outcome-neutral">
      p <span className="font-bold">{formatNumber(odds * 100, 1)}%</span>
    </span>
  );
}

function renderMarketCountValue(count: number) {
  if (count <= 0) return undefined;
  return (
    <span className="text-outcome-neutral">
      {count === 1 ? "market" : "markets"}{" "}
      <span className="font-bold">{count}</span>
    </span>
  );
}

function SearchResultItem({
  title,
  image,
  onClick,
  leftValue,
  rightValue,
  disabled,
}: {
  title: string;
  image?: string | null;
  onClick: () => void;
  leftValue?: React.ReactNode;
  rightValue?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left px-3 py-2 text-xs",
        "transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-brand-background cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="shrink-0">
          {image ? (
            <div className="w-10 h-10 relative">
              <Image
                src={image}
                alt={title}
                width={40}
                height={40}
                className={"rounded-md border object-contain w-full h-full"}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center">
              <Search className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* First row: Title */}
          <div className="font-medium truncate mb-1">{title}</div>

          {/* Second row: Left and right values */}
          {(leftValue || rightValue) && (
            <div className="grid items-center gap-3 text-xs text-muted-foreground w-full grid-cols-[80px_1fr]">
              <div>{leftValue}</div>
              <div>{rightValue}</div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function SearchSection({
  title,
  items,
  isExpanded,
  onToggle,
  renderItem,
  emptyMessage,
  collapsedInitialCount = INITIAL_LIMIT,
}: {
  title: string;
  items: unknown[];
  isExpanded: boolean;
  onToggle: () => void;
  renderItem: (item: unknown, index: number) => React.ReactNode;
  emptyMessage: string;
  collapsedInitialCount?: number;
}) {
  if (items.length === 0) return null;

  const displayItems = isExpanded
    ? items
    : items.slice(0, collapsedInitialCount);
  const hasMore = items.length > collapsedInitialCount;
  const remainingCount = items.length - collapsedInitialCount;

  return (
    <div>
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1 text-xs text-brand-foreground hover:text-brand-foreground/80 transition-colors cursor-pointer"
      >
        <span>
          {title} ({items.length})
        </span>
        {hasMore && (
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <>
                <span className="text-xs">Show less</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span className="text-xs">Show {remainingCount} more</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </div>
        )}
      </button>

      {/* Section Items */}
      <div className="space-y-1">
        {displayItems.map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
      </div>
    </div>
  );
}

export function SearchWidget({ currentMarket }: { currentMarket?: Market }) {
  const [input, setInput] = useState<string>("");
  const [debouncedInput] = useDebounce(input, 200);
  const [expandedMarkets, setExpandedMarkets] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState(false);
  const [expandedEventMarkets, setExpandedEventMarkets] = useState(true);
  const [expandedClosedMarkets, setExpandedClosedMarkets] = useState(true);
  const router = useRouter();

  // Get event ID from current market
  const eventId = currentMarket?.events?.[0]?.id;

  // Fetch event data
  const { data: eventData } = useEventByIdQuery(eventId);
  console.log("eventData", eventData);

  const { data: searchResults, isLoading } = useMarketSearchQuery(
    debouncedInput,
    debouncedInput.trim().length > 0
  );

  const markets = useMemo(() => {
    return (searchResults?.markets || []).map((market) => ({
      ...market,
      displayImage: market.image || market.icon,
    }));
  }, [searchResults]);

  const events = useMemo(() => {
    return (searchResults?.events || [])
      .filter((event) => !event.markets || event.markets.length !== 1)
      .map((event) => ({
        ...event,
        displayImage: event.image || event.icon,
      }));
  }, [searchResults]);

  // Parse event markets from the raw event data
  const { activeEventMarkets, closedEventMarkets } = useMemo(() => {
    if (!eventData?.markets)
      return { activeEventMarkets: [], closedEventMarkets: [] };

    const activeMarkets = eventData.markets
      .filter((m) => !m.closed && m.active)
      .map((market) => ({
        question: market.groupItemTitle,
        conditionId: market.conditionId,
        slug: market.slug,
        icon: market.icon,
        image: market.image,
        displayImage: market.image || market.icon,
        outcomePrices: market.outcomePrices,
        volume: market.volume,
        odds: market.bestAsk - market.bestBid,
        closed: false,
      }));

    const closedMarkets = eventData.markets
      .filter((m) => m.closed && m.active) // must be active or its a market thats not live
      .map((market) => ({
        question: market.groupItemTitle,
        conditionId: market.conditionId,
        slug: market.slug,
        icon: market.icon,
        image: market.image,
        displayImage: market.image || market.icon,
        outcomePrices: market.outcomePrices,
        volume: market.volume,
        odds: market.bestAsk - market.bestBid,
        closed: true,
      }));

    return {
      activeEventMarkets: activeMarkets,
      closedEventMarkets: closedMarkets,
    };
  }, [eventData]);

  const eventMarkets = activeEventMarkets;

  const handleSelectMarket = (slug: string) => {
    router.push(`/market/${slug}`);
  };

  const handleSelectEvent = (event: (typeof events)[0]) => {
    if (!event.markets || event.markets.length === 0) {
      console.warn(`Event ${event.slug} has no markets`);
      return;
    }

    // Create a set of market slugs from direct market results for quick lookup
    const directMarketSlugs = new Set(markets.map((m) => m.slug));

    // Try to find a market from the event that also appears in direct market results
    const matchingMarket = event.markets.find((eventMarket) =>
      directMarketSlugs.has(eventMarket.slug)
    );

    if (matchingMarket) {
      // Found a match in direct results, navigate to it
      handleSelectMarket(matchingMarket.slug);
      return;
    }

    // No match found, find the market with the most volume
    const marketWithMostVolume = event.markets.reduce((max, current) => {
      const currentVolume = parseVolume(current.volume || "0");
      const maxVolume = parseVolume(max.volume || "0");
      return currentVolume > maxVolume ? current : max;
    });

    console.warn(
      `No matching market found in direct results for event ${event.slug}, navigating to market with highest volume: ${marketWithMostVolume.slug}`
    );

    handleSelectMarket(marketWithMostVolume.slug);
  };

  const showResults = debouncedInput.trim().length > 0;
  const hasResults = (markets.length > 0 || events.length > 0) && !isLoading;
  const showEventMarkets = !showResults && eventMarkets.length > 0;

  return (
    <div className="flex flex-col h-full rounded-brand">
      {/* Fixed input at top */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-foreground pointer-events-none z-10" />
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search markets..."
          className="pl-9"
        />
      </div>

      {/* Event Markets Section (shown when NOT searching) */}
      {showEventMarkets && (
        <div className="space-y-4">
          <SearchSection
            title={eventData?.title || "Event Markets"}
            items={eventMarkets}
            isExpanded={expandedEventMarkets}
            onToggle={() => setExpandedEventMarkets(!expandedEventMarkets)}
            emptyMessage="No markets in this event"
            renderItem={(market) => {
              const m = market as (typeof eventMarkets)[0];
              return (
                <SearchResultItem
                  title={m.question}
                  image={m.displayImage}
                  onClick={() => handleSelectMarket(m.slug)}
                  leftValue={renderOddsValue(m.odds || 0)}
                  rightValue={renderVolumeValue(m.volume)}
                />
              );
            }}
          />

          {/* Closed Markets Section (independent collapsible) */}
          <SearchSection
            title="Closed Markets"
            items={closedEventMarkets}
            isExpanded={expandedClosedMarkets}
            onToggle={() => setExpandedClosedMarkets(!expandedClosedMarkets)}
            emptyMessage="No closed markets"
            collapsedInitialCount={0}
            renderItem={(market) => {
              const m = market as (typeof closedEventMarkets)[0];
              return (
                <SearchResultItem
                  title={m.question}
                  image={m.displayImage}
                  onClick={() => handleSelectMarket(m.slug)}
                  disabled={true}
                  leftValue={renderVolumeValue(m.volume)}
                />
              );
            }}
          />
        </div>
      )}

      {/* Watchlisted Markets Section (shown when NOT searching) */}
      {!showResults && <WatchlistWidget />}

      {/* Results below (shown when searching) */}
      {showResults && (
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Spinner size="sm" />
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}

          {!isLoading && hasResults && (
            <>
              {/* Markets Section */}
              <SearchSection
                title="Markets"
                items={markets}
                isExpanded={expandedMarkets}
                onToggle={() => setExpandedMarkets(!expandedMarkets)}
                emptyMessage="No markets found"
                renderItem={(market) => {
                  const m = market as (typeof markets)[0];
                  const odds = parseOutcomePrice(m.outcomePrices);
                  const volume = parseVolume(m.volume);

                  return (
                    <SearchResultItem
                      title={m.question}
                      image={m.displayImage}
                      onClick={() => handleSelectMarket(m.slug)}
                      leftValue={renderOddsValue(odds)}
                      rightValue={renderVolumeValue(volume)}
                    />
                  );
                }}
              />

              {/* Events Section */}
              <SearchSection
                title="Events"
                items={events}
                isExpanded={expandedEvents}
                onToggle={() => setExpandedEvents(!expandedEvents)}
                emptyMessage="No events found"
                renderItem={(event) => {
                  const e = event as (typeof events)[0];
                  const volume = e.volume24hr || e.volume || 0;
                  const marketCount = e.markets?.length || 0;

                  return (
                    <SearchResultItem
                      title={e.title}
                      image={e.displayImage}
                      onClick={() => handleSelectEvent(e)}
                      leftValue={renderMarketCountValue(marketCount)}
                      rightValue={renderVolumeValue(volume)}
                    />
                  );
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
