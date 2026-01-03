"use client";

import { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

export function CollapsibleCard({
  title,
  isOpen,
  onToggle,
  children,
  className,
  headerClassName,
  contentClassName,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full px-3 py-2 flex items-center justify-between text-sm font-bold uppercase text-brand-primary cursor-pointer",
          isOpen && "border-b border-brand-stroke",
          headerClassName
        )}
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {isOpen && <div className={cn("p-0", contentClassName)}>{children}</div>}
    </Card>
  );
}
