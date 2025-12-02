"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/lib/ui/format.utils";
import { useUserSearchQuery } from "../lib/queries/user-search.query";

export function UserSearchBar() {
  const [input, setInput] = useState("");
  const [debouncedInput] = useDebounce(input, 250);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const trimmedQuery = debouncedInput.trim();
  const shouldQuery = trimmedQuery.length > 0;

  const { data, isLoading } = useUserSearchQuery(trimmedQuery, shouldQuery);

  const profiles = useMemo(() => data?.profiles ?? [], [data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProfile = useCallback(
    (proxyWallet: string) => {
      if (!proxyWallet) return;
      router.push(`/user/${proxyWallet}`);
      setIsOpen(false);
    },
    [router]
  );

  const showDropdown = isOpen && trimmedQuery.length > 0;
  const hasResults = profiles && profiles.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users by name or address..."
          className="pl-9 pr-20"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-brand-stroke bg-brand-background-deeper shadow-lg">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Spinner size="sm" />
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No users found.
            </div>
          )}

          {!isLoading && hasResults && (
            <ul className="max-h-80 overflow-y-auto py-1">
              {profiles.map((profile) => {
                const proxyWallet = profile.proxyWallet;
                const primaryLabel =
                  profile.name ||
                  profile.pseudonym ||
                  (proxyWallet ? formatAddress(proxyWallet) : "Unknown user");
                const secondaryLabel = formatAddress(proxyWallet);

                const image =
                  profile.profileImageOptimized?.imageUrlOptimized ||
                  profile.profileImage ||
                  null;

                return (
                  <li key={`${profile.id}-${profile.proxyWallet}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectProfile(proxyWallet)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-sm",
                        "transition-colors hover:bg-brand-background/70 cursor-pointer"
                      )}
                    >
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border bg-muted/40">
                        {image ? (
                          <Image
                            src={image}
                            alt={primaryLabel}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold leading-tight">
                          {primaryLabel}
                        </div>
                        {secondaryLabel && (
                          <div className="truncate text-[11px] text-muted-foreground">
                            {secondaryLabel}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
