'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PermissionService, RoleService } from '@/services/roles.service';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PermissionAssignmentDialog({ role, open, onOpenChange }) {
    const [permissions, setPermissions] = useState([]);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && role) {
            loadData();
        }
    }, [open, role]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('Loading permissions for role:', role.id);
            const allPermissionsMsg = await PermissionService.getPermissions();
            const rolePermissionsMsg = await RoleService.getPermissions(role.id);

            console.log('All permissions:', allPermissionsMsg);
            console.log('Role permissions:', rolePermissionsMsg);

            const allPermissions = allPermissionsMsg.data || [];
            const rolePermissionIds = (rolePermissionsMsg.data || []).map(p => p.id);

            setPermissions(allPermissions);
            setSelectedPermissions(rolePermissionIds);
        } catch (error) {
            console.error('Error loading permissions:', error);
            const message = error.response?.data?.message || error.message || 'Failed to load permissions';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await RoleService.assignPermissions(role.id, selectedPermissions);
            toast.success('Permissions assigned successfully');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to assign permissions');
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermission = (id) => {
        setSelectedPermissions(prev =>
            prev.includes(id)
                ? prev.filter(pid => pid !== id)
                : [...prev, id]
        );
    };

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const module = perm.module || 'General';
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
    }, {});

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Permissions - {role?.roleName}</DialogTitle>
                    <DialogDescription>
                        Assign permissions to this role.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden min-h-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin h-8 w-8 text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-6 p-1">
                                {Object.entries(groupedPermissions).map(([module, perms]) => (
                                    <div key={module} className="space-y-3">
                                        <h4 className="font-semibold text-sm text-foreground uppercase tracking-wider bg-muted/50 p-2 rounded">{module}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                                            {perms.map((perm) => (
                                                <div key={perm.id} className="flex items-start space-x-2">
                                                    <Checkbox
                                                        id={`perm-${perm.id}`}
                                                        checked={selectedPermissions.includes(perm.id)}
                                                        onCheckedChange={() => togglePermission(perm.id)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor={`perm-${perm.id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {perm.permissionCode}
                                                        </label>
                                                        {perm.description && (
                                                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving || isLoading}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Permissions
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
