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
import { useUserDataQuery } from "@/lib/queries/user-data.query";

export function UserProfile({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("positions");
  const isMounted = useIsMounted();

  const { data: tradedData } = useUserTradedQuery(userId);
  const { data: valueData } = useUserValueQuery(userId);
  const { data: userData } = useUserDataQuery(userId);

  const totalValue = useMemo(() => {
    if (!valueData || valueData.length === 0) return 0;
    return valueData[0]?.value || 0;
  }, [valueData]);

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6 flex-1 flex flex-col min-h-0">
      {/* Compact Header + Inline Stats */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <img
          src={userData?.profileImage || "/logo.svg"}
          alt=""
          className="h-8 w-8 rounded-full border border-brand-stroke object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold truncate max-w-[60vw]">
              {userData?.name || userData?.pseudonym || formatAddress(userId)}
            </h1>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Joined{" "}
            {userData?.createdAt
              ? new Date(userData.createdAt).toLocaleDateString()
              : "-"}
          </div>
          {userData?.bio ? (
            <p className="text-xs text-muted-foreground truncate">
              {userData.bio}
            </p>
          ) : null}
        </div>
        {/* Inline Stats */}
        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Markets</span>
            <span className="font-bold">
              {isMounted && tradedData?.traded
                ? tradedData.traded.toLocaleString()
                : "-"}
            </span>
          </div>
          <div className="h-3 w-px bg-brand-stroke" />
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Portfolio</span>
            <span className="font-bold">
              {isMounted && totalValue !== 0
                ? formatCompactCurrency(totalValue)
                : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* PnL Chart */}
      <div className="h-96">
        <UserPnlChartWidget userId={userId} />
      </div>

      {/* Main Content */}
      <Card className="flex flex-col flex-1 min-h-0">
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
