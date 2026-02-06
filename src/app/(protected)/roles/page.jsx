'use client';

import EditRoleDialog from '@/components/roles/edit-role-dialog';
import RolePermissionMatrix from '@/components/roles/role-permission-matrix';
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
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-blue-600" />
                        Roles & Permissions
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quản lý các vai trò hệ thống và cấu hình quyền truy cập theo từng phân hệ.
                    </p>
                </div>
                <Link href="/roles/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-[1.02]">
                        <Plus className="mr-2 h-4 w-4" /> Create New Role
                    </Button>
                </Link>
            </div>

            <RolePermissionMatrix key={refreshKey} />

            <EditRoleDialog
                role={editRole}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSuccess={handleSuccess}
            />
        </div>
    );
}

