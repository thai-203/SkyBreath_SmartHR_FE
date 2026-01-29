"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { departmentsService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { ChevronDown, ChevronRight, Building2, User } from "lucide-react";
import Link from "next/link";

function OrgNode({ department, level = 0 }) {
    const [isOpen, setIsOpen] = useState(level < 2);
    const hasChildren = department.children && department.children.length > 0;

    return (
        <div className="relative">
            <div
                className={`flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-white hover:shadow-md transition-all duration-200 ${level === 0 ? "shadow-lg" : ""
                    }`}
            >
                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                )}
                {!hasChildren && <div className="w-6" />}
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${level === 0
                        ? "bg-[var(--primary)] text-white"
                        : "bg-slate-100 text-slate-600"
                        }`}
                >
                    <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-slate-900">{department.departmentName}</p>
                    {department.manager && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <User className="h-3 w-3" />
                            {department.manager.fullName}
                        </div>
                    )}
                </div>
            </div>
            {hasChildren && isOpen && (
                <div className="ml-8 mt-2 space-y-2 border-l-2 border-slate-200 pl-4">
                    {department.children.map((child) => (
                        <OrgNode key={child.id} department={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DepartmentsChartPage() {
    const { error } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChart = async () => {
            try {
                const response = await departmentsService.getChart();
                setData(response.data || []);
            } catch (err) {
                error(err.response?.data?.message || "Có lỗi xảy ra");
            } finally {
                setLoading(false);
            }
        };
        fetchChart();
    }, []);

    return (
        <div className="space-y-6">
            <PageTitle title="Sơ đồ tổ chức" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sơ đồ tổ chức</h1>
                    <p className="text-slate-500">Xem cấu trúc các phòng ban trong công ty</p>
                </div>
                <Link href="/departments">
                    <Button variant="outline">Quay lại danh sách</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cấu trúc phòng ban</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">
                            Chưa có dữ liệu phòng ban
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.map((dept) => (
                                <OrgNode key={dept.id} department={dept} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
