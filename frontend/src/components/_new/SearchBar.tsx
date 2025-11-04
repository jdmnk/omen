"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { Search } from "lucide-react";
import { useMarketSearchQuery } from "@/lib/queries/search.query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  onSelectMarket: (slug: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  onSelectMarket,
  placeholder = "Search markets...",
  className = "",
}: SearchBarProps) {
  const [input, setInput] = useState<string>("");
  const [debouncedInput] = useDebounce(input, 200);

  const { data: searchResults, isLoading } = useMarketSearchQuery(
    debouncedInput,
    debouncedInput.trim().length > 0
  );

  // Extract markets from events and flatten them
  const markets = useMemo(() => {
    if (!searchResults?.events) return [];
    return searchResults.events
      .flatMap((event) =>
        (event.markets || []).map((market) => ({
          ...market,
          eventTitle: event.title,
          eventSlug: event.slug,
        }))
      )
      .filter((market) => market.active && !market.closed);
  }, [searchResults]);

  const handleSelect = (slug: string) => {
    onSelectMarket(slug);
    setInput("");
  };

  const showResults = debouncedInput.trim().length > 0;

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
          className="pl-9 border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
        />
      </div>

      {/* Results below */}
      {showResults && (
        <ScrollArea className="flex-1 mt-2">
          <div className="space-y-1">
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Spinner size="sm" />
              </div>
            )}
            {!isLoading && markets.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No markets found.
              </div>
            )}
            {!isLoading &&
              markets.length > 0 &&
              markets.map((market) => (
                <button
                  key={market.slug}
                  onClick={() => handleSelect(market.slug)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{market.question}</div>
                    <div className="text-xs text-muted-foreground">
                      /{market.slug}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
