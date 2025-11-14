"use client";

import { useState } from "react";
import { Share2, Copy, Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  generateWatchlistShareImageCanvas,
  shareWatchlistImage,
  copyImageToClipboard,
  downloadWatchlistImage,
  type WatchlistMarket,
} from "@/lib/utils/share-watchlist-canvas.utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WatchlistShareButtonProps {
  markets: WatchlistMarket[];
  className?: string;
}

export function WatchlistShareButton({
  markets,
  className,
}: WatchlistShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isGenerating || markets.length === 0) return;

    setIsGenerating(true);
    setIsCopied(false);
    try {
      const dataUrl = await generateWatchlistShareImageCanvas(markets);
      setShareImageUrl(dataUrl);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to generate share image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!shareImageUrl) return;
    const success = await copyImageToClipboard(shareImageUrl);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!shareImageUrl) return;
    downloadWatchlistImage(shareImageUrl);
  };

  const handleShare = async () => {
    if (!shareImageUrl) return;
    await shareWatchlistImage(shareImageUrl);
  };

  if (markets.length === 0) {
    return null;
  }

  return (
    <>
      {/* Share Button */}
      <button
        onClick={handleShareClick}
        disabled={isGenerating}
        className={cn(
          "p-2 rounded-md transition-all duration-200 cursor-pointer",
          "bg-brand-highlight/10 hover:bg-brand-highlight/20",
          "text-brand-highlight hover:text-brand-primary",
          className
        )}
        aria-label="Share watchlist"
        title="Share watchlist"
      >
        {isGenerating ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-highlight border-t-transparent" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
      </button>

      {/* Share Image Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Share Your Watchlist</DialogTitle>
            <DialogDescription className="text-base">
              Your personalized watchlist is ready to share on social media
            </DialogDescription>
          </DialogHeader>

          {shareImageUrl && (
            <div className="w-full">
              <div className="relative w-full rounded-xl overflow-hidden border border-brand-stroke/50 shadow-2xl bg-background">
                <img
                  src={shareImageUrl}
                  alt="Watchlist share image"
                  className="w-full h-auto block"
                  draggable={false}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-3">
            <Button
              onClick={handleCopyImage}
              variant="outline"
              size="lg"
              className="flex-1 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="lg"
              className="flex-1 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="branded"
              size="lg"
              className="flex-1 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
