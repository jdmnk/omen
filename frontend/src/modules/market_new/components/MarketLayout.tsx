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
import { UnifiedSearchBar } from "@/components/UnifiedSearchBar";
import { MarketWatchlist } from "./MarketWatchlist";
import { TopMoversWidget } from "./TopMoversWidget";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { PageLayout } from "@/components/PageLayout";

export function MarketLayout({
  initialMarket,
}: {
  initialMarket?: Market | null;
}) {
  const [isOrderBookOpen, setIsOrderBookOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const params = useParams();
  const marketSlug = params?.slug as string | undefined;

  const {
    data: market,
    isLoading,
    error,
  } = useMarketBySlugQuery(marketSlug, initialMarket);

  if (!marketSlug) {
    return (
      <PageLayout>
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
            <UnifiedSearchBar />
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
      </PageLayout>
    );
  }

  return (
    <PageLayout>
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
          <UnifiedSearchBar />
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
            <CollapsibleCard
              title="Order Book"
              isOpen={isOrderBookOpen}
              onToggle={() => setIsOrderBookOpen((open) => !open)}
              contentClassName="p-0"
            >
              <div className="min-h-[300px]">
                <MarketOrderBookSection market={market} />
              </div>
            </CollapsibleCard>
          </div>
        )}
        {!error && market && (
          <CollapsibleCard
            title="Rules"
            isOpen={isRulesOpen}
            onToggle={() => setIsRulesOpen((open) => !open)}
            contentClassName="p-0"
          >
            <MarketRulesSection market={market} isLoading={isLoading} />
          </CollapsibleCard>
        )}
        <div>
          {error ? (
            <ErrorState />
          ) : (
            <MarketPositionsSection market={market} isLoading={isLoading} />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
