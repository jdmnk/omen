"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import type {
  PositionActivity,
  PositionActivityLookup,
} from "../userActivity.types";
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
import { useUserLeaderboardQuery } from "@/modules/user/lib/queries/user-leaderboard.query";
import { fetchUserActivityEntries } from "@/modules/user/lib/queries/user-activity.query";
import { getPositionKey } from "@/modules/user/lib/position.utils";
import { UserSelectedMarketCharts } from "./UserSelectedMarketCharts";
import { UserActivityFeed } from "./UserActivityFeed";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/utils/clipboard.utils";
import { useQueries } from "@tanstack/react-query";
import { getProcessedPositionActivity } from "../lib/positions-activity-new.utils";
import { UserSearchBar } from "./UserSearchBar";
import { Position } from "@/lib/models/frontend.models";
import { UserWatchlistButton } from "./UserWatchlistButton";
import { UserWatchlist } from "./UserWatchlist";
import Link from "next/link";
import { LogoIcon } from "@/components/LogoIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FontSizeControl } from "@/components/FontSizeControl";
import { Checkbox } from "@/components/ui/checkbox";

async function fetchUserPositionActivity(userId: string, position: Position) {
  // sorted by timestamp DESC
  const activity = await fetchUserActivityEntries(
    userId,
    position.conditionId,
    1000
  );
  const splits = activity.filter((entry) => entry.type === "SPLIT");
  const merges = activity.filter((entry) => entry.type === "MERGE");
  const redeems = activity.filter((entry) => entry.type === "REDEEM");
  const converts = activity.filter((entry) => entry.type === "CONVERSION");
  console.log("splits", splits);
  console.log("merges", merges);
  console.log("redeems", redeems);
  console.log("converts", converts);
  // we want only the activity for the specific outcome (and other non-outcome activities like SPLIT, MERGE, etc.)
  const activityForOutcome = activity.filter(
    (entry) => entry.outcomeIndex === position.outcomeIndex || !entry.outcome // e.g. REDEEM has no outcome
  );

  const positionActivity = getProcessedPositionActivity({
    position,
    activity: activityForOutcome,
  });

  return positionActivity;
}

export function UserProfile({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("positions");
  const [isCompact, setIsCompact] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<
    Record<string, Position>
  >({});
  const isMounted = useIsMounted();

  const { data: tradedData } = useUserTradedQuery(userId);
  const { data: valueData } = useUserValueQuery(userId);
  const { data: userData } = useUserDataQuery(userId);
  const { data: leaderboardData } = useUserLeaderboardQuery(userId);

  const handlePositionToggle = useCallback(
    (position: Position, checked: boolean) => {
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
    setCopyMessage(ok ? "Copied wallet" : "Copy failed");
    setTimeout(() => setCopyMessage(null), 2000);
  }, [userId]);

  useEffect(() => {
    const stored = localStorage.getItem("user-positions-compact");
    if (stored) {
      setIsCompact(stored === "true");
    }
  }, []);

  const handleCompactToggle = (checked: boolean) => {
    setIsCompact(checked);
    localStorage.setItem("user-positions-compact", String(checked));
  };

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-3 md:space-y-5">
      {/* Header Row: Logo + Search Bar + Controls */}
      <div className="flex items-center gap-3 md:gap-5">
        <Link href="/" className="shrink-0">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8 text-foreground" />
            <span className="text-xl font-bold text-foreground tracking-widest">
              OMEN
            </span>
          </div>
        </Link>
        <div className="flex-1 max-w-2xl">
          <UserSearchBar />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <ThemeToggle />
          <FontSizeControl />
        </div>
      </div>

      {/* User Watchlist */}
      <UserWatchlist />

      {/* Two-column Header: User Info + PnL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: User Info */}
        <Card className="p-4 flex flex-col">
          <div className="flex items-start gap-4">
            <img
              src={userData?.profileImage || "/logo.svg"}
              alt=""
              className="h-16 w-16 rounded-full border border-brand-stroke object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold truncate">
                  <a
                    href={`https://polymarket.com/profile/${userId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {userData?.name ||
                      userData?.pseudonym ||
                      formatAddress(userId)}
                  </a>
                </h1>
                <UserWatchlistButton
                  proxyWallet={userId}
                  name={
                    userData?.name ||
                    userData?.pseudonym ||
                    formatAddress(userId)
                  }
                />
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {leaderboardData?.xUsername && (
                  <>
                    <a
                      href={`https://x.com/${leaderboardData.xUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      @{leaderboardData.xUsername}
                    </a>
                    <span>·</span>
                  </>
                )}
                <span>
                  Joined{" "}
                  {userData?.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              {userData?.bio ? (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {userData.bio}
                </p>
              ) : null}
            </div>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-brand-stroke flex-wrap">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Positions</div>
              <div className="text-base font-bold">
                {isMounted && totalValue !== 0
                  ? formatCompactCurrency(totalValue)
                  : "-"}
              </div>
            </div>
            <div className="w-px h-8 bg-brand-stroke" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Predictions</div>
              <div className="text-base font-bold">
                {isMounted && tradedData?.traded
                  ? tradedData.traded.toLocaleString()
                  : "-"}
              </div>
            </div>
            <div className="w-px h-8 bg-brand-stroke" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Volume</div>
              <div className="text-base font-bold">
                {isMounted && leaderboardData?.vol
                  ? formatCompactCurrency(leaderboardData.vol)
                  : "-"}
              </div>
            </div>
            <div className="w-px h-8 bg-brand-stroke" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Rank</div>
              <div className="text-base font-bold">
                {isMounted && leaderboardData?.rank
                  ? `#${Number(leaderboardData.rank).toLocaleString()}`
                  : "-"}
              </div>
            </div>
          </div>
        </Card>

        {/* Right Card: PnL Chart */}
        <div className="h-64 lg:h-auto">
          <UserPnlChartWidgetV2 userId={userId} />
        </div>
      </div>

      {/* Selected Market Charts */}
      <UserSelectedMarketCharts
        activities={positionActivities}
        onTogglePosition={handlePositionToggle}
      />

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Positions */}
        <Card className="flex flex-col max-h-[800px] overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex flex-col"
          >
            <div className="px-3 pt-2 pb-2 border-b border-brand-stroke flex items-center justify-between">
              <TabsList>
                <TabsTrigger
                  value="positions"
                  className="text-sm uppercase text-brand-primary font-bold"
                >
                  Open
                </TabsTrigger>
                <TabsTrigger
                  value="closed"
                  className="text-sm uppercase text-brand-primary font-bold"
                >
                  Closed
                </TabsTrigger>
              </TabsList>
              <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={isCompact}
                  onCheckedChange={(checked) =>
                    handleCompactToggle(Boolean(checked))
                  }
                />
                <span className="uppercase">Compact</span>
              </label>
            </div>

            <TabsContent
              value="positions"
              forceMount
              className="data-[state=inactive]:hidden"
            >
              <div className="h-[700px]">
                <UserOpenPositions
                  userId={userId}
                  isCompact={isCompact}
                  selectedPositionKeys={selectedPositionKeys}
                  onTogglePosition={handlePositionToggle}
                  positionActivities={positionActivitiesLookup}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="closed"
              forceMount
              className="data-[state=inactive]:hidden"
            >
              <div className="h-[700px]">
                <UserClosedPositions
                  userId={userId}
                  isCompact={isCompact}
                  selectedPositionKeys={selectedPositionKeys}
                  onTogglePosition={handlePositionToggle}
                  positionActivities={positionActivitiesLookup}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Right Column: Activity */}
        <Card className="flex flex-col max-h-[800px] overflow-hidden gap-2">
          <div className="px-3 pt-3 pb-2 border-b border-brand-stroke">
            <h2 className="text-sm font-bold uppercase text-brand-primary pb-[3px]">
              Activity
            </h2>
          </div>
          <div className="h-[700px]">
            <UserActivityFeed userId={userId} isCompact={isCompact} />
          </div>
        </Card>
      </div>
    </div>
  );
}
