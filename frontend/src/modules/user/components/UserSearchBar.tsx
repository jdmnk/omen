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
    (profileId: string) => {
      if (!profileId) return;
      router.push(`/user/${profileId}`);
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
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-brand-stroke bg-card shadow-lg">
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
            <ul className="max-h-80 overflow-y-auto py-2">
              {profiles.map((profile) => {
                const profileId =
                  profile.proxyWallet ||
                  profile.id ||
                  (profile.user ? String(profile.user) : "");
                const primaryLabel =
                  profile.name ||
                  profile.pseudonym ||
                  (profileId ? formatAddress(profileId) : "Unknown user");
                const secondaryLabel = profileId
                  ? formatAddress(profileId)
                  : profile.pseudonym;
                const image =
                  profile.profileImageOptimized?.imageUrlOptimized ||
                  profile.profileImage ||
                  null;

                return (
                  <li key={`${profile.id}-${profile.proxyWallet}`}>
                    <button
                      type="button"
                      onClick={() => handleSelectProfile(profileId)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                        "transition-colors hover:bg-muted"
                      )}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border bg-muted/40">
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
                        <div className="truncate text-sm font-semibold">
                          {primaryLabel}
                        </div>
                        {secondaryLabel && (
                          <div className="truncate text-xs text-muted-foreground">
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
