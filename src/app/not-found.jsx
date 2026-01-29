"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/common/Button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg"
            >
                <div className="relative mx-auto mb-8">
                    <div className="text-[180px] font-extrabold text-slate-200 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-24 w-24 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shadow-2xl shadow-[var(--primary)]/30">
                            <span className="text-4xl">?</span>
                        </div>
                    </div>
                </div>

                <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Oops! Trang không tồn tại
                </h1>
                <p className="mx-auto mb-8 max-w-md text-slate-500">
                    Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button className="w-full shadow-lg shadow-[var(--primary)]/20">
                            <Home className="mr-2 h-4 w-4" />
                            Về Dashboard
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Decorative elements */}
            <div className="fixed -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--primary)]/5 blur-3xl" />
            <div className="fixed -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        </div>
    );
}
