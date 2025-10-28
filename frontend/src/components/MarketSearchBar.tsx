"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { getBaseUrl } from "@/lib/api";
import Image from "next/image";
import { usePathname } from "next/navigation";

type SearchBarProps = {
  onSelectMarket: (slug: string) => void;
};

type Market = {
  question: string;
  icon?: string;
};

export function MarketSearchBar({ onSelectMarket }: SearchBarProps) {
  const [input, setInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; question: string }>
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pathname = usePathname();

  // Fetch selected market info when URL changes
  useEffect(() => {
    const slug = pathname?.split("/market/")[1];
    if (!slug) {
      setSelectedMarket(null);
      return;
    }

    const fetchMarket = async () => {
      try {
        const response = await fetch(
          `${getBaseUrl()}/markets/search-slug?slug=${slug}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (data?.market) {
          setSelectedMarket(data.market);
        }
      } catch (error) {
        console.error("Failed to fetch market", error);
      }
    };

    fetchMarket();
  }, [pathname]);

  const handleSearch = (slug?: string) => {
    const target = slug ?? input;
    if (target) {
      onSelectMarket(target);
      setIsOpen(false);
      setInput("");
    }
  };

  // Debounced fetch for autocomplete
  useEffect(() => {
    const q = input.trim();
    if (!q) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${getBaseUrl()}/markets/autocomplete?q=${encodeURIComponent(
            q
          )}&limit=10`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );
        if (!res.ok) throw new Error("autocomplete failed");
        const data = (await res.json()) as Array<{
          slug: string;
          question: string;
        }>;
        setSuggestions(data);
        setIsOpen(true);
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Selected Market Display */}
          {selectedMarket ? (
            <div className="flex items-center gap-3 flex-1">
              {selectedMarket.icon ? (
                <div className="w-10 h-10 relative shrink-0">
                  <Image
                    src={selectedMarket.icon}
                    alt={selectedMarket.question}
                    width={40}
                    height={40}
                    className="rounded-md border object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center shrink-0">
                  <Search className="h-5 w-5 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm truncate">
                  {selectedMarket.question}
                </h2>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                No market selected
              </p>
            </div>
          )}

          {/* Search Input */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search markets..."
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />

            {isOpen && suggestions.length > 0 && (
              <Card className="absolute z-50 mt-2 w-full shadow-xl border-2 max-h-80 overflow-auto">
                <ul className="divide-y">
                  {suggestions.map((s) => (
                    <li key={s.slug}>
                      <button
                        className="w-full text-left p-3 hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => handleSearch(s.slug)}
                      >
                        <div className="font-medium truncate text-sm">
                          {s.question}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          /{s.slug}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {!isLoading && input && isOpen && suggestions.length === 0 && (
              <Card className="absolute z-50 mt-2 w-full shadow-lg">
                <div className="p-3 text-center text-muted-foreground text-sm">
                  No results found
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
