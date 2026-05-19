"use client";

import { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { copyToClipboard } from "@/lib/utils/clipboard.utils";
import { useUserWatchlist } from "@/lib/hooks/use-user-watchlist";

export function UserWatchlistImportExportDialog() {
  const { watchlist, setWatchlist } = useUserWatchlist();
  const [importValue, setImportValue] = useState("");

  const exportValue = useMemo(
    () => JSON.stringify({ watchlist }, null, 2),
    [watchlist]
  );

  const handleCopy = async () => {
    const ok = await copyToClipboard(exportValue);
    toast[ok ? "success" : "error"](ok ? "Copied watchlist JSON" : "Copy failed");
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importValue);
      const items = Array.isArray(parsed) ? parsed : parsed.watchlist;
      if (!Array.isArray(items)) {
        toast.error("Invalid watchlist JSON");
        return;
      }
      setWatchlist(items);
      setImportValue("");
      toast.success("Watchlist imported");
    } catch {
      toast.error("Invalid JSON");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Download className="h-3 w-3" />
          Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Watchlist Import/Export</DialogTitle>
          <DialogDescription>
            Copy the JSON to share your watchlist or paste JSON to replace it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="text-xs uppercase text-muted-foreground">Export</div>
            <textarea
              readOnly
              value={exportValue}
              className="h-40 w-full rounded-md border border-brand-stroke bg-muted/30 p-2 text-xs font-mono text-foreground"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="w-fit"
            >
              Copy JSON
            </Button>
          </div>
          <div className="grid gap-2">
            <div className="text-xs uppercase text-muted-foreground">Import</div>
            <textarea
              value={importValue}
              onChange={(event) => setImportValue(event.target.value)}
              placeholder='{"watchlist":[{"proxyWallet":"0x...","name":"Alice","description":"..."}]}'
              className="h-40 w-full rounded-md border border-brand-stroke bg-background p-2 text-xs font-mono text-foreground"
            />
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleImport}
              className="w-fit"
            >
              <Upload className="mr-1 h-3 w-3" />
              Import JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
