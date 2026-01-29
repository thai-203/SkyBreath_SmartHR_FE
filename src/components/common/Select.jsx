"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export const Select = forwardRef(function Select(
    { className, options = [], placeholder = "Chọn...", error, ...props },
    ref
) {
    return (
        <div className="w-full space-y-1">
            <div className="relative">
                <select
                    className={cn(
                        "flex h-10 w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                        error
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-slate-200 focus-visible:ring-indigo-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className={cn(
                    "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2",
                    error ? "text-red-400" : "text-slate-400"
                )} />
            </div>
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
});
