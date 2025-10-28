"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useMarketAutocompleteQuery } from "@/lib/queries/market-search.query";

type SearchBarProps = {
  onSelectMarket: (slug: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  onSelectMarket,
  placeholder = "Search markets...",
  className = "",
}: SearchBarProps) {
  const [input, setInput] = useState<string>("");
  const [debouncedInput, setDebouncedInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(input);
    }, 200);

    return () => clearTimeout(timer);
  }, [input]);

  const { data: suggestions = [], isLoading } = useMarketAutocompleteQuery(
    debouncedInput,
    debouncedInput.trim().length > 0
  );

  // Open dropdown when we have suggestions
  useEffect(() => {
    if (debouncedInput.trim() && suggestions.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [suggestions, debouncedInput]);

  const handleSearch = (slug?: string) => {
    const target = slug ?? input;
    if (target) {
      onSelectMarket(target);
      setIsOpen(false);
      setInput("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
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

      {!isLoading && input && debouncedInput && suggestions.length === 0 && (
        <Card className="absolute z-50 mt-2 w-full shadow-lg">
          <div className="p-3 text-center text-muted-foreground text-sm">
            No results found
          </div>
        </Card>
      )}
    </div>
  );
}
