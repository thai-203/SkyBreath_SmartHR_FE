"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TimesheetsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/timesheets/data");
    }, [router]);

    return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
    );
}
