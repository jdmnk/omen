"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useMarketSearchQuery } from "@/lib/queries/search.query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  onSelectMarket: (slug: string) => void;
  placeholder?: string;
  className?: string;
};

const INITIAL_LIMIT = 20;

function parseOutcomePrice(
  outcomePrices: string | null | undefined
): number | null {
  if (!outcomePrices) return null;
  try {
    const prices = outcomePrices.split(",").map((p) => parseFloat(p.trim()));
    // Return the first price (typically YES price)
    return prices.length > 0 && !isNaN(prices[0]) ? prices[0] : null;
  } catch {
    return null;
  }
}

function parseVolume(volume: string | null | undefined): number {
  if (!volume) return 0;
  const num = parseFloat(volume);
  return isNaN(num) ? 0 : num;
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
    <div className="space-y-2">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
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

export function SearchBar({
  onSelectMarket,
  placeholder = "Search markets...",
  className = "",
}: SearchBarProps) {
  const [input, setInput] = useState<string>("");
  const [debouncedInput] = useDebounce(input, 200);
  const [expandedMarkets, setExpandedMarkets] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState(false);

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

  const handleSelectMarket = (slug: string) => {
    onSelectMarket(slug);
    setInput("");
  };

  const handleSelectEvent = (slug: string) => {
    // For now, navigate to first market if available, otherwise just use slug
    // TODO: Create event page route if needed
    const event = events.find((e) => e.slug === slug);
    if (event?.markets && event.markets.length > 0) {
      handleSelectMarket(event.markets[0].slug);
    } else {
      // Fallback: navigate to market page with event slug (might not work)
      handleSelectMarket(slug);
    }
  };

  const showResults = debouncedInput.trim().length > 0;
  const hasResults = (markets.length > 0 || events.length > 0) && !isLoading;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Fixed input at top */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="pl-9 border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none rounded-none"
        />
      </div>

      {/* Results below */}
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
                    <button
                      key={m.slug || index}
                      onClick={() => handleSelectMarket(m.slug)}
                      className={cn(
                        "w-full text-left rounded-md px-3 py-2 text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Market Image */}
                        <div className="shrink-0">
                          {m.displayImage ? (
                            <div className="w-10 h-10 relative">
                              <Image
                                src={m.displayImage}
                                alt={m.question}
                                width={40}
                                height={40}
                                className="rounded-md border object-contain w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center">
                              <Search className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>

                        {/* Market Info */}
                        <div className="flex-1 min-w-0">
                          {/* First row: Title */}
                          <div className="font-medium truncate mb-1">
                            {m.question}
                          </div>

                          {/* Second row: Odds, Volume */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {odds !== null && (
                              <span className="font-medium">
                                {formatNumber(odds * 100, 1)}%
                              </span>
                            )}
                            {volume > 0 && (
                              <span>{formatCurrency(volume)} vol</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
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
                    <button
                      key={e.slug || index}
                      onClick={() => handleSelectEvent(e.slug)}
                      className={cn(
                        "w-full text-left rounded-md px-3 py-2 text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        "transition-colors cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Event Image */}
                        <div className="shrink-0">
                          {e.displayImage ? (
                            <div className="w-10 h-10 relative">
                              <Image
                                src={e.displayImage}
                                alt={e.title}
                                width={40}
                                height={40}
                                className="rounded-md border object-contain w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center">
                              <Search className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          {/* First row: Title */}
                          <div className="font-medium truncate mb-1">
                            {e.title}
                          </div>

                          {/* Second row: Volume */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {volume > 0 && (
                              <span>{formatCurrency(volume)} 24h</span>
                            )}
                            {e.markets && e.markets.length > 0 && (
                              <span className="text-muted-foreground/70">
                                {e.markets.length}{" "}
                                {e.markets.length === 1 ? "market" : "markets"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
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
