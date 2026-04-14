'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PermissionService, RoleService } from '@/services/roles.service';
import { CheckCircle2, Loader2, Pencil, Search, Shield, Trash2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function RolePermissionMatrix({ onEditRole }) {
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [permissionSearch, setPermissionSearch] = useState('');
    const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
    const [selectedActionFilter, setSelectedActionFilter] = useState('all');
    const [sortMode, setSortMode] = useState('asc'); // 'asc' or 'desc'
    const [expandedModules, setExpandedModules] = useState({});

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        fetchInitialData();
    }, [debouncedSearch]);

    const fetchInitialData = async () => {
        try {
            setIsLoadingRoles(true);
            const [rolesData, permsData] = await Promise.all([
                RoleService.getRoles(debouncedSearch),
                PermissionService.getPermissions({ limit: 1000 })
            ]);

            const fetchedRoles = rolesData.data || [];
            setRoles(fetchedRoles);
            // permissions now come in nested { data: { data: [], meta: {} } }
            setAllPermissions(permsData.data?.data || permsData.data || []);

            if (fetchedRoles.length > 0) {
                handleSelectRole(fetchedRoles[0]);
            }
        } catch (error) {
            toast.error('Không thể tải dữ liệu ban đầu');
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
            toast.error('Không thể tải quyền của vai trò');
            console.error(error);
        } finally {
            setIsLoadingPermissions(false);
        }
    };

    const togglePermission = (id) => {
        const perm = allPermissions.find(p => p.id === id);
        if (!perm) return;

        const getAction = (code) => {
            if (code.includes(':')) return code.split(':').pop().toUpperCase();
            if (code.includes('_')) return code.split('_').pop().toUpperCase();
            return 'OTHER';
        };

        const module = perm.module;
        const action = getAction(perm.permissionCode);
        const isChecking = !selectedPermissions.includes(id);

        setSelectedPermissions(prev => {
            let next = isChecking ? [...prev, id] : prev.filter(pid => pid !== id);

            if (!isChecking && action === 'VIEW') {
                // If unchecking VIEW, uncheck ALL others in the same module
                const modulePermIds = allPermissions
                    .filter(p => p.module === module)
                    .map(p => p.id);
                next = next.filter(pid => !modulePermIds.includes(pid));
            } else if (isChecking && action !== 'VIEW') {
                // If checking any CRUD, automatically check VIEW in the same module
                const viewPerm = allPermissions.find(p => p.module === module && getAction(p.permissionCode) === 'VIEW');
                if (viewPerm && !next.includes(viewPerm.id)) {
                    next.push(viewPerm.id);
                }
            }

            return next;
        });
    };

    const toggleModulePermissions = (module, permissions, isChecked) => {
        const modulePermIds = permissions.map(p => p.id);
        if (isChecked) {
            setSelectedPermissions(prev => [...new Set([...prev, ...modulePermIds])]);
        } else {
            setSelectedPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
        }
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        try {
            await RoleService.assignPermissions(selectedRole.id, selectedPermissions);
            
            toast.success('Cập nhật quyền thành công');
            
            // Refresh local roles data to update counts if needed
            const rolesData = await RoleService.getRoles();
            setRoles(rolesData.data || []);
        } catch (error) {
            toast.error('Cập nhật quyền thất bại');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

        try {
            await RoleService.deleteRole(id);
            toast.success('Xóa vai trò thành công');

            // Refresh list
            const rolesData = await RoleService.getRoles();
            const fetchedRoles = rolesData.data || [];
            setRoles(fetchedRoles);

            // If deleted role was selected, select the first one if available
            if (selectedRole?.id === id) {
                if (fetchedRoles.length > 0) {
                    handleSelectRole(fetchedRoles[0]);
                } else {
                    setSelectedRole(null);
                    setSelectedPermissions([]);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa vai trò thất bại');
        }
    };

    // Extract unique actions for filtering
    const availableActions = [...new Set(allPermissions.map(p => {
        const code = p.permissionCode;
        if (code.includes(':')) return code.split(':').pop();
        if (code.includes('_')) return code.split('_').pop();
        return 'OTHER';
    }))].sort();

    // Group and sort permissions by module
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        const module = perm.module || 'General';
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
    }, {});

    // Sort modules alphabetically
    const sortedModuleNames = Object.keys(groupedPermissions).sort();

    // Sort permissions within each module
    sortedModuleNames.forEach(module => {
        groupedPermissions[module].sort((a, b) => {
            const labelA = (a.description || a.permissionCode).toLowerCase();
            const labelB = (b.description || b.permissionCode).toLowerCase();
            const cmp = labelA.localeCompare(labelB);
            return sortMode === 'asc' ? cmp : -cmp;
        });
    });

    // Modules to show based on filter
    const modulesToShow = selectedModuleFilter === 'all'
        ? sortedModuleNames
        : sortedModuleNames.filter(m => m === selectedModuleFilter);

    const filterPermissionByAction = (p) => {
        if (selectedActionFilter === 'all') return true;
        const code = p.permissionCode;
        const action = code.includes(':') ? code.split(':').pop() : (code.includes('_') ? code.split('_').pop() : 'OTHER');
        return action === selectedActionFilter;
    };

    if (isLoadingRoles) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Đang tải danh sách vai trò...</span>
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
                            Chọn một vai trò để phân quyền :
                        </p>
                    </CardHeader>
                    <div className="px-4 pb-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm vai trò..."
                                className="pl-9 pr-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
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
                                        {selectedRole?.id === role.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-blue-600 hover:bg-blue-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditRole?.(role);
                                            }}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        {!role.isSystem && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(role.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {roles.length === 0 && !isLoadingRoles && (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground">Không tìm thấy vai trò nào.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            {/* Right: Permissions Grid */}
            <div className="md:col-span-8 lg:col-span-9 h-full">
                <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Phân quyền cho vai trò
                            </CardTitle>
                            <p className="text-sm text-gray-500">
                                Vai trò đang chọn: <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{selectedRole?.roleName}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <Select value={selectedModuleFilter} onValueChange={setSelectedModuleFilter}>
                                <SelectTrigger className="w-[140px] h-9 border-gray-200 text-xs">
                                    <SelectValue placeholder="Phân hệ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả phân hệ</SelectItem>
                                    {sortedModuleNames.map(m => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedActionFilter} onValueChange={setSelectedActionFilter}>
                                <SelectTrigger className="w-[140px] h-9 border-gray-200 text-xs">
                                    <SelectValue placeholder="Chức năng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả chức năng</SelectItem>
                                    {availableActions.map(a => (
                                        <SelectItem key={a} value={a}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortMode} onValueChange={setSortMode}>
                                <SelectTrigger className="w-[130px] h-9 border-gray-200 text-xs">
                                    <SelectValue placeholder="Sắp xếp" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asc">Sắp xếp A-Z</SelectItem>
                                    <SelectItem value="desc">Sắp xếp Z-A</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative flex-1 sm:w-48">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm quyền..."
                                    className="pl-9 h-9 border-gray-200 text-xs"
                                    value={permissionSearch}
                                    onChange={(e) => setPermissionSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || isLoadingPermissions || !selectedRole}
                                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 whitespace-nowrap h-9 px-4 text-xs"
                                size="sm"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                                Lưu thay đổi
                            </Button>
                        </div>
                    </CardHeader>
                    <Separator />

                    <div className="flex-1 overflow-hidden">
                        {isLoadingPermissions ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="p-6 space-y-10">
                                    {modulesToShow.map((module) => {
                                        const perms = groupedPermissions[module];
                                        const filteredPerms = perms.filter(p =>
                                            (p.permissionCode.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                                                (p.description && p.description.toLowerCase().includes(permissionSearch.toLowerCase()))) &&
                                            filterPermissionByAction(p)
                                        );

                                        if (filteredPerms.length === 0 && permissionSearch) return null;

                                        const getAction = (code) => {
                                            if (code.includes(':')) return code.split(':').pop().toUpperCase();
                                            if (code.includes('_')) return code.split('_').pop().toUpperCase();
                                            return 'OTHER';
                                        };

                                        const viewPerm = filteredPerms.find(p => getAction(p.permissionCode) === 'VIEW');
                                        const childPerms = viewPerm ? filteredPerms.filter(p => p.id !== viewPerm.id) : filteredPerms;

                                        const allChecked = filteredPerms.length > 0 && filteredPerms.every(p => selectedPermissions.includes(p.id));
                                        const someChecked = filteredPerms.some(p => selectedPermissions.includes(p.id)) && !allChecked;

                                        return (
                                            <div key={module} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        {viewPerm ? (
                                                            <Checkbox
                                                                id={`perm-${viewPerm.id}`}
                                                                checked={selectedPermissions.includes(viewPerm.id)}
                                                                onCheckedChange={() => togglePermission(viewPerm.id)}
                                                                className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                            />
                                                        ) : (
                                                            <Checkbox
                                                                id={`module-${module}`}
                                                                checked={allChecked ? true : someChecked ? "indeterminate" : false}
                                                                onCheckedChange={(checked) => toggleModulePermissions(module, filteredPerms, !!checked)}
                                                                className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                            />
                                                        )}
                                                        <button 
                                                            className="text-base font-bold text-gray-800 cursor-pointer flex items-center flex-wrap gap-2 hover:text-blue-600 transition-colors"
                                                            onClick={() => setExpandedModules(prev => ({ ...prev, [module]: !prev[module] }))}
                                                        >
                                                            {expandedModules[module] ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                                                            {module}
                                                            {viewPerm && <span className="text-sm font-normal text-muted-foreground">(Truy cập trang)</span>}
                                                        </button>
                                                        <Badge variant="secondary" className="font-normal text-xs">
                                                            {filteredPerms.length} quyền
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => toggleModulePermissions(module, filteredPerms, true)}
                                                        >
                                                            Chọn tất cả
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => toggleModulePermissions(module, filteredPerms, false)}
                                                        >
                                                            Bỏ chọn tất cả
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                {childPerms.length > 0 && expandedModules[module] && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 pl-9 pt-1 animate-in slide-in-from-top-2 duration-200">
                                                        {childPerms.map((perm) => {
                                                            const label = perm.description || perm.permissionCode;

                                                            return (
                                                                <div key={perm.id} className="flex items-center space-x-3 group py-1">
                                                                    <Checkbox
                                                                        id={`perm-${perm.id}`}
                                                                        checked={selectedPermissions.includes(perm.id)}
                                                                        onCheckedChange={() => togglePermission(perm.id)}
                                                                        className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all"
                                                                    />
                                                                    <label
                                                                        htmlFor={`perm-${perm.id}`}
                                                                        className="text-sm font-medium text-gray-600 cursor-pointer group-hover:text-blue-600 transition-colors"
                                                                    >
                                                                        {label}
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {allPermissions.length === 0 && (
                                        <div className="text-center py-20 text-muted-foreground">
                                            Không tìm thấy quyền nào. Hãy đảm bảo database đã được tạo dữ liệu mẫu (seed).
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
