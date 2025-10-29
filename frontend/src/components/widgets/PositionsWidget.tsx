"use client";
import { useState } from "react";
import { usePositionsQuery } from "@/lib/queries/positions.query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Position } from "@/lib/models/api.models";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import { LoadingSpinner } from "@/components/ui/spinner";
import { LinkIcon, ChevronDown, ChevronRight } from "lucide-react";
import { UserPositions } from "./UserPositions";
import { Button } from "@/components/ui/button";

export function PositionsWidget({ clobTokenIds }: { clobTokenIds: string[] }) {
  const { data: positions, isLoading, error } = usePositionsQuery(clobTokenIds);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (positionId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(positionId)) {
        next.delete(positionId);
      } else {
        next.add(positionId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading positions..." size="md" />
      </div>
    );
  }
  if (error) return <div>Error fetching positions</div>;

  return (
    <div>
      {positions?.length && positions.length > 0 && (
        <>
          {/* Positions Table */}
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Positions</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {positions.length}{" "}
                  {positions.length === 1 ? "position" : "positions"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position: Position) => {
                    const positionOutcome =
                      position.tokenId === clobTokenIds[0] ? "yes" : "no";
                    const isExpanded = expandedRows.has(position.id);
                    const posAmount =
                      typeof position.amount === "string"
                        ? Number(position.amount)
                        : position.amount;
                    const posPrice =
                      typeof position.avgPrice === "string"
                        ? Number(position.avgPrice)
                        : position.avgPrice;
                    const posValue = posAmount * posPrice;
                    const outcomeStyle =
                      positionOutcome === "yes"
                        ? "text-emerald-500"
                        : "text-rose-500";

                    return (
                      <>
                        <TableRow
                          key={position.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(position.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            {/* <Badge variant="outline" className={badgeStyle}> */}
                            <span className={` ${outcomeStyle}`}>
                              {positionOutcome.toUpperCase()}
                            </span>
                            {/* </Badge> */}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatNumber(position.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            ${formatNumber(position.avgPrice, 4)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(posValue)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <a
                              href={`https://polymarket.com/profile/${position.user}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block hover:opacity-70 transition-opacity"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </a>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0">
                              <UserPositions userId={position.user} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
