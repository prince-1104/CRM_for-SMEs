"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

type Suggestion = {
  name: string;
  rate: number;
  gstPercent: number;
  unit: string;
};

interface ItemNameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  onEnterKey?: () => void;
  placeholder?: string;
  className?: string;
}

export function ItemNameInput({
  value,
  onChange,
  onSelectSuggestion,
  onEnterKey,
  placeholder = "Item name *",
  className = "h-9",
}: ItemNameInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFetchedAll = useRef(false);

  // Fetch all suggestions once on first focus
  const fetchAllSuggestions = useCallback(async () => {
    if (hasFetchedAll.current) return;
    hasFetchedAll.current = true;
    try {
      const res = await fetch("/api/invoices/item-suggestions");
      if (res.ok) {
        const data: Suggestion[] = await res.json();
        setAllSuggestions(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Filter suggestions locally based on input
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions(allSuggestions);
    } else {
      const query = value.toLowerCase();
      const filtered = allSuggestions.filter((s) =>
        s.name.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
    }
  }, [value, allSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleFocus() {
    fetchAllSuggestions();
    setShowSuggestions(true);
    setActiveIndex(-1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    setShowSuggestions(true);
    setActiveIndex(-1);
  }

  function handleSelect(suggestion: Suggestion) {
    onChange(suggestion.name);
    onSelectSuggestion(suggestion);
    setShowSuggestions(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setActiveIndex(-1);
        return;
      }
    }

    // Enter on empty suggestion or no suggestions shown → add next line
    if (e.key === "Enter") {
      e.preventDefault();
      setShowSuggestions(false);
      if (onEnterKey) {
        onEnterKey();
      }
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0) {
      const el = document.getElementById(`suggestion-${activeIndex}`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        ref={inputRef}
        data-item-name-input
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-input bg-popover shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              id={`suggestion-${i}`}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between gap-2 ${
                i === activeIndex ? "bg-accent text-accent-foreground" : ""
              }`}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="truncate font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                ₹{s.rate} · {s.unit}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
