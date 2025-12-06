import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  const defaultClassName = "h-[37px] w-[37px]";
  const combinedClassName = cn(defaultClassName, className);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Image
        src="/logo-colored.svg"
        alt="Logo"
        width={37}
        height={37}
        className={combinedClassName}
      />
    </div>
  );
}
