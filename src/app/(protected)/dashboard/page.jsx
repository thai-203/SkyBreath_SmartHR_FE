"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { PageTitle } from "@/components/common/PageTitle";
import { useEffect, useState } from "react";
import { Users, Building2, Briefcase, TrendingUp } from "lucide-react";

const stats = [
    {
        title: "Tổng nhân viên",
        value: "128",
        change: "+12%",
        changeType: "positive",
        icon: Users,
        color: "bg-blue-500",
    },
    {
        title: "Phòng ban",
        value: "12",
        change: "+2",
        changeType: "positive",
        icon: Building2,
        color: "bg-green-500",
    },
    {
        title: "Vị trí công việc",
        value: "45",
        change: "+5",
        changeType: "positive",
        icon: Briefcase,
        color: "bg-purple-500",
    },
    {
        title: "Hiệu suất",
        value: "94%",
        change: "+3%",
        changeType: "positive",
        icon: TrendingUp,
        color: "bg-orange-500",
    },
];

function StatCard({ stat, loading }) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            <span
                                className={`text-xs font-medium ${stat.changeType === "positive"
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}
                            >
                                {stat.change}
                            </span>
                        </div>
                    </div>
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color} text-white shadow-lg`}
                    >
                        <stat.icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-6">
            <PageTitle title="Trang chủ" />

            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Tổng quan về hệ thống nhân sự</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard key={stat.title} stat={stat} loading={loading} />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Hoạt động gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))
                                : Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900">
                                                Nhân viên {String.fromCharCode(65 + i)} đã được thêm
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {i + 1} giờ trước
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Phòng ban hàng đầu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-2 w-full rounded-full" />
                                    </div>
                                ))
                                : [
                                    { name: "Engineering", value: 85 },
                                    { name: "Marketing", value: 72 },
                                    { name: "Sales", value: 68 },
                                    { name: "HR", value: 54 },
                                ].map((dept) => (
                                    <div key={dept.name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-slate-700">
                                                {dept.name}
                                            </span>
                                            <span className="text-slate-500">{dept.value}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-[var(--primary)]"
                                                style={{ width: `${dept.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
