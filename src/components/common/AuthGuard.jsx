"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "./Skeleton";
import { authService } from "@/services";

export function AuthGuard({ children }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            router.replace("/login");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    if (isAuthenticated === null) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-12 w-3/4 mx-auto" />
                    <Skeleton className="h-64 w-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
