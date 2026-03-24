"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function Checkbox({ checked, onCheckedChange, disabled = false, className, label }) {
  const toggle = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
          checked && "border-indigo-500 bg-indigo-500 text-white"
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </button>
      {label && (
        <label 
          className={cn(
            "text-sm font-medium leading-none cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={toggle}
        >
          {label}
        </label>
      )}
    </div>
  );
}
