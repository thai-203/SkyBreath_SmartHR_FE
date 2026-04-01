"use client";

import { Edit, Trash2, Search, Eye, Settings2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function RequestTypesTable({
    data, loading, search, onSearchChange,
    currentPage, totalPages, onPageChange,
    onEdit, onDelete, onDetail, onPolicy,
    groups, selectedGroupId, onGroupFilterChange
}) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm theo tên..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="w-60">
                    <select
                        value={selectedGroupId || ""}
                        onChange={(e) => onGroupFilterChange(e.target.value ? parseInt(e.target.value) : null)}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <option value="">Tất cả nhóm đơn</option>
                        {(groups || []).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-14">STT</TableHead>
                            <TableHead>Tên loại đơn</TableHead>
                            <TableHead>Nhóm đơn</TableHead>
                            <TableHead>Policy</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Đang tải...</TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-slate-500">Chưa có dữ liệu</TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow key={item.id} className="hover:bg-slate-50">
                                    <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                                    <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
                                            {item.requestGroup?.name || "—"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {item.policy ? (
                                            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                                Đã cấu hình
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50 gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 inline-block" />
                                                Chưa cấu hình
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === "ACTIVE" ? "success" : "secondary"}>
                                            {item.status === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 text-slate-500">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDetail(item)}
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onPolicy(item)}
                                                title="Cấu hình Policy"
                                            >
                                                <Settings2 className="h-4 w-4 text-indigo-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(item)}
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="h-4 w-4 text-emerald-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(item)}
                                                title="Xóa"
                                            >
                                                <Trash2 className="h-4 w-4 text-rose-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Trang {currentPage} / {totalPages}</p>
                <div className="flex space-x-2">
                    <Button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} variant="outline" size="sm">Trước</Button>
                    <Button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} variant="outline" size="sm">Sau</Button>
                </div>
            </div>
        </div>
    );
}
