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
      <DialogContent className="lg:max-w-[630px] bg-white" showCloseButton>
        <DialogHeader className="gap-1 hidden">
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>
        <DialogDescription className="hidden">
          {snapshot?.position.title}
        </DialogDescription>
        {snapshot && <MarketShareCard snapshot={snapshot} />}
      </DialogContent>
    </Dialog>
  );
}
