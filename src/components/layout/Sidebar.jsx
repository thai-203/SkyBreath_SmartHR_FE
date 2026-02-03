"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    Settings,
    ChevronDown,
    ChevronRight,
    X,
} from "lucide-react";

const menuItems = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
    },
    {
        title: "Phòng ban",
        icon: Building2,
        href: "/departments",
        children: [
            { title: "Danh sách", href: "/departments" },
            { title: "Sơ đồ tổ chức", href: "/departments/chart" },
        ],
    },
    {
        title: "Nhân viên",
        icon: Users,
        href: "/employees",
        children: [
            { title: "Danh sách", href: "/employees" }
        ],
    },
    {
        title: "Hợp đồng",
        icon: FileText,
        href: "/contracts",
    },
    {
        title: "Cài đặt",
        icon: Settings,
        href: "/settings",
    },
];

function MenuItem({ item, isActive, onMobileClose }) {
    const [isOpen, setIsOpen] = useState(isActive);
    const hasChildren = item.children && item.children.length > 0;
    const pathname = usePathname();

    const handleClick = () => {
        if (hasChildren) {
            setIsOpen(!isOpen);
        } else if (onMobileClose) {
            onMobileClose();
        }
    };

    return (
        <div>
            {hasChildren ? (
                <button
                    onClick={handleClick}
                    className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                >
                    <span className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.title}
                    </span>
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>
            ) : (
                <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                </Link>
            )}
            {hasChildren && isOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-4">
                    {item.children.map((child) => (
                        <Link
                            key={child.href}
                            href={child.href}
                            onClick={onMobileClose}
                            className={cn(
                                "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
                                pathname === child.href
                                    ? "bg-slate-100 font-medium text-indigo-500"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            {child.title}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export function Sidebar({ className, onMobileClose }) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "flex h-full w-64 flex-col bg-white border-r border-slate-200 transition-transform duration-300",
                className
            )}
        >
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20">
                        S
                    </div>
                    <span className="text-lg font-bold text-slate-900">SmartHR</span>
                </Link>
                {onMobileClose && (
                    <button
                        onClick={onMobileClose}
                        className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {menuItems.map((item) => (
                    <MenuItem
                        key={item.href}
                        item={item}
                        isActive={pathname.startsWith(item.href)}
                        onMobileClose={onMobileClose}
                    />
                ))}
            </nav>
        </aside>
    );
}
