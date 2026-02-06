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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { RoleService } from '@/services/roles.service';
import { Loader2, MoreHorizontal, Pencil, Shield, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function RoleListTable({ onEdit, onManagePermissions }) {
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const data = await RoleService.getRoles();
            setRoles(data.data || []);
        } catch (error) {
            toast.error('Failed to fetch roles');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

        try {
            await RoleService.deleteRole(id);
            toast.success('Role deleted successfully');
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete role');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No roles found
                            </TableCell>
                        </TableRow>
                    ) : (
                        roles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium">
                                    {role.roleName}
                                    {role.isSystem && <Badge variant="secondary" className="ml-2">System</Badge>}
                                </TableCell>
                                <TableCell>{role.description}</TableCell>
                                <TableCell>
                                    <Badge variant={role.status === 'active' ? 'default' : 'destructive'}>
                                        {role.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => onEdit(role)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onManagePermissions(role)}>
                                                <Shield className="mr-2 h-4 w-4" /> Permissions
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(role.id)}
                                                disabled={role.isSystem}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
