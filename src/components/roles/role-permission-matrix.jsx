'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PermissionService, RoleService } from '@/services/roles.service';
import { CheckCircle2, Loader2, Shield, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function RolePermissionMatrix() {
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setIsLoadingRoles(true);
            const [rolesData, permsData] = await Promise.all([
                RoleService.getRoles(),
                PermissionService.getPermissions()
            ]);

            const fetchedRoles = rolesData.data || [];
            setRoles(fetchedRoles);
            setAllPermissions(permsData.data || []);

            if (fetchedRoles.length > 0) {
                handleSelectRole(fetchedRoles[0]);
            }
        } catch (error) {
            toast.error('Failed to load initial data');
            console.error(error);
        } finally {
            setIsLoadingRoles(false);
        }
    };

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setIsLoadingPermissions(true);
        try {
            const rolePerms = await RoleService.getPermissions(role.id);
            setSelectedPermissions((rolePerms.data || []).map(p => p.id));
        } catch (error) {
            toast.error('Failed to load role permissions');
            console.error(error);
        } finally {
            setIsLoadingPermissions(false);
        }
    };

    const togglePermission = (id) => {
        setSelectedPermissions(prev =>
            prev.includes(id)
                ? prev.filter(pid => pid !== id)
                : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        try {
            await RoleService.assignPermissions(selectedRole.id, selectedPermissions);
            toast.success('Permissions updated successfully');

            // Refresh local roles data to update counts if needed
            const rolesData = await RoleService.getRoles();
            setRoles(rolesData.data || []);
        } catch (error) {
            toast.error('Failed to update permissions');
        } finally {
            setIsSaving(false);
        }
    };

    // Group permissions by module
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        const module = perm.module || 'General';
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
    }, {});

    if (isLoadingRoles) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading roles...</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
            {/* Left: Role List */}
            <div className="md:col-span-4 lg:col-span-3">
                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Danh sách vai trò</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Chọn một vai trò để phân quyền
                        </p>
                    </CardHeader>
                    <Separator />
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    onClick={() => handleSelectRole(role)}
                                    className={`
                                        group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                                        ${selectedRole?.id === role.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-muted text-foreground'}
                                    `}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{role.roleName}</span>
                                        <span className="text-xs opacity-70">
                                            {/* We don't have permission count easily, but we can add it later */}
                                            {role.description || 'No description'}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {selectedRole?.id === role.id && <CheckCircle2 className="h-4 w-4" />}
                                        {!role.isSystem && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // handleDelete(role.id)
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            {/* Right: Permissions Grid */}
            <div className="md:col-span-8 lg:col-span-9 h-full">
                <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                        <div>
                            <CardTitle className="text-lg">Phân quyền cho vai trò</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Chỉnh sửa quyền cho vai trò: <span className="font-semibold text-foreground">{selectedRole?.roleName}</span>
                            </p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || isLoadingPermissions || !selectedRole}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                            Lưu thay đổi
                        </Button>
                    </CardHeader>
                    <Separator />

                    <div className="flex-1 overflow-hidden">
                        {isLoadingPermissions ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="p-6 space-y-8">
                                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                                        <div key={module} className="space-y-4">
                                            <div className="flex items-center">
                                                <h3 className="text-base font-semibold text-foreground">{module}</h3>
                                                <Separator className="flex-1 ml-4" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-2">
                                                {perms.map((perm) => {
                                                    // Extract cleaner labels: DEPT_CREATE -> Tạo mới, etc.
                                                    const label = perm.description || perm.permissionCode;

                                                    return (
                                                        <div key={perm.id} className="flex items-center space-x-3 group">
                                                            <Checkbox
                                                                id={`perm-${perm.id}`}
                                                                checked={selectedPermissions.includes(perm.id)}
                                                                onCheckedChange={() => togglePermission(perm.id)}
                                                                className="h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                            />
                                                            <label
                                                                htmlFor={`perm-${perm.id}`}
                                                                className="text-sm font-medium leading-none cursor-pointer group-hover:text-blue-600 transition-colors"
                                                            >
                                                                {label}
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {allPermissions.length === 0 && (
                                        <div className="text-center py-20 text-muted-foreground">
                                            No permissions found. Ensure the database is seeded.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
