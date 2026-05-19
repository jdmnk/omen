"use client";

import { LoadingSpinner } from "@/components/ui/spinner";
import { Market } from "@/lib/models/api.models";
import { RulesWidget } from "./RulesWidget";

export function MarketRulesSection({
  market,
  isLoading,
}: {
  market: Market | undefined;
  isLoading?: boolean;
}) {
  return (
    <div className="flex-1 min-h-0">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner message="Loading market..." size="sm" />
        </div>
      ) : market ? (
        <RulesWidget market={market} />
      ) : null}
    </div>
  );
}
