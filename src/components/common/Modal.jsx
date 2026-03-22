"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
    size = "default",
}) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    const sizes = {
        sm: "max-w-md",
        default: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        "2xl": "max-w-5xl",
        "3xl": "max-w-6xl",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "relative z-50 w-full rounded-xl bg-white p-6 shadow-2xl mx-4 flex flex-col max-h-[90vh]",
                            sizes[size],
                            className
                        )}
                    >
                        <div className="flex shrink-0 items-start justify-between mb-4">
                            <div>
                                {title && (
                                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                                )}
                                {description && (
                                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 rounded-full"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="overflow-y-auto pr-1 -mr-1">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận",
    description = "Bạn có chắc chắn muốn thực hiện hành động này?",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "destructive",
    loading = false,
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
            <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    {cancelText}
                </Button>
                <Button variant={variant} onClick={onConfirm} loading={loading}>
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
}
