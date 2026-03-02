'use client';

import EditRoleDialog from '@/app/(protected)/roles/components/edit-role-dialog';
import RolePermissionMatrix from '@/app/(protected)/roles/components/role-permission-matrix';
import { Button } from '@/components/ui/button';
import { Plus, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function RolesPage() {
    const [editRole, setEditRole] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="container mx-auto py-8 space-y-6 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-white to-blue-50/20 p-8 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/20 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="space-y-2 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Vai trò & Phân quyền
                        </h1>
                    </div>
                    <p className="text-gray-500 text-base max-w-2xl leading-relaxed">
                        Quản lý các vai trò hệ thống và cấu hình quyền truy cập chi tiết cho từng phân hệ.
                    </p>
                </div>

                <div className="relative">
                    <Link href="/roles/create">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 transition-all hover:scale-[1.03] active:scale-[0.98] font-bold px-6">
                            <Plus className="mr-2 h-5 w-5" /> Tạo vai trò mới
                        </Button>
                    </Link>
                </div>
            </div>

            <RolePermissionMatrix
                key={refreshKey}
                onEditRole={(role) => {
                    setEditRole(role);
                    setIsEditOpen(true);
                }}
            />

            <EditRoleDialog
                role={editRole}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSuccess={handleSuccess}
            />
        </div>
    );
}

