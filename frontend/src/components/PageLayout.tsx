import { cn } from "@/lib/utils";

export function PageLayout({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full px-3 py-2 md:px-6 md:py-4 lg:mx-auto lg:max-w-6xl space-y-3 md:space-y-5",
        className
      )}
    >
      {children}
    </div>
  );
}
