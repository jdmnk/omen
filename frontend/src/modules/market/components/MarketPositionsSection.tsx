"use client";

import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Market } from "@/lib/models/api.models";
import { TopHoldersPositions } from "./TopHoldersPositions";

export function MarketPositionsSection({
  market,
  isLoading,
  limit = 20,
}: {
  market: Market | undefined;
  isLoading?: boolean;
  limit?: number;
}) {
  return (
    <Card className="h-full flex flex-col">
      <div className="px-3 pt-3 pb-2 border-b border-brand-stroke">
        <h2 className="text-sm font-bold uppercase text-brand-primary pb-[3px]">
          Positions
        </h2>
      </div>
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="Loading market..." size="sm" />
          </div>
        ) : market ? (
          <TopHoldersPositions market={market} limit={limit} />
        ) : null}
      </div>
    </Card>
  );
}
