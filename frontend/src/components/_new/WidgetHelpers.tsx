import { Spinner } from "@/components/ui/spinner";

export function EmptyState({
  message = "Pick your market",
}: {
  message?: string;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <span className="font-semibold text-muted-foreground">{message}</span>
    </div>
  );
}

export function LoadingState({
  message = "Loading market...",
}: {
  message?: string;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="md" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

export function ErrorState({
  message = "Market not found",
}: {
  message?: string;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <span className="font-semibold text-destructive">{message}</span>
    </div>
  );
}
