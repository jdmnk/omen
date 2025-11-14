"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Market } from "@/lib/models/api.models";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrderBook } from "./OrderBook";
import { TopHoldersPositions } from "./TopHoldersPositions";
import { RulesWidget } from "./RulesWidget";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Command } from "lucide-react";

function TabItemContent({ label, number }: { label: string; number: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center">
        <Command className="size-3" />
        {number}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function TopHoldersWidget({
  market,
  isLoading,
  limit = 20,
}: {
  market: Market | undefined;
  isLoading?: boolean;
  limit?: number;
}) {
  const [activeTab, setActiveTab] = useState("positions");
  console.log("market", market);

  return (
    <Card className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex flex-col h-full min-h-0"
      >
        <TabsList className="px-3 pt-2 shrink-0">
          <TabsTrigger value="positions">
            <TabItemContent number={1} label="POSITIONS" />
          </TabsTrigger>
          <TabsTrigger value="rules">
            <TabItemContent number={2} label="RULES" />
          </TabsTrigger>
          <TabsTrigger value="book">
            <TabItemContent number={3} label="BOOK" />
          </TabsTrigger>
          <TabsTrigger value="news" disabled>
            <TabItemContent number={4} label="NEWS" />
          </TabsTrigger>
          <TabsTrigger value="trades" disabled>
            <TabItemContent number={5} label="LIVE TRADES" />
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="positions"
          className="flex-1 overflow-auto min-h-0 mt-0"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner message="Loading market..." size="sm" />
            </div>
          ) : market ? (
            <TopHoldersPositions market={market} limit={limit} />
          ) : null}
        </TabsContent>

        <TabsContent
          value="rules"
          className="flex-1 overflow-auto min-h-0 mt-0"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner message="Loading market..." size="sm" />
            </div>
          ) : market ? (
            <RulesWidget market={market} />
          ) : null}
        </TabsContent>

        <TabsContent value="book" className="flex-1 overflow-auto min-h-0 mt-0">
          {activeTab === "book" && market && (
            <OrderBook tokenId={market.token1} />
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
