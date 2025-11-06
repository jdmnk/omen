"use client";

import { useParams } from "next/navigation";
import { Header } from "./_new/Header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SearchWidget } from "./_new/SearchWidget";
import { useMarketBySlugQuery } from "@/lib/queries/market-by-slug.query";
import { PriceChartWidget } from "./_new/PriceChartWidget";
import { EmptyState, LoadingState, ErrorState } from "./_new/WidgetHelpers";
import { TopHoldersWidget } from "./_new/TopHoldersWidget";

export function TerminalLayout() {
  const params = useParams();
  const marketSlug = params?.slug as string | undefined;

  const {
    data: marketData,
    isLoading,
    error,
  } = useMarketBySlugQuery(marketSlug);

  const market = marketData?.market;
  console.log(market);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Left sidebar */}
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="h-full overflow-auto">
              <SearchWidget />
            </div>
          </ResizablePanel>

          {/* Main content */}
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={20}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="h-full overflow-auto p-6">
                  {!marketSlug ? (
                    <EmptyState />
                  ) : isLoading ? (
                    <LoadingState />
                  ) : error || !market ? (
                    <ErrorState />
                  ) : (
                    <PriceChartWidget market={market} />
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="h-full overflow-auto p-6">
                  {!marketSlug ? (
                    <EmptyState />
                  ) : isLoading ? (
                    <LoadingState />
                  ) : error || !market ? (
                    <ErrorState />
                  ) : (
                    <TopHoldersWidget market={market} />
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Right sidebar */}
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            {/* <div className="h-full overflow-auto p-6 space-y-6">
              {!marketSlug ? (
                <EmptyState />
              ) : isLoading ? (
                <LoadingState />
              ) : error || !market ? (
                <ErrorState />
              ) : (
                // <PositionsWidget clobTokenIds={[market.token1, market.token2]} />
                <RecentActivityWidget conditionId={market.condition_id} />
              )}
            </div> */}
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
