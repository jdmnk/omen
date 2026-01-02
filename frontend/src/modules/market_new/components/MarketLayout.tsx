"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Market } from "@/lib/models/api.models";
import { useMarketBySlugQuery } from "../lib/queries/market-by-slug.query";
import { PriceChartWidget } from "./PriceChartWidget";
import { MarketOrderBookSection } from "./MarketOrderBookSection";
import { MarketPositionsSection } from "./MarketPositionsSection";
import { MarketRulesSection } from "./MarketRulesSection";
import { ErrorState, LoadingState } from "./WidgetHelpers";
import { LogoIcon } from "@/components/LogoIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FontSizeControl } from "@/components/FontSizeControl";
import { MarketSearchBar } from "./MarketSearchBar";
import { MarketWatchlist } from "./MarketWatchlist";
import { TopMoversWidget } from "./TopMoversWidget";

export function MarketLayout({
  initialMarket,
}: {
  initialMarket?: Market | null;
}) {
  const [isOrderBookOpen, setIsOrderBookOpen] = useState(false);
  const params = useParams();
  const marketSlug = params?.slug as string | undefined;

  const {
    data: market,
    isLoading,
    error,
  } = useMarketBySlugQuery(marketSlug, initialMarket);

  if (!marketSlug) {
    return (
      <div className="container mx-auto p-3 md:p-6 space-y-3 md:space-y-5">
        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/" className="shrink-0">
            <div className="flex items-center gap-2">
              <LogoIcon className="h-8 w-8 text-foreground" />
              <span className="text-xl font-bold text-foreground tracking-widest">
                OMEN
              </span>
            </div>
          </Link>
          <div className="flex-1 max-w-2xl">
            <MarketSearchBar />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <ThemeToggle />
            <FontSizeControl />
          </div>
        </div>
        <MarketWatchlist />
        <div className="min-h-[520px]">
          <TopMoversWidget />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-3 md:space-y-5">
      <div className="flex items-center gap-3 md:gap-5">
        <Link href="/" className="shrink-0">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8 text-foreground" />
            <span className="text-xl font-bold text-foreground tracking-widest">
              OMEN
            </span>
          </div>
        </Link>
        <div className="flex-1 max-w-2xl">
          <MarketSearchBar />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <ThemeToggle />
          <FontSizeControl />
        </div>
      </div>
      <MarketWatchlist />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="min-h-[300px] md:flex-[2]">
            {isLoading ? (
              <LoadingState />
            ) : error || !market ? (
              <ErrorState />
            ) : (
              <PriceChartWidget market={market} />
            )}
          </div>
          <div className="hidden min-h-[300px] lg:block lg:flex-1">
            {error || !market ? (
              <ErrorState />
            ) : (
              <MarketOrderBookSection market={market} />
            )}
          </div>
        </div>
        {!error && market && (
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setIsOrderBookOpen((open) => !open)}
              className="w-full rounded-md border border-brand-stroke px-3 py-2 text-xs font-semibold uppercase text-brand-primary hover:bg-brand-highlight/20 transition-colors cursor-pointer"
            >
              {isOrderBookOpen ? "Hide Order Book" : "Show Order Book"}
            </button>
          </div>
        )}
        {!error && market && isOrderBookOpen && (
          <div className="lg:hidden min-h-[300px]">
            <MarketOrderBookSection market={market} />
          </div>
        )}
        <div>
          {error ? (
            <ErrorState />
          ) : (
            <MarketRulesSection market={market} isLoading={isLoading} />
          )}
        </div>
        <div>
          {error ? (
            <ErrorState />
          ) : (
            <MarketPositionsSection market={market} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
