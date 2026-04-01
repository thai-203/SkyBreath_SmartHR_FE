"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { ArrowLeft, Box, CheckCircle, Clock, Users, FileText } from "lucide-react";
import { requestGroupsService } from "@/services/request-groups.service";
import { requestTypesService } from "@/services/request-types.service";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPROVER_TYPES, TRACKING_CYCLE_LABELS, POLICY_UNIT_LABELS, REQUEST_GROUP_CODE_LABELS } from "@/constants/request.enum";

export default function RequestGroupDetailPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.id;

    const [group, setGroup] = useState(null);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("active"); // Mặc định ẩn các loại đơn đã bị xoá khỏi view cho đỡ rối


    const { error: showError } = useToast();

    const fetchGroupDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res = await requestGroupsService.getById(groupId);
            setGroup(res);
        } catch (err) {
            showError("Không lấy được thông tin nhóm đơn");
        } finally {
            setLoading(false);
        }
    }, [groupId, showError]);

    const fetchTypes = useCallback(async () => {
        try {
            const res = await requestTypesService.getAll({ requestGroupId: groupId, limit: 100 });
            setTypes(res.data?.data || []);
        } catch (err) {
            console.error("Lỗi tải loại đơn:", err);
        }
    }, [groupId]);

    useEffect(() => {
        fetchGroupDetail();
        fetchTypes();
    }, [fetchGroupDetail, fetchTypes]);

    const renderTrackingCycle = (val) => {
        return TRACKING_CYCLE_LABELS[val] || val;
    };
    const renderUnit = (val) => {
        return POLICY_UNIT_LABELS[val] || val;
    };

    const getApproverTypeName = (wf) => {
        if (wf.approverType === APPROVER_TYPES.DIRECT_MANAGER) return 'Quản lý trực tiếp';
        if (wf.approverUser) return `${wf.approverUser.fullName || wf.approverUser.username} (${wf.approverRole?.roleName || 'N/A'})`;
        return wf.approverRole?.roleName || 'N/A';
    };

    const filteredTypes = types.filter(t => {
        if (statusFilter === "all") return true;
        if (statusFilter === "deleted") return t.isDeleted;
        if (statusFilter === "inactive") return !t.isDeleted && t.status === "INACTIVE";
        if (statusFilter === "active") return !t.isDeleted && t.status === "ACTIVE";
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 p-5 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.push("/requests/groups")}>
                        <ArrowLeft className="h-4 w-4 text-slate-600" />
                    </Button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
                        <Box className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900">Chi tiết nhóm: {group?.name}</h1>
                        <p className="text-sm text-slate-500">{group?.description || 'Thông tin chi tiết nhóm đơn từ'}</p>
                    </div>
                    <Badge variant={group?.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-sm">
                        {group?.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                    </Badge>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Box className="h-5 w-5 text-indigo-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">Mã nhóm</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                        {REQUEST_GROUP_CODE_LABELS[group?.code] || group?.code || '—'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Số loại đơn</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{types.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <Users className="h-5 w-5 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Số cấp duyệt</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{group?.workflows?.length || 0}</p>
                </div>
            </div>

            {/* Luồng duyệt */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-500" />
                    Luồng duyệt
                </h2>
                {group?.workflows && group.workflows.length > 0 ? (
                    <div className="space-y-3">
                        {[...group.workflows].sort((a,b) => a.levelOrder - b.levelOrder).map((wf) => (
                            <div key={wf.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white text-sm font-bold">
                                    {wf.levelOrder}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">{wf.levelName}</p>
                                    <p className="text-sm text-slate-500">{getApproverTypeName(wf)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {wf.approverType === APPROVER_TYPES.DIRECT_MANAGER && (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                            Quản lý trực tiếp
                                        </Badge>
                                    )}
                                    {wf.approverType === APPROVER_TYPES.ROLE && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {wf.approverRole?.roleName || 'N/A'}
                                        </Badge>
                                    )}
                                    {wf.notifyApprover && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                            <Clock className="h-3 w-3 mr-1" /> Gửi TB
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-6 border border-dashed rounded-lg">
                        Chưa cấu hình luồng duyệt
                    </div>
                )}
            </div>

            {/* Danh sách loại đơn */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-500" />
                        Loại đơn thuộc nhóm
                    </h2>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="all">Tất cả</option>
                        <option value="active">Đang sử dụng</option>
                        <option value="inactive">Tạm ngưng</option>
                        <option value="deleted">Đã xóa mềm</option>
                    </select>
                </div>
                {filteredTypes.length > 0 ? (
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-16">STT</TableHead>
                                    <TableHead>Tên loại đơn</TableHead>
                                    <TableHead>Chu kỳ</TableHead>
                                    <TableHead>Đơn vị</TableHead>
                                    <TableHead>Hạn mức</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTypes.map((item, index) => (
                                    <TableRow key={item.id} className={item.isDeleted ? "bg-slate-100 opacity-60" : "hover:bg-slate-50"}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                                        <TableCell>Theo {renderTrackingCycle(item.policy?.trackingCycle)}</TableCell>
                                        <TableCell>{renderUnit(item.policy?.unit)}</TableCell>
                                        <TableCell className="font-semibold text-emerald-600">{item.policy?.maxQuantity}</TableCell>
                                        <TableCell>
                                            {item.isDeleted ? (
                                                <Badge variant="destructive" className="opacity-70">Đã xóa</Badge>
                                            ) : (
                                                <Badge variant={item.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                                    {item.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-6 border border-dashed rounded-lg">
                        Không có loại đơn nào phù hợp với bộ lọc
                    </div>
                )}
            </div>
        </div>
    );
}
