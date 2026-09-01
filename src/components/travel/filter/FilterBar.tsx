"use client";

import { Button } from "@/components/ui/button";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selectedValue: string | null;
  basePath: string;
  queryParam?: string;
  label?: string;
}

export function FilterBar({
  options,
  selectedValue,
  basePath,
  queryParam = "category",
  label = "Filter",
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-12 lg:mb-16" role="group" aria-label={label}>
      <Button
        variant={!selectedValue ? "primary" : "secondary"}
        className="text-sm"
        onClick={() => {
          window.location.href = basePath;
        }}
      >
        All
      </Button>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={selectedValue === option.value ? "primary" : "secondary"}
          className="text-sm"
          onClick={() => {
            window.location.href = `${basePath}?${queryParam}=${encodeURIComponent(option.value)}`;
          }}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
