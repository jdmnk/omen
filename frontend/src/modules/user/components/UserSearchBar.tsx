"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { formatAddress } from "@/lib/ui/format.utils";
import { useUserSearchQuery } from "../lib/queries/user-search.query";
import {
  useUserDataQuery,
  type UserProfileData,
} from "../lib/queries/user-data.query";
import { UserWatchlistButton } from "./UserWatchlistButton";
import type { SearchProfileItem } from "@/lib/models/api.models";

type UserSearchProfile = {
  id: string;
  proxyWallet: string;
  name?: string | null;
  pseudonym?: string | null;
  profileImage?: string | null;
  profileImageOptimized?: {
    imageUrlOptimized: string;
  } | null;
};

function isWalletAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input);
}

function mapSearchProfileToSimple(
  profile: SearchProfileItem
): UserSearchProfile {
  return {
    id: profile.id,
    proxyWallet: profile.proxyWallet,
    name: profile.name || null,
    pseudonym: profile.pseudonym || null,
    profileImage: profile.profileImage || null,
    profileImageOptimized: profile.profileImageOptimized
      ? {
          imageUrlOptimized: profile.profileImageOptimized.imageUrlOptimized,
        }
      : null,
  };
}

function mapUserDataToSimple(
  userData: UserProfileData,
  address: string
): UserSearchProfile {
  return {
    id: userData.id || address,
    proxyWallet: userData.proxyWallet || address,
    name: userData.name || null,
    pseudonym: userData.pseudonym || null,
    profileImage: userData.profileImage || null,
    profileImageOptimized: userData.profileImage
      ? {
          imageUrlOptimized: userData.profileImage,
        }
      : null,
  };
}

export function UserSearchBar() {
  const [input, setInput] = useState("");
  const [debouncedInput] = useDebounce(input, 250);
  const [isOpen, setIsOpen] = useState(false);
  const [contentWidth, setContentWidth] = useState<number>();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const trimmedQuery = debouncedInput.trim();
  const shouldQuery = trimmedQuery.length > 0;
  const isAddressSearch = isWalletAddress(trimmedQuery);

  const { data: searchData, isLoading: isSearchLoading } = useUserSearchQuery(
    trimmedQuery,
    shouldQuery && !isAddressSearch
  );

  const { data: userData, isLoading: isUserDataLoading } = useUserDataQuery(
    trimmedQuery,
    shouldQuery && isAddressSearch
  );

  const isLoading = isSearchLoading || isUserDataLoading;

  const profiles = useMemo(() => {
    if (isAddressSearch && userData) {
      return [mapUserDataToSimple(userData, trimmedQuery)];
    }
    if (searchData?.profiles) {
      return searchData.profiles.map(mapSearchProfileToSimple);
    }
    return [];
  }, [isAddressSearch, userData, searchData, trimmedQuery]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContentWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    setContentWidth(containerRef.current.offsetWidth);
    return () => observer.disconnect();
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
    <Popover open={showDropdown} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div ref={containerRef} className="w-full">
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
              className="pl-9 pr-20 border border-brand-stroke"
            />

            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="p-0 shadow-lg"
        align="start"
        sideOffset={6}
        style={{ width: contentWidth ? `${contentWidth}px` : undefined }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}

            {!isLoading && (
              <>
                <CommandEmpty className="py-3 text-muted-foreground text-sm px-2.5">
                  No users found.
                </CommandEmpty>
                {hasResults &&
                  profiles.map((profile) => {
                    const proxyWallet = profile.proxyWallet;
                    const primaryLabel =
                      profile.name ||
                      profile.pseudonym ||
                      (proxyWallet
                        ? formatAddress(proxyWallet)
                        : "Unknown user");
                    const secondaryLabel = proxyWallet
                      ? formatAddress(proxyWallet)
                      : profile.pseudonym;

                    const image =
                      profile.profileImageOptimized?.imageUrlOptimized ||
                      profile.profileImage ||
                      null;

                    return (
                      <CommandItem
                        key={`${profile.id}-${profile.proxyWallet}`}
                        onSelect={() => handleSelectProfile(proxyWallet)}
                        className="gap-2.5 px-2.5 py-2 cursor-pointer"
                      >
                        <div className="relative h-9 w-9 overflow-hidden rounded-full border bg-muted/40">
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
                        <div className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-semibold leading-tight">
                            {primaryLabel}
                          </div>
                          {secondaryLabel && (
                            <div className="truncate text-[11px] text-muted-foreground">
                              {secondaryLabel}
                            </div>
                          )}
                        </div>
                        <UserWatchlistButton
                          proxyWallet={proxyWallet}
                          name={primaryLabel}
                        />
                      </CommandItem>
                    );
                  })}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
