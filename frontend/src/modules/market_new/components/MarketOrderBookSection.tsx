"use client";

import { Market } from "@/lib/models/api.models";
import { Card } from "@/components/ui/card";
import { OrderBook } from "./OrderBook";

export function MarketOrderBookSection({ market }: { market: Market }) {
  return (
    <Card>
      <div className="h-[360px] flex flex-col">
        <div className="px-3 pt-3 pb-2 border-b border-brand-stroke">
          <h2 className="text-sm font-bold uppercase text-brand-primary pb-[3px]">
            Book
          </h2>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <OrderBook tokenId={market.token1} />
        </div>
      </div>
    </Card>
  );
}
