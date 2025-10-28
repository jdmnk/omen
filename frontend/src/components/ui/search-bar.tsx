"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useMarketAutocompleteQuery } from "@/lib/queries/market-search.query";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";

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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<string>("");
  const [debouncedInput, setDebouncedInput] = useState<string>("");

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

  // Open dropdown when we have input
  useEffect(() => {
    setOpen(input.trim().length > 0);
  }, [input, suggestions]);

  const handleSelect = (slug: string) => {
    onSelectMarket(slug);
    setOpen(false);
    setInput("");
  };

  return (
    <div className={`relative ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <PopoverAnchor asChild>
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {isLoading && debouncedInput && (
                <div className="flex items-center justify-center py-6">
                  <Spinner size="sm" />
                </div>
              )}
              {!isLoading && debouncedInput && suggestions.length === 0 && (
                <CommandEmpty>No markets found.</CommandEmpty>
              )}
              {!isLoading && suggestions.length > 0 && (
                <CommandGroup>
                  {suggestions.map((s) => (
                    <CommandItem
                      key={s.slug}
                      value={s.slug}
                      onSelect={() => handleSelect(s.slug)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="font-medium text-sm">{s.question}</div>
                        <div className="text-xs text-muted-foreground">
                          /{s.slug}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
