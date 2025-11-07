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

const INITIAL_LIMIT = 10;

function SearchResultItem({
  title,
  image,
  onClick,
  leftValue,
  rightValue,
}: {
  title: string;
  image?: string | null;
  onClick: () => void;
  leftValue?: React.ReactNode;
  rightValue?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 text-xs",
        "hover:bg-brand-background",
        "transition-colors cursor-pointer",
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
}: {
  title: string;
  items: unknown[];
  isExpanded: boolean;
  onToggle: () => void;
  renderItem: (item: unknown, index: number) => React.ReactNode;
  emptyMessage: string;
}) {
  if (items.length === 0) return null;

  const displayItems = isExpanded ? items : items.slice(0, INITIAL_LIMIT);
  const hasMore = items.length > INITIAL_LIMIT;

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
                <span className="text-xs">Show all</span>
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
  const [expandedEventMarkets, setExpandedEventMarkets] = useState(false);
  const router = useRouter();

  // Get event ID from current market
  const eventId = currentMarket?.events?.[0]?.id;

  // Fetch event data
  const { data: eventData } = useEventByIdQuery(eventId);

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
    return (searchResults?.events || []).map((event) => ({
      ...event,
      displayImage: event.image || event.icon,
    }));
  }, [searchResults]);

  // Parse event markets from the raw event data
  const eventMarkets = useMemo(() => {
    if (!eventData?.raw?.markets) return [];
    return eventData.raw.markets
      .filter((m: any) => m.active && !m.closed)
      .map((market: any) => ({
        id: market.id,
        question: market.question,
        conditionId: market.conditionId,
        slug: market.slug,
        icon: market.icon,
        image: market.image,
        displayImage: market.image || market.icon,
        outcomePrices: market.outcomePrices,
        volume: market.volume,
      }));
  }, [eventData]);

  const handleSelectMarket = (slug: string) => {
    router.push(`/market/${slug}`);
  };

  const handleSelectEvent = (slug: string) => {
    // TODO: Implement event page route
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
            renderItem={(market, index) => {
              const m = market as (typeof eventMarkets)[0];
              const odds = parseOutcomePrice(m.outcomePrices);
              const volume = parseVolume(m.volume);

              return (
                <SearchResultItem
                  title={m.question}
                  image={m.displayImage}
                  onClick={() => handleSelectMarket(m.slug)}
                  leftValue={
                    odds !== null ? (
                      <span className="text-outcome-neutral">
                        p{" "}
                        <span className="font-bold">
                          {formatNumber(odds * 100, 1)}%
                        </span>
                      </span>
                    ) : undefined
                  }
                  rightValue={
                    volume > 0 ? (
                      <span>
                        vol{" "}
                        <span className="font-bold">
                          {formatCompactCurrency(volume, 0)}
                        </span>
                      </span>
                    ) : undefined
                  }
                />
              );
            }}
          />
        </div>
      )}

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
                renderItem={(market, index) => {
                  const m = market as (typeof markets)[0];
                  const odds = parseOutcomePrice(m.outcomePrices);
                  const volume = parseVolume(m.volume);

                  return (
                    <SearchResultItem
                      title={m.question}
                      image={m.displayImage}
                      onClick={() => handleSelectMarket(m.slug)}
                      leftValue={
                        odds !== null ? (
                          <span className="text-outcome-neutral">
                            p{" "}
                            <span className="font-bold">
                              {formatNumber(odds * 100, 1)}%
                            </span>
                          </span>
                        ) : undefined
                      }
                      rightValue={
                        volume > 0 ? (
                          <span>
                            vol{" "}
                            <span className="font-bold">
                              {formatCompactCurrency(volume, 0)}
                            </span>
                          </span>
                        ) : undefined
                      }
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
                renderItem={(event, index) => {
                  const e = event as (typeof events)[0];
                  const volume = e.volume24hr || e.volume || 0;

                  return (
                    <SearchResultItem
                      title={e.title}
                      image={e.displayImage}
                      onClick={() => handleSelectEvent(e.slug)}
                      leftValue={
                        e.markets && e.markets.length > 0 ? (
                          <span className="text-outcome-neutral">
                            {e.markets.length === 1 ? "market" : "markets"}{" "}
                            <span className="font-bold">
                              {e.markets.length}
                            </span>
                          </span>
                        ) : undefined
                      }
                      rightValue={
                        volume > 0 ? (
                          <span>
                            vol{" "}
                            <span className="font-bold">
                              {formatCompactCurrency(volume, 0)}
                            </span>
                          </span>
                        ) : undefined
                      }
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
