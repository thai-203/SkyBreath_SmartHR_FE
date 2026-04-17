"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Edit, Eye, Trash2, Copy } from "lucide-react";
import Link from "next/link";

export function HolidayGroupTable({ groups, onEdit, onDelete, onInherit }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent border-gray-100">
                        <TableHead className="w-[100px] font-bold text-gray-700">Mã</TableHead>
                        <TableHead className="font-bold text-gray-700">Tên danh mục</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-gray-700">Năm</TableHead>
                        <TableHead className="font-bold text-gray-700">Phạm vi</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-gray-700">Trạng thái</TableHead>
                        <TableHead className="font-bold text-gray-700">Mô tả</TableHead>
                        <TableHead className="w-[120px] text-right font-bold text-gray-700">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.length > 0 ? (
                        groups.map((group) => (
                            <TableRow key={group.id} className="hover:bg-blue-50/30 transition-colors border-gray-50">
                                <TableCell className="font-mono text-xs text-blue-600">{group.groupCode}</TableCell>
                                <TableCell className="font-medium text-gray-900">
                                    <Link href={`/holidays/${group.id}`} className="hover:text-blue-600 hover:underline">
                                        {group.groupName}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center font-bold text-slate-600">
                                    {group.year}
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold uppercase">
                                        {group.applicableScope}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {group.status === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm truncate max-w-[200px]">
                                    {group.description || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Link href={`/holidays/${group.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                            onClick={() => onEdit?.(group)}
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                            onClick={() => onInherit?.(group)}
                                            title="Kế thừa cho năm sau"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            onClick={() => onDelete?.(group.id)}
                                            title="Xóa"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-gray-400 italic">
                                Không có danh mục ngày lễ nào.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
