"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserOpenPositions } from "./UserOpenPositions";
import { UserClosedPositions } from "./UserClosedPositions";
import { UserPnlChartWidgetV2 } from "./UserPnlChartWidgetV2";
import { formatAddress, formatCompactCurrency } from "@/lib/ui/format.utils";
import { useUserTradedQuery } from "@/modules/user/lib/queries/user-traded.query";
import { useUserValueQuery } from "@/modules/user/lib/queries/user-value.query";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";
import { useUserDataQuery } from "@/modules/user/lib/queries/user-data.query";
import { fetchUserActivityEntries } from "@/modules/user/lib/queries/user-activity.query";
import { getPositionKey } from "@/modules/user/lib/position.utils";
import type {
  PositionActivity,
  PositionActivityLookup,
  SelectablePosition,
} from "../userActivity.types";
import { UserSelectedMarketCharts } from "./charts/UserSelectedMarketCharts";
import { UserActivityFeed } from "./UserActivityFeed";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/utils/clipboard.utils";
import { useQueries } from "@tanstack/react-query";

async function fetchUserPositionActivity(
  userId: string,
  position: SelectablePosition
) {
  const entries = await fetchUserActivityEntries(userId, position.conditionId);
  const outcomeIndex = position.outcomeIndex;
  if (outcomeIndex === null || outcomeIndex === undefined) {
    return entries;
  }
  return entries.filter(
    (entry) =>
      entry.outcomeIndex === null ||
      entry.outcomeIndex === undefined ||
      entry.outcomeIndex === outcomeIndex
  );
}

export function UserProfile({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("positions");
  const [selectedPositions, setSelectedPositions] = useState<
    Record<string, SelectablePosition>
  >({});
  const isMounted = useIsMounted();

  const { data: tradedData } = useUserTradedQuery(userId);
  const { data: valueData } = useUserValueQuery(userId);
  const { data: userData } = useUserDataQuery(userId);

  const handlePositionToggle = useCallback(
    (position: SelectablePosition, checked: boolean) => {
      setSelectedPositions((prev) => {
        const key = getPositionKey(position);
        if (checked) {
          return {
            ...prev,
            [key]: position,
          };
        }
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const selectedPositionsList = useMemo(
    () => Object.values(selectedPositions),
    [selectedPositions]
  );

  const positionActivityQueries = useQueries({
    queries: selectedPositionsList.map((position) => ({
      queryKey: [
        "user-position-activity",
        userId,
        position.conditionId,
        position.outcomeIndex,
      ],
      queryFn: () => fetchUserPositionActivity(userId, position),
      enabled: Boolean(userId && position.conditionId),
      staleTime: 60_000,
    })),
  });

  const positionActivities: PositionActivity[] = useMemo(() => {
    return selectedPositionsList.map((position, index) => {
      const key = getPositionKey(position);
      const query = positionActivityQueries[index];
      return {
        key,
        position,
        entries: query?.data ?? [],
        isLoading: Boolean(query?.isLoading),
        isError: Boolean(query?.isError),
      };
    });
  }, [selectedPositionsList, positionActivityQueries]);

  const positionActivitiesLookup: PositionActivityLookup = useMemo(() => {
    return positionActivities.reduce<PositionActivityLookup>(
      (acc, activity) => {
        acc[activity.key] = {
          entries: activity.entries,
          isLoading: activity.isLoading,
          isError: activity.isError,
        };
        return acc;
      },
      {}
    );
  }, [positionActivities]);

  const selectedPositionKeys = useMemo(
    () => new Set(Object.keys(selectedPositions)),
    [selectedPositions]
  );

  const totalValue = useMemo(() => {
    if (!valueData || valueData.length === 0) return 0;
    return valueData[0]?.value || 0;
  }, [valueData]);

  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    if (!userId) return;
    const ok = await copyToClipboard(userId);
    setCopyMessage(ok ? "Copied address" : "Copy failed");
    setTimeout(() => setCopyMessage(null), 2000);
  }, [userId]);

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
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
              <a
                href={`https://polymarket.com/profile/${userId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {userData?.name || userData?.pseudonym || formatAddress(userId)}
              </a>
            </h1>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground p-0 [&_svg]:h-3 [&_svg]:w-3"
              onClick={handleCopy}
              aria-label="Copy address"
            >
              <Copy />
            </Button>
            {copyMessage && (
              <span className="text-[11px] text-muted-foreground">
                {copyMessage}
              </span>
            )}
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
        <UserPnlChartWidgetV2
          userId={userId}
          focusedActivities={positionActivities}
        />
      </div>

      {/* Selected Market Charts */}
      <UserSelectedMarketCharts activities={positionActivities} />

      {/* Main Content */}
      <Card className="flex flex-col max-h-[800px] overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col"
        >
          <TabsList className="px-3 pt-2">
            <TabsTrigger value="positions" className="uppercase">
              Open Positions
            </TabsTrigger>
            <TabsTrigger value="closed" className="uppercase">
              Closed Positions
            </TabsTrigger>
            <TabsTrigger value="activity" className="uppercase">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <div className="h-[800px]">
              <UserOpenPositions
                userId={userId}
                selectedPositionKeys={selectedPositionKeys}
                onTogglePosition={handlePositionToggle}
                positionActivities={positionActivitiesLookup}
              />
            </div>
          </TabsContent>

          <TabsContent value="closed">
            <div className="h-[800px]">
              <UserClosedPositions
                userId={userId}
                selectedPositionKeys={selectedPositionKeys}
                onTogglePosition={handlePositionToggle}
                positionActivities={positionActivitiesLookup}
              />
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="h-[800px]">
              <UserActivityFeed userId={userId} />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
