"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuthGuard } from "../common/AuthGuard";
import { SocketProvider } from "../providers/SocketProvider";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import nProgress from "nprogress";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        nProgress.done();
        setIsSidebarOpen(false);
        return () => {
            nProgress.start();
        };
    }, [pathname]);

    return (
        <AuthGuard>
            <SocketProvider>
                <div className="flex h-screen bg-slate-50 overflow-hidden">
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}
                    <Sidebar
                        className={cn(
                            "fixed inset-y-0 left-0 z-50 lg:static lg:flex",
                            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                        )}
                        onMobileClose={() => setIsSidebarOpen(false)}
                    />
                    <div className="flex flex-1 flex-col overflow-hidden min-h-0">
                        <Header onMenuClick={() => setIsSidebarOpen(true)} />
                        <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
                            {children}
                        </main>
                    </div>
                </div>
            </SocketProvider>
        </AuthGuard>
    );
}
