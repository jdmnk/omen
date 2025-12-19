"use client";

import { useParams } from "next/navigation";
import { Header } from "../../../components/Header";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SearchWidget } from "./SearchWidget";
import { useMarketBySlugQuery } from "../lib/queries/market-by-slug.query";
import { PriceChartWidget } from "./PriceChartWidget";
import { LoadingState, ErrorState } from "./WidgetHelpers";
import { TopHoldersWidget } from "./TopHoldersWidget";
import { TopMoversWidget } from "./TopMoversWidget";
import { Market } from "@/lib/models/api.models";

export function TerminalLayout({
  initialMarket,
}: {
  initialMarket?: Market | null;
}) {
  const params = useParams();
  const marketSlug = params?.slug as string | undefined;

  const {
    data: market,
    isLoading,
    error,
  } = useMarketBySlugQuery(marketSlug, initialMarket);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0 mx-auto pb-6">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Left sidebar */}
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="h-full overflow-auto border-t border-b border-r border-brand-stroke rounded-r-brand mr-3">
              <SearchWidget currentMarket={market} />
            </div>
          </ResizablePanel>

          {/* Main content */}
          <ResizableHandle />
          <ResizablePanel defaultSize={50} minSize={20}>
            {!marketSlug ? (
              <div className="h-full ">
                <TopMoversWidget />
              </div>
            ) : (
              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div className="h-full px-3 pb-3">
                    {isLoading ? (
                      <LoadingState />
                    ) : error || !market ? (
                      <ErrorState />
                    ) : (
                      <PriceChartWidget market={market} />
                    )}
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={60} minSize={20}>
                  {error ? (
                    <ErrorState />
                  ) : (
                    <div className="h-full pt-3 px-3 flex flex-col min-h-0">
                      <TopHoldersWidget market={market} isLoading={isLoading} />
                    </div>
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </ResizablePanel>

          {/* Right sidebar */}
          <ResizableHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="h-full overflow-auto border-t border-b border-l border-brand-stroke rounded-l-brand ml-3">
              <div className="flex flex-col h-full rounded-brand">
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-brand-foreground italic text-sm">
                    Trading coming soon!
                  </p>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
