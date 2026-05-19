"use client";

import { ReactNode, useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DismissibleHint({
  storageKey,
  title,
  children,
  className,
}: {
  storageKey: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    setIsDismissed(localStorage.getItem(storageKey) === "true");
  }, [storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKey, "true");
  };

  if (isDismissed) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-brand border border-brand-stroke bg-card/80 px-4 py-3 text-sm text-foreground backdrop-blur-[2px]",
        className
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-brand-primary" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase text-brand-primary">
          {title}
        </div>
        <div className="mt-1 text-sm leading-5 text-muted-foreground">
          {children}
        </div>
      </div>
      <Button
        variant="brand-ghost"
        size="icon"
        onClick={handleDismiss}
        aria-label="Hide hint"
        className="-mr-2 -mt-1 h-7 w-7 shrink-0"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
