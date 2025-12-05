"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketShareCard } from "./MarketShareCard";
import { useMarketShareStore } from "./share.store";

export function MarketShareDialog() {
  const { isOpen, snapshot, setOpen } = useMarketShareStore();

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="lg:max-w-5xl" showCloseButton>
        <DialogHeader className="gap-1">
          <DialogTitle>Share preview</DialogTitle>
          <DialogDescription>
            Copy or download a snapshot of this position’s price action and PnL.
          </DialogDescription>
        </DialogHeader>
        {snapshot ? (
          <MarketShareCard snapshot={snapshot} />
        ) : (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>No market selected to share yet.</p>
            <Button
              variant="brand-ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="w-fit"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
