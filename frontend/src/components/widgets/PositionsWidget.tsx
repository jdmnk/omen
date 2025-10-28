"use client";
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

const getOutcomeStyle = (outcome: string) => {
  if (outcome === "yes") {
    return {
      badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      row: "bg-emerald-500/5 hover:bg-emerald-500/10",
    };
  }
  if (outcome === "no") {
    return {
      badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      row: "bg-rose-500/5 hover:bg-rose-500/10",
    };
  }
  return {
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    row: "hover:bg-muted/50",
  };
};

export function PositionsWidget({ clobTokenIds }: { clobTokenIds: string[] }) {
  const { data: positions, isLoading, error } = usePositionsQuery(clobTokenIds);

  if (isLoading) return <div>Loading...</div>;
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
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position: Position) => {
                    const positionOutcome =
                      position.tokenId === clobTokenIds[0] ? "yes" : "no";

                    const style = getOutcomeStyle(positionOutcome);
                    const posAmount =
                      typeof position.amount === "string"
                        ? Number(position.amount)
                        : position.amount;
                    const posPrice =
                      typeof position.avgPrice === "string"
                        ? Number(position.avgPrice)
                        : position.avgPrice;
                    const posValue = posAmount * posPrice;

                    return (
                      <TableRow key={position.id} className={style.row}>
                        <TableCell>
                          <Badge className={style.badge}>
                            {positionOutcome}
                          </Badge>
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
                      </TableRow>
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
