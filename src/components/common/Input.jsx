"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(function Input({ className, type, error, label, ...props }, ref) {
    return (
        <div className="w-full space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                    error
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-slate-200 focus-visible:ring-indigo-500",
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
});
