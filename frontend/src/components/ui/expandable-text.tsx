"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type ExpandableTextProps = {
  text: string;
  maxLength?: number;
  className?: string;
};

export function ExpandableText({
  text,
  maxLength = 150,
  className = "",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;

  const displayText =
    shouldTruncate && !isExpanded ? text.slice(0, maxLength) + "..." : text;

  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {displayText}
        {shouldTruncate && (
          <span
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1 text-sm cursor-pointer hover:underline inline-flex items-center text-white"
          >
            {isExpanded ? (
              <>
                Show less
                {/* <ChevronUp className="ml-0.5 h-3 w-3" /> */}
              </>
            ) : (
              <>
                Read more
                {/* <ChevronDown className="ml-0.5 h-3 w-3" /> */}
              </>
            )}
          </span>
        )}
      </p>
    </div>
  );
}
