'use client';

import EditRoleDialog from '@/components/roles/edit-role-dialog';
import PermissionAssignmentDialog from '@/components/roles/permission-assignment';
import RoleListTable from '@/components/roles/role-list-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function RolesPage() {
    const [editRole, setEditRole] = useState(null);
    const [permissionRole, setPermissionRole] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPermissionOpen, setIsPermissionOpen] = useState(false);

    // Ref key to force table refresh
    const [refreshKey, setRefreshKey] = useState(0);

    const handleEdit = (role) => {
        setEditRole(role);
        setIsEditOpen(true);
    };

    const handleManagePermissions = (role) => {
        setPermissionRole(role);
        setIsPermissionOpen(true);
    };

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage system roles and their access permissions.
                    </p>
                </div>
                <Link href="/roles/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Role
                    </Button>
                </Link>
            </div>

            <RoleListTable
                key={refreshKey}
                onEdit={handleEdit}
                onManagePermissions={handleManagePermissions}
            />

            <EditRoleDialog
                role={editRole}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSuccess={handleSuccess}
            />

            <PermissionAssignmentDialog
                role={permissionRole}
                open={isPermissionOpen}
                onOpenChange={setIsPermissionOpen}
            />
        </div>
    );
}
