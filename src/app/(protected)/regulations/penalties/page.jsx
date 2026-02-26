"use client";

import { BookOpen } from "lucide-react";

export default function PenaltiesPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white">
                    <BookOpen className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quy định hình phạt</h1>
                    <p className="text-sm text-slate-500">
                        Quản lý các quy định hình phạt trong công ty
                    </p>
                </div>
            </div>

            {/* Placeholder Content */}
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-16">
                <BookOpen className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-500">Tính năng đang phát triển</h3>
                <p className="text-sm text-slate-400 mt-1">
                    Quản lý quy định hình phạt sẽ sớm được cập nhật
                </p>
            </div>
        </div>
    );
}
