"use client";

import React, { useMemo } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useOnchainUpdatesQuery } from "@/lib/queries/onchain-updates.query";
import { decodeHexToText } from "@/lib/ui/format.utils";

interface RulesWidgetProps {
  questionId?: string;
  owner?: string;
  marketDescription?: string;
}

export function RulesWidget({
  questionId,
  owner,
  marketDescription,
}: RulesWidgetProps) {
  console.log("questionId", questionId);
  console.log("owner", owner);
  const {
    data: updates,
    isLoading,
    error,
  } = useOnchainUpdatesQuery(questionId, owner);

  // Decode hex strings to text
  const decodedUpdates = useMemo(() => {
    if (!updates) return [];
    return updates.map((update) => ({
      ...update,
      decodedText: decodeHexToText(update.update),
      isHex: update.update.startsWith("0x") && update.update.length > 2,
    }));
  }, [updates]);

  return (
    <div className="space-y-4 p-4">
      {/* Market Description Section */}
      {marketDescription && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Market Description</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {marketDescription || "No description available."}
          </div>
        </div>
      )}

      <div>
        {decodedUpdates && decodedUpdates.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Additional Context</h3>
            <div className="space-y-3">
              {decodedUpdates.map((update, index) => (
                <div
                  key={index}
                  className="border rounded-md p-3 space-y-2 bg-muted/50"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Update #{index + 1}</span>
                    <span>
                      {new Date(update.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                  {update.decodedText && update.decodedText.length > 0 ? (
                    <div className="text-sm whitespace-pre-wrap">
                      {update.decodedText}
                    </div>
                  ) : (
                    <div className="text-sm break-all font-mono text-muted-foreground">
                      {update.update}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
