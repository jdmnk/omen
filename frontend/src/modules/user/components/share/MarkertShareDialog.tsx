import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Share2 } from "lucide-react";
import { useState } from "react";

export function MarkertShareDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="brand-ghost" size="icon">
          <Share2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <h1>Market Share Dialog</h1>
      </DialogContent>
    </Dialog>
  );
}
