"use client";

import React from "react";
import { useClarificationsQuery } from "@/lib/queries/clarifications.query";

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
  const {
    data: updates,
    isLoading,
    error,
  } = useClarificationsQuery(questionId, owner);

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
        {updates && updates.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Additional Context</h3>
            <div className="space-y-3">
              {updates.map((update, index) => (
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
                  {update.text && update.text.length > 0 ? (
                    <div className="text-sm whitespace-pre-wrap">
                      {update.text}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No content available.
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
