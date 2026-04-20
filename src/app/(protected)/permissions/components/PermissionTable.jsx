'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, MoreHorizontal, Pencil, Search, Shield, Trash2, X } from 'lucide-react';

export default function PermissionTable({
    permissions,
    onEdit,
    onDelete,
    searchQuery,
    setSearchQuery,
    selectedModule,
    setSelectedModule,
    modules,
    sortField,
    sortOrder,
    onSort
}) {
    const renderSortIcon = (field) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        return sortOrder === 'ASC'
            ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" />
            : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm mã quyền hoặc mô tả..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 border-gray-200 focus:border-blue-500 rounded-lg"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Filter className="h-4 w-4" />
                        Lọc theo phân hệ:
                    </div>
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger className="w-full md:w-[200px] border-gray-200 rounded-lg">
                            <SelectValue placeholder="Tất cả phân hệ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả phân hệ</SelectItem>
                            {modules.map(module => (
                                <SelectItem key={module} value={module}>{module}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead
                                className="w-[250px] font-bold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSort('permissionCode')}
                            >
                                <div className="flex items-center">
                                    Mã quyền (Permission Code)
                                    {renderSortIcon('permissionCode')}
                                </div>
                            </TableHead>
                            <TableHead
                                className="font-bold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSort('module')}
                            >
                                <div className="flex items-center">
                                    Phân hệ (Module)
                                    {renderSortIcon('module')}
                                </div>
                            </TableHead>
                            <TableHead
                                className="font-bold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSort('description')}
                            >
                                <div className="flex items-center">
                                    Mô tả (Description)
                                    {renderSortIcon('description')}
                                </div>
                            </TableHead>
                            <TableHead className="w-[100px] text-right font-bold text-gray-700">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {permissions.length > 0 ? (
                            permissions.map((permission) => (
                                <TableRow key={permission.id} className="hover:bg-blue-50/30 transition-colors border-gray-50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                                                <Shield className="h-3.5 w-3.5" />
                                            </div>
                                            <code className="text-blue-700 bg-blue-50/50 px-1.5 py-0.5 rounded text-xs font-mono font-bold tracking-tight uppercase">
                                                {permission.permissionCode}
                                            </code>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal border-gray-200 bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                                            {permission.module}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600 text-sm max-w-[400px] truncate">
                                        {permission.description || <span className="text-gray-300 italic">Chưa có mô tả</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                                                    <span className="sr-only">Mở menu</span>
                                                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 border-gray-100 shadow-xl">
                                                <DropdownMenuLabel className="text-xs font-semibold text-gray-400 px-2 py-1.5">Lựa chọn</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => onEdit(permission)}
                                                    className="cursor-pointer focus:bg-blue-50 focus:text-blue-700 py-2.5"
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(permission.id)}
                                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-2.5"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Xóa quyền
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                            <Search className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">Không tìm thấy dữ liệu</p>
                                            <p className="text-sm">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
