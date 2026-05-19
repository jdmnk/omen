"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Market } from "@/lib/models/api.models";
import { useMarketBySlugQuery } from "../lib/queries/market-by-slug.query";
import { PriceChartWidget } from "./PriceChartWidget";
import { MarketOrderBookSection } from "./MarketOrderBookSection";
import { MarketPositionsSection } from "./MarketPositionsSection";
import { MarketRulesSection } from "./MarketRulesSection";
import { ErrorState, LoadingState } from "./WidgetHelpers";
import { TopMoversWidget } from "./TopMoversWidget";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { PageLayout } from "@/components/PageLayout";
import { MainHeader } from "@/components/MainHeader";
import { MainWatchlists } from "@/components/MainWatchlists";
import { DismissibleHint } from "@/components/DismissibleHint";

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
        <MainHeader />
        <MainWatchlists />
        <DismissibleHint storageKey="omen-home-hint-dismissed" title="How to use">
          Search for a market or wallet to open a detailed view. Add markets
          and users to your watchlists from their pages, then use Top Movers
          below to spot active markets worth checking first.
        </DismissibleHint>
        <div className="min-h-[520px]">
          <TopMoversWidget />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <MainHeader />
      <MainWatchlists />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="min-h-[300px] md:flex-2">
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
