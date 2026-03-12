'use client';

import { Button } from '@/components/ui/button';
import { PermissionService } from '@/services/roles.service';
import { Loader2, Plus, RefreshCw, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import PermissionModal from './components/PermissionModal';
import PermissionPagination from './components/PermissionPagination';
import PermissionTable from './components/PermissionTable';

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState('all');
    const [modules, setModules] = useState([]);
    const [sortField, setSortField] = useState('permissionCode');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);

    const fetchPermissions = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                search: searchQuery,
                module: selectedModule !== 'all' ? selectedModule : undefined,
                sortField,
                sortOrder,
                page: currentPage,
                limit: pageSize
            };

            const response = await PermissionService.getPermissions(params);

            // Handle new paginated response structure: { success, message, data: { data: [], meta: {} } }
            // Or old one if any: { success, message, data: [] }
            const result = response.data || response;

            if (result && result.data && Array.isArray(result.data)) {
                setPermissions(result.data);
                setTotalPages(result.meta?.totalPages || 1);
            } else if (Array.isArray(result)) {
                setPermissions(result);
                setTotalPages(Math.ceil(result.length / pageSize) || 1);
            }

            // Extract unique modules for filtering if not already done
            // This is better done by a separate endpoint if possible
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Không thể tải danh sách quyền');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedModule, currentPage]);

    // Independent fetch for filter modules
    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await PermissionService.getPermissions({ limit: 1000 });
                const result = response.data || response;
                const data = result.data || result;
                if (Array.isArray(data)) {
                    const uniqueModules = [...new Set(data.map(p => p.module))].filter(Boolean).sort();
                    setModules(uniqueModules);
                }
            } catch (err) {
                console.error("Failed to fetch modules", err);
            }
        };
        fetchModules();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPermissions();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPermissions]);

    const handleCreate = () => {
        setEditingPermission(null);
        setIsModalOpen(true);
    };

    const handleEdit = (permission) => {
        setEditingPermission(permission);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa quyền này? Hành động này không thể hoàn tác.')) return;

        try {
            await PermissionService.deletePermission(id);
            toast.success('Xóa quyền thành công');
            fetchPermissions();
        } catch (error) {
            toast.error('Lỗi khi xóa quyền');
        }
    };

    const handleSuccess = () => {
        fetchPermissions();
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortField(field);
            setSortOrder('ASC');
        }
        setCurrentPage(1); // Reset to first page on sort
    };

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-white to-blue-50/20 p-8 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/20 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="space-y-2 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Quản lý quyền hệ thống
                        </h1>
                    </div>
                    <p className="text-gray-500 text-base max-w-2xl leading-relaxed">
                        Định nghĩa các mã quyền truy cập cho từng chức năng trong hệ thống Smart HR.
                        Các quyền này sẽ được sử dụng để gán cho các vai trò khác nhau.
                    </p>
                </div>

                <div className="flex gap-3 relative">
                    <Button
                        variant="outline"
                        onClick={fetchPermissions}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                    <Button
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 transition-all hover:scale-[1.03] active:scale-[0.98] font-bold px-6"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Thêm quyền mới
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            {loading && permissions.length === 0 ? (
                <div className="flex flex-col h-[400px] items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-gray-500 font-medium text-lg">Đang tải danh sách quyền...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <PermissionTable
                        permissions={permissions}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        searchQuery={searchQuery}
                        setSearchQuery={(val) => {
                            setSearchQuery(val);
                            setCurrentPage(1);
                        }}
                        selectedModule={selectedModule}
                        setSelectedModule={(val) => {
                            setSelectedModule(val);
                            setCurrentPage(1);
                        }}
                        modules={modules}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                    />

                    <PermissionPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <PermissionModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                permission={editingPermission}
                onSuccess={handleSuccess}
                modules={modules}
            />
        </div>
    );
}
