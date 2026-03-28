"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Clock,
    Filter,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock8,
    FileEdit,
    User,
    ChevronLeft,
    ChevronRight,
    Search,
    Loader2
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/common/Select";
import { Input } from "@/components/common/Input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/common/Toast";
import { authService } from "@/services";
import { timesheetsService } from "@/services/timesheets.service";
import ExcuseRequestModal from "../components/ExcuseRequestModal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ExcuseRequestsPage() {
    const searchParams = useSearchParams();
    const { success, error: toastError } = useToast();
    const user = authService.getCurrentUser();
    const isHR = authService.hasAnyRole(['ADMIN', 'HR']);

    const currentDate = new Date();
    const [month, setMonth] = useState(parseInt(searchParams.get("month")) || currentDate.getMonth() + 1);
    const [year, setYear] = useState(parseInt(searchParams.get("year")) || currentDate.getFullYear());
    const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") || "");
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);

    // Modal state
    const [excuseModal, setExcuseModal] = useState({
        open: false,
        mode: 'view',
        date: '',
        employeeId: null,
        data: null
    });

    const handleReset = () => {
        setMonth(currentDate.getMonth() + 1);
        setYear(currentDate.getFullYear());
        setDepartmentId("");
        setSearchTerm("");
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { month, year };
            if (isHR && departmentId) params.departmentId = departmentId;

            const res = await timesheetsService.getLateEarlyRecords(params);
            setRecords(res?.data || []);
        } catch (err) {
            console.error("Error fetching excuse records:", err);
            toastError("Lỗi khi tải danh sách giải trình");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year, departmentId]);

    const handleOpenSubmit = (record) => {
        setExcuseModal({
            open: true,
            mode: 'create',
            date: record.date,
            employeeId: user.employeeId || record.employee?.id,
            data: null
        });
    };

    const handleViewExcuse = (record) => {
        setExcuseModal({
            open: true,
            mode: 'view',
            date: record.date,
            employeeId: record.employee?.id,
            data: record.excuseRequest,
            canEdit: isHR && record.excuseRequest?.status === 'PENDING'
        });
    };

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

    const filteredRecords = records.filter(r => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            r.employee?.fullName?.toLowerCase().includes(search) ||
            r.employee?.employeeCode?.toLowerCase().includes(search) ||
            r.date.includes(search)
        );
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đơn giải trình</h1>
                    <p className="text-slate-500 mt-1">
                        {isHR
                            ? "Quản lý và phê duyệt các đơn giải trình đi muộn/về sớm."
                            : "Danh sách các ngày đi muộn/về sớm cần giải trình."}
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
                                <Input
                                    placeholder="Tìm kiếm nhân viên, mã số..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                            {isHR && <TableHead>Nhân viên</TableHead>}
                            <TableHead>Ngày</TableHead>
                            <TableHead>Ca làm việc</TableHead>
                            <TableHead>Vào / Ra</TableHead>
                            <TableHead>Đi muộn</TableHead>
                            <TableHead>Về sớm</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={isHR ? 8 : 7} className="h-48 text-center px-0">
                                    <div className="flex flex-col items-center justify-center w-full gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 border-4 border-indigo-100 rounded-full"></div>
                                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                        </div>
                                        <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredRecords.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isHR ? 8 : 7} className="h-48 text-center px-0">
                                    <div className="flex flex-col items-center justify-center w-full gap-3 opacity-60">
                                        <div className="p-4 bg-slate-50 rounded-full border border-dashed border-slate-200">
                                            <AlertCircle className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 font-medium">Không có dữ liệu vi phạm cần giải trình.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRecords.map((record, idx) => (
                                <TableRow key={idx} className="group hover:bg-slate-50/80 transition-colors">
                                    {isHR && (
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">
                                                    {record.employee?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 leading-none">{record.employee?.fullName}</p>
                                                    <p className="text-[11px] font-mono text-slate-500 mt-1.5 uppercase tracking-wider">{record.employee?.employeeCode}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    )}
                                    <TableCell className="font-medium text-slate-700 whitespace-nowrap">{record.formattedDate || record.date}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold text-slate-800">{record.shiftName || "Hành chính"}</span>
                                            <span className="text-[11px] text-slate-500 font-medium">{record.shiftStartTime} - {record.shiftEndTime}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className={cn("text-sm transition-colors", record.lateMinutes > 0 ? "text-rose-600 font-bold" : "text-slate-600 font-medium")}>
                                                {record.checkIn || "--:--"}
                                            </span>
                                            <span className={cn("text-sm transition-colors", record.earlyLeaveMinutes > 0 ? "text-rose-600 font-bold" : "text-slate-600 font-medium")}>
                                                {record.checkOut || "--:--"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {record.lateMinutes > 0 ? (
                                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-xs font-bold border border-rose-100">{record.lateMinutes}p</span>
                                        ) : <span className="text-slate-300">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {record.earlyLeaveMinutes > 0 ? (
                                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-xs font-bold border border-rose-100">{record.earlyLeaveMinutes}p</span>
                                        ) : <span className="text-slate-300">-</span>}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(record.excuseRequest?.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {record.excuseRequest ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-1.5 border-slate-200 text-slate-600 shadow-none hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                                onClick={() => handleViewExcuse(record)}
                                            >
                                                <Search className="w-3.5 h-3.5" />
                                                Chi tiết
                                            </Button>
                                        ) : !isHR && (
                                            <Button
                                                size="sm"
                                                className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all font-semibold"
                                                onClick={() => handleOpenSubmit(record)}
                                            >
                                                <FileEdit className="w-3.5 h-3.5" />
                                                Gửi giải trình
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Reuse Modal */}
            <ExcuseRequestModal
                isOpen={excuseModal.open}
                onClose={() => setExcuseModal(prev => ({ ...prev, open: false }))}
                onSuccess={fetchData}
                mode={excuseModal.mode}
                date={excuseModal.date}
                employeeId={excuseModal.employeeId}
                data={excuseModal.data}
                canEdit={excuseModal.canEdit}
            />
        </div>
    );
}
