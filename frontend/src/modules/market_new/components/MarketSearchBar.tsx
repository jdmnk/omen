"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { parseOutcomePrice, parseVolume } from "@/lib/api-parse.utils";
import { useMarketSearchQuery } from "../lib/queries/search.query";

export function MarketSearchBar() {
  const [input, setInput] = useState("");
  const [debouncedInput] = useDebounce(input, 250);
  const [isOpen, setIsOpen] = useState(false);
  const [contentWidth, setContentWidth] = useState<number>();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const trimmedQuery = debouncedInput.trim();
  const shouldQuery = trimmedQuery.length > 0;

  const { data: searchData, isLoading } = useMarketSearchQuery(
    trimmedQuery,
    shouldQuery
  );

  const markets = useMemo(() => searchData?.markets ?? [], [searchData]);
  const events = useMemo(() => searchData?.events ?? [], [searchData]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContentWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    setContentWidth(containerRef.current.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const handleSelectMarket = useCallback(
    (slug: string) => {
      if (!slug) return;
      router.push(`/market/${slug}`);
      setIsOpen(false);
    },
    [router]
  );

  const handleSelectEvent = useCallback(
    (event: (typeof events)[number]) => {
      if (!event.markets || event.markets.length === 0) return;
      const marketWithMostVolume = event.markets.reduce((max, current) => {
        const currentVolume = parseVolume(current.volume || "0");
        const maxVolume = parseVolume(max.volume || "0");
        return currentVolume > maxVolume ? current : max;
      });
      handleSelectMarket(marketWithMostVolume.slug);
    },
    [handleSelectMarket]
  );

  const showDropdown = isOpen && trimmedQuery.length > 0;
  const hasResults = markets.length > 0 || events.length > 0;

  return (
    <Popover open={showDropdown} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div ref={containerRef} className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search markets..."
              className="pl-9 pr-4 border border-brand-stroke text-sm md:text-base"
            />

            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="p-0 shadow-lg"
        align="start"
        sideOffset={6}
        style={{ width: contentWidth ? `${contentWidth}px` : undefined }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}

            {!isLoading && (
              <>
                <CommandEmpty className="py-3 text-muted-foreground text-sm px-2.5">
                  No markets found.
                </CommandEmpty>
                {hasResults && (
                  <>
                    {markets.length > 0 && (
                      <CommandGroup heading="Markets">
                        {markets.map((market) => {
                          const odds = parseOutcomePrice(market.outcomePrices);
                          const volume = parseVolume(market.volume || "0");
                          const secondaryLabel = [
                            odds !== null
                              ? `${formatNumber(odds * 100, 1)}%`
                              : null,
                            volume > 0
                              ? `vol ${formatCompactCurrency(volume, 0)}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ");
                          const image = market.image || market.icon || null;

                          return (
                            <CommandItem
                              key={market.slug}
                              onSelect={() => handleSelectMarket(market.slug)}
                              className="gap-2.5 px-2.5 py-2 cursor-pointer"
                            >
                              <div className="relative h-9 w-9 overflow-hidden rounded-full border bg-muted/40">
                                {image ? (
                                  <Image
                                    src={image}
                                    alt={market.question}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Search className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="truncate text-sm font-semibold leading-tight">
                                  {market.question}
                                </div>
                                {secondaryLabel && (
                                  <div className="truncate text-[11px] text-muted-foreground">
                                    {secondaryLabel}
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}

                    {markets.length > 0 && events.length > 0 && (
                      <CommandSeparator />
                    )}

                    {events.length > 0 && (
                      <CommandGroup heading="Events">
                        {events.map((event) => {
                          const volume = event.volume24hr || event.volume || 0;
                          const marketCount = event.markets?.length || 0;
                          const secondaryLabel = [
                            marketCount > 0
                              ? `${marketCount} ${
                                  marketCount === 1 ? "market" : "markets"
                                }`
                              : null,
                            volume > 0
                              ? `vol ${formatCompactCurrency(volume, 0)}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ");
                          const image = event.image || event.icon || null;

                          return (
                            <CommandItem
                              key={event.slug}
                              onSelect={() => handleSelectEvent(event)}
                              className="gap-2.5 px-2.5 py-2 cursor-pointer"
                            >
                              <div className="relative h-9 w-9 overflow-hidden rounded-full border bg-muted/40">
                                {image ? (
                                  <Image
                                    src={image}
                                    alt={event.title}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Search className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="truncate text-sm font-semibold leading-tight">
                                  {event.title}
                                </div>
                                {secondaryLabel && (
                                  <div className="truncate text-[11px] text-muted-foreground">
                                    {secondaryLabel}
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
