"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, XCircle, Clock8, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/common/Select";
import { Input } from "@/components/common/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/common/Toast";
import { authService } from "@/services";
import { requestsService } from "@/services/requests.service";
import RequestDetailModal from "@/app/(protected)/requests/my-requests/components/RequestDetailModal";
import { departmentsService } from "@/services/departments.service";

export default function ExcuseRequestsPage() {
    const searchParams = useSearchParams();
    const { success, error: toastError } = useToast();
    const isHR = authService.hasAnyRole(['ADMIN', 'HR']);

    const currentDate = new Date();
    const [month, setMonth] = useState(parseInt(searchParams.get("month")) || currentDate.getMonth() + 1);
    const [year, setYear] = useState(parseInt(searchParams.get("year")) || currentDate.getFullYear());
    const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") || "");
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [records, setRecords] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const handleReset = () => {
        setMonth(currentDate.getMonth() + 1);
        setYear(currentDate.getFullYear());
        setDepartmentId("");
        setSearchTerm("");
        setPage(1);
    };

    useEffect(() => {
        const fetchDeps = async () => {
            try {
                const res = await departmentsService.getAll();
                setDepartments(res?.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        if (isHR) fetchDeps();
    }, [isHR]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                month,
                year,
                page,
                limit,
                status: "APPROVED",
                requestTypeId: 2,
                ...(isHR && departmentId ? { departmentId } : {}),
                ...(searchTerm ? { search: searchTerm } : {}),
            };
            const res = await requestsService.getExcuseRequests(params);
            setRecords(res?.data?.items || []);
            setTotal(res?.data?.total || 0);
        } catch (err) {
            console.error("Error fetching excuse records:", err);
            toastError("Lỗi khi tải danh sách giải trình");
        } finally {
            setLoading(false);
        }
    }, [month, year, departmentId, searchTerm, page, limit, isHR, toastError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</Badge>;
            case 'REJECTED':
                return <Badge variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-rose-700 shadow-none"><XCircle className="w-3 h-3" /> Từ chối</Badge>;
            case 'PENDING':
                return <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700 shadow-none"><Clock8 className="w-3 h-3" /> Chờ duyệt</Badge>;
            default:
                return <Badge variant="secondary">Chưa gửi</Badge>;
        }
    };

    const totalPages = Math.ceil(total / limit);
    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đơn giải trình</h1>
                    <p className="text-slate-500 mt-1">
                        {isHR
                            ? "Quản lý và phê duyệt các đơn giải trình đi muộn/về sớm. Chỉ hiển thị đơn đã duyệt."
                            : "Danh sách các ngày đi muộn/về sớm cần giải trình (chỉ đơn đã duyệt)."}
                    </p>
                </div>
            </div>

            <Card className="p-4 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="w-40">
                            <Select
                                hidePlaceholder
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))}
                            />
                        </div>
                        <div className="w-32">
                            <Select
                                hidePlaceholder
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                options={Array.from({ length: 5 }, (_, i) => ({ value: currentDate.getFullYear() - 2 + i, label: `${currentDate.getFullYear() - 2 + i}` }))}
                            />
                        </div>
                        {isHR && (
                            <div className="w-64">
                                <Select
                                    placeholder="Phòng ban"
                                    value={departmentId}
                                    onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
                                    options={departments.map(d => ({ value: d.id, label: d.departmentName }))}
                                />
                            </div>
                        )}
                        {isHR && (
                            <div className="w-64">
                                <Input
                                    placeholder="Tìm kiếm nhân viên, mã số..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                    icon={<Search className="w-4 h-4 text-slate-400" />}
                                />
                            </div>
                        )}
                        <Button variant="ghost" onClick={handleReset} className="text-slate-500 hover:text-rose-500 hover:bg-rose-50 px-3 h-10">
                            Xóa lọc
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden shadow-sm border-slate-200">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Mã đơn</TableHead>
                            {isHR && <TableHead>Nhân viên</TableHead>}
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={isHR ? 6 : 5} className="h-48 text-center px-0">
                                    <div className="flex flex-col items-center justify-center w-full gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 border-4 border-indigo-100 rounded-full"></div>
                                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                        </div>
                                        <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : records.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isHR ? 6 : 5} className="h-48 text-center px-0">
                                    <div className="flex flex-col items-center justify-center w-full gap-3 opacity-60">
                                        <div className="p-4 bg-slate-50 rounded-full border border-dashed border-slate-200">
                                            <AlertCircle className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 font-medium">Không có dữ liệu vi phạm cần giải trình.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((record) => (
                                <TableRow key={record.id} className="group hover:bg-slate-50/80 transition-colors">
                                    <TableCell className="font-mono text-xs text-indigo-600 font-semibold whitespace-nowrap">
                                        {record.requestCode || `#${record.id}`}
                                    </TableCell>
                                    {isHR && (
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">
                                                    {record.employee?.fullName?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 leading-none">{record.employee?.fullName}</p>
                                                    <p className="text-[11px] font-mono text-slate-500 mt-1.5 uppercase tracking-wider">{record.employee?.employeeCode}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                                        {record.startDate || "—"} {record.startTime ? `(${record.startTime})` : ""} → {record.endDate || "—"} {record.endTime ? `(${record.endTime})` : ""}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-700">
                                        {record.description || <span className="text-slate-400 italic">—</span>}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <button
                                            type="button"
                                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                                            onClick={() => setSelectedRequest(record)}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {total > 0 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-slate-500">
                        Hiển thị {startItem}–{endItem} / {total} đơn
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40"
                        >
                            Trước
                        </button>
                        <span className="text-sm text-slate-600">{page} / {totalPages || 1}</span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}

            {selectedRequest && (
                <RequestDetailModal
                    isOpen={!!selectedRequest}
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onRefresh={fetchData}
                    canApprove={isHR}
                />
            )}
        </div>
    );
}
