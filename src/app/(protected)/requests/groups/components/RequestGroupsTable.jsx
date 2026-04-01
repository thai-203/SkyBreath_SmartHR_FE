"use client";

import { Edit, Trash2, Eye, GitMerge, ArchiveRestore } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { REQUEST_GROUP_CODE_LABELS } from "@/constants/request.enum";

export default function RequestGroupsTable({
    data, loading, search, onSearchChange,
    currentPage, totalPages, onPageChange,
    onEdit, onDelete, onConfig, onView, onRestore
}) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm theo tên..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-16">STT</TableHead>
                            <TableHead>Mã nhóm</TableHead>
                            <TableHead>Tên nhóm đơn</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Đang tải...</TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-slate-500">Chưa có dữ liệu</TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow
                                    key={item.id}
                                    className={item.isDeleted ? "bg-slate-100 opacity-60" : "hover:bg-slate-50"}
                                >
                                    <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                                    <TableCell className="font-semibold text-slate-700">
                                        {REQUEST_GROUP_CODE_LABELS[item.code] || item.code}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                                    <TableCell>
                                        {item.isDeleted ? (
                                            <Badge variant="destructive" className="opacity-70">Đã xóa</Badge>
                                        ) : (
                                            <Badge variant={item.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                                {item.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 text-slate-500">
                                            {item.isDeleted ? (
                                                /* Bản ghi đã xóa mềm: chỉ hiển thị nút khôi phục */
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onRestore(item)}
                                                    title="Khôi phục bản ghi"
                                                >
                                                    <ArchiveRestore className="h-4 w-4 text-indigo-500" />
                                                </Button>
                                            ) : (
                                                /* Bản ghi bình thường */
                                                <>
                                                    <Button variant="ghost" size="icon" onClick={() => onView(item)} title="Xem chi tiết (Loại đơn)">
                                                        <Eye className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onConfig(item)} title="Cấu hình luồng duyệt">
                                                        <GitMerge className="h-4 w-4 text-amber-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Chỉnh sửa">
                                                        <Edit className="h-4 w-4 text-emerald-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onDelete(item)} title="Xóa">
                                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Phân trang đơn giản */}
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
