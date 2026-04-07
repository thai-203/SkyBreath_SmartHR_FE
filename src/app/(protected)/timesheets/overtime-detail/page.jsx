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

function formatTime(value) {
    if (value == null || value === "") return "—";
    const s = String(value);
    return s.length >= 5 ? s.slice(0, 5) : s;
}

function formatDate(value) {
    if (!value) return "—";
    const d = typeof value === "string" ? value.slice(0, 10) : value;
    return d;
}

export default function OvertimeDetailPage() {
    const searchParams = useSearchParams();
    const { error: toastError } = useToast();
    const isHR = authService.hasAnyRole(["ADMIN", "HR"]);

    const currentDate = new Date();
    const [month, setMonth] = useState(parseInt(searchParams.get("month")) || currentDate.getMonth() + 1);
    const [year, setYear] = useState(parseInt(searchParams.get("year")) || currentDate.getFullYear());
    const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [status, setStatus] = useState(searchParams.get("status") || "");

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
        setStatus("");
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
                ...(isHR && departmentId ? { departmentId } : {}),
                ...(searchTerm ? { search: searchTerm } : {}),
                ...(status ? { status } : {}),
            };
            const res = await requestsService.getOvertimeDetailRequests(params);
            setRecords(res?.data?.items || []);
            setTotal(res?.data?.total || 0);
        } catch (err) {
            console.error("Error fetching overtime detail rows:", err);
            toastError("Lỗi khi tải bảng tăng ca chi tiết");
        } finally {
            setLoading(false);
        }
    }, [month, year, departmentId, searchTerm, status, page, limit, isHR, toastError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getStatusBadge = (s) => {
        switch (s) {
            case "APPROVED":
                return (
                    <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none">
                        <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-rose-700 shadow-none">
                        <XCircle className="w-3 h-3" /> Từ chối
                    </Badge>
                );
            case "PENDING":
                return (
                    <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700 shadow-none">
                        <Clock8 className="w-3 h-3" /> Chờ duyệt
                    </Badge>
                );
            case "DRAFT":
                return <Badge variant="secondary">Nháp</Badge>;
            case "CANCELLED":
                return <Badge variant="outline">Đã hủy</Badge>;
            case "REVOKED":
                return <Badge variant="outline">Thu hồi</Badge>;
            default:
                return <Badge variant="secondary">{s || "—"}</Badge>;
        }
    };

    const totalPages = Math.ceil(total / limit);
    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    const colSpan = isHR ? 9 : 8;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bảng tăng ca chi tiết</h1>
                    <p className="text-slate-500 mt-1">
                        {isHR
                            ? "Theo dõi từng dòng đăng ký tăng ca (theo ngày làm trong tháng)."
                            : "Các dòng tăng ca của bạn trong kỳ đã chọn."}
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
                                options={Array.from({ length: 12 }, (_, i) => ({
                                    value: i + 1,
                                    label: `Tháng ${i + 1}`,
                                }))}
                            />
                        </div>
                        <div className="w-32">
                            <Select
                                hidePlaceholder
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                options={Array.from({ length: 5 }, (_, i) => ({
                                    value: currentDate.getFullYear() - 2 + i,
                                    label: `${currentDate.getFullYear() - 2 + i}`,
                                }))}
                            />
                        </div>
                        {isHR && (
                            <div className="w-64">
                                <Select
                                    placeholder="Phòng ban"
                                    value={departmentId}
                                    onChange={(e) => {
                                        setDepartmentId(e.target.value);
                                        setPage(1);
                                    }}
                                    options={departments.map((d) => ({ value: d.id, label: d.departmentName }))}
                                />
                            </div>
                        )}
                        {isHR && (
                            <div className="w-64">
                                <Input
                                    placeholder="Mã NV, họ tên..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    icon={<Search className="w-4 h-4 text-slate-400" />}
                                />
                            </div>
                        )}
                        <div className="w-40">
                            <Select
                                placeholder="Trạng thái"
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "DRAFT", label: "Nháp" },
                                    { value: "PENDING", label: "Chờ duyệt" },
                                    { value: "APPROVED", label: "Đã duyệt" },
                                    { value: "REJECTED", label: "Từ chối" },
                                    { value: "CANCELLED", label: "Đã hủy" },
                                    { value: "REVOKED", label: "Thu hồi" },
                                ]}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            className="text-slate-500 hover:text-rose-500 hover:bg-rose-50 px-3 h-10"
                        >
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
                            <TableHead>Loại đơn</TableHead>
                            <TableHead>Ngày làm</TableHead>
                            <TableHead>Trong ngày</TableHead>
                            <TableHead>Tổng giờ</TableHead>
                            <TableHead>Loại OT</TableHead>
                            <TableHead>Trạng thái đơn</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={colSpan} className="h-48 text-center px-0">
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
                                <TableCell colSpan={colSpan} className="h-48 text-center px-0">
                                    <div className="flex flex-col items-center justify-center w-full gap-3 opacity-60">
                                        <div className="p-4 bg-slate-50 rounded-full border border-dashed border-slate-200">
                                            <AlertCircle className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 font-medium">Không có dòng tăng ca trong kỳ lọc.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((line) => {
                                const req = line.request;
                                const emp = req?.employee;
                                const otTypeName =
                                    line.overtimeRule?.overtimeType?.name ||
                                    line.overtimeRule?.name ||
                                    "—";
                                return (
                                    <TableRow key={line.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <TableCell className="font-mono text-xs text-indigo-600 font-semibold whitespace-nowrap">
                                            {req?.requestCode || `#${req?.id}`}
                                        </TableCell>
                                        {isHR && (
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">
                                                        {emp?.fullName?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 leading-none">{emp?.fullName}</p>
                                                        <p className="text-[11px] font-mono text-slate-500 mt-1.5 uppercase tracking-wider">
                                                            {emp?.employeeCode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell className="text-sm text-slate-700 max-w-[220px]">
                                            {req?.requestType?.name || "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                                            {formatDate(line.workDate)}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                                            {formatTime(line.startTime)} → {formatTime(line.endTime)}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-800 whitespace-nowrap">
                                            {line.totalHours != null ? Number(line.totalHours).toFixed(2) : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-700 max-w-[200px]">{otTypeName}</TableCell>
                                        <TableCell>{getStatusBadge(req?.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                type="button"
                                                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                                                onClick={() => req && setSelectedRequest(req)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>

            {total > 0 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-slate-500">
                        Hiển thị {startItem}–{endItem} / {total} dòng
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40"
                        >
                            Trước
                        </button>
                        <span className="text-sm text-slate-600">
                            {page} / {totalPages || 1}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
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
