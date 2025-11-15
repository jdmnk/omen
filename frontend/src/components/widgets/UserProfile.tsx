"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserPositions } from "./UserPositions";
import { UserTopTrades } from "./UserTopTrades";
import { UserClosedPositions } from "./UserClosedPositions";
import { UserPnlChartWidget } from "./UserPnlChartWidget";
import { formatAddress, formatCompactCurrency } from "@/lib/ui/format.utils";
import { useUserTradedQuery } from "@/lib/queries/user-traded.query";
import { useUserValueQuery } from "@/lib/queries/user-value.query";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";

export function UserProfile({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("positions");
  const isMounted = useIsMounted();

  const { data: tradedData } = useUserTradedQuery(userId);
  const { data: valueData } = useUserValueQuery(userId);

  const totalValue = useMemo(() => {
    if (!valueData || valueData.length === 0) return 0;
    return valueData[0]?.value || 0;
  }, [valueData]);

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{formatAddress(userId)}</h1>
        <p className="text-sm text-muted-foreground mt-1">Trading Profile</p>
      </div>

      {/* User Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-0.5">
            Markets Traded
          </div>
          <div className="text-lg font-bold">
            {isMounted && tradedData?.traded
              ? tradedData.traded.toLocaleString()
              : "-"}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-0.5">
            Portfolio Value
          </div>
          <div className="text-lg font-bold">
            {isMounted && totalValue !== 0
              ? formatCompactCurrency(totalValue)
              : "-"}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-0.5">Total PnL</div>
          <div className="text-lg font-bold text-muted-foreground">
            Coming soon
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-0.5">Win Rate</div>
          <div className="text-lg font-bold text-muted-foreground">
            Coming soon
          </div>
        </Card>
      </div>

      {/* PnL Chart */}
      <div className="h-96">
        <UserPnlChartWidget userId={userId} />
      </div>

      {/* Main Content */}
      <Card className="flex flex-col" style={{ height: "calc(100vh - 44rem)" }}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col h-full min-h-0"
        >
          <TabsList className="px-3 pt-2 shrink-0">
            <TabsTrigger value="positions" className="uppercase">
              Open Positions
            </TabsTrigger>
            <TabsTrigger value="closed" className="uppercase">
              Closed Positions
            </TabsTrigger>
            <TabsTrigger value="trades" className="uppercase">
              Top Trades
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="positions"
            className="flex-1 overflow-auto min-h-0 mt-0"
          >
            <UserPositions userId={userId} />
          </TabsContent>

          <TabsContent
            value="closed"
            className="flex-1 overflow-auto min-h-0 mt-0"
          >
            <UserClosedPositions userId={userId} />
          </TabsContent>

          <TabsContent
            value="trades"
            className="flex-1 overflow-auto min-h-0 mt-0"
          >
            <UserTopTrades userId={userId} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
