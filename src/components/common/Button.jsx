"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const variants = {
    default: "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "hover:bg-slate-100 text-slate-700",
    link: "text-indigo-500 underline-offset-4 hover:underline",
};

const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
};

export function Button({
    className,
    variant = "default",
    size = "default",
    loading = false,
    children,
    disabled,
    ...props
}) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
