"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
};

const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconStyles = {
    success: "text-green-500",
    error: "text-red-500",
    info: "text-blue-500",
};

function Toast({ id, message, type = "info", onDismiss }) {
    const Icon = icons[type];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm min-w-[300px] max-w-[400px]",
                styles[type]
            )}
        >
            <Icon className={cn("h-5 w-5 flex-shrink-0", iconStyles[type])} />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={() => onDismiss(id)}
                className="flex-shrink-0 rounded-full p-1 hover:bg-black/5 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((message) => addToast(message, "success"), [addToast]);
    const error = useCallback((message) => addToast(message, "error"), [addToast]);
    const info = useCallback((message) => addToast(message, "info"), [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onDismiss={dismissToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
