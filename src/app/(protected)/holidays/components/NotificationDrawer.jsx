'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { departmentsService } from '@/services/departments.service';
import { employeesService } from '@/services/employees.service';
import { holidayService } from '@/services/holiday.service';
import { useToast } from '@/components/common/Toast';
import { 
    ChevronDown, 
    ChevronRight, 
    Building2, 
    User, 
    Bell, 
    Send, 
    Clock, 
    CheckSquare,
    Users
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

function TreeNode({ item, onSelect, selectedIds, level = 0 }) {
    const [isOpen, setIsOpen] = useState(level < 1);
    const hasChildren = (item.children && item.children.length > 0) || (item.employees && item.employees.length > 0);
    const isEmployee = !!item.fullName;
    
    // Improved selection logic for departments
    const isSelected = useMemo(() => {
        if (isEmployee) return selectedIds.includes(item.id);
        if (!item.employees || item.employees.length === 0) return false;
        return item.employees.every(emp => selectedIds.includes(emp.id));
    }, [isEmployee, item.id, item.employees, selectedIds]);

    const isIndeterminate = useMemo(() => {
        if (isEmployee || !item.employees || item.employees.length === 0) return false;
        const selectedCount = item.employees.filter(emp => selectedIds.includes(emp.id)).length;
        return selectedCount > 0 && selectedCount < item.employees.length;
    }, [isEmployee, item.employees, selectedIds]);

    return (
        <div className="select-none">
            <div 
                className={`flex items-center py-2 px-2 rounded-md hover:bg-gray-50 transition-colors group ${
                    isEmployee ? 'ml-6' : ''
                }`}
            >
                {!isEmployee && hasChildren && (
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1 mr-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                )}
                {!isEmployee && !hasChildren && <div className="w-6 mr-1" />}
                
                <div className="flex items-center gap-2 flex-1">
                    <Checkbox 
                        id={`node-${item.id}`}
                        checked={isIndeterminate ? 'indeterminate' : isSelected}
                        onCheckedChange={(checked) => onSelect(item, !!checked)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=indeterminate]:bg-blue-400 data-[state=indeterminate]:border-blue-400"
                    />
                    
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelect(item, !isSelected)}>
                        {isEmployee ? (
                            <User className="h-4 w-4 text-blue-500" />
                        ) : (
                            <Building2 className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-sm ${isEmployee ? 'text-gray-700' : 'font-semibold text-gray-900 uppercase'}`}>
                            {isEmployee ? item.fullName : item.departmentName}
                        </span>
                    </div>
                </div>
            </div>

            {isOpen && hasChildren && (
                <div className="ml-4 border-l border-gray-100 pl-2">
                    {item.children?.map(child => (
                        <TreeNode 
                            key={`dept-${child.id}`} 
                            item={child} 
                            onSelect={onSelect} 
                            selectedIds={selectedIds} 
                            level={level + 1} 
                        />
                    ))}
                    {item.employees?.map(emp => (
                        <TreeNode 
                            key={`emp-${emp.id}`} 
                            item={emp} 
                            onSelect={onSelect} 
                            selectedIds={selectedIds} 
                            level={level + 1} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function NotificationDrawer({ open, onOpenChange, holiday }) {
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [mode, setMode] = useState('manual'); // 'manual' | 'auto'
    const [scheduledAt, setScheduledAt] = useState('');

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, empRes] = await Promise.all([
                departmentsService.getChart(),
                employeesService.getAll({ limit: 1000 })
            ]);

            const departments = deptRes.data || [];
            const employees = empRes.data?.items || empRes.data || [];

            // Map employees to departments
            const buildTree = (depts) => {
                return depts.map(dept => {
                    const deptEmployees = employees.filter(emp => emp.departmentId === dept.id);
                    return {
                        ...dept,
                        employees: deptEmployees,
                        children: dept.children ? buildTree(dept.children) : []
                    };
                });
            };

            setTreeData(buildTree(departments));
        } catch (err) {
            error("Không thể tải danh sách nhân sự");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item, checked) => {
        const isEmployee = !!item.fullName;
        
        let idsToToggle = [];
        if (isEmployee) {
            idsToToggle = [item.id];
        } else {
            // Only toggle direct employees of this department
            idsToToggle = item.employees?.map(e => e.id) || [];
        }

        if (idsToToggle.length === 0) return;

        if (checked) {
            setSelectedEmployeeIds(prev => Array.from(new Set([...prev, ...idsToToggle])));
        } else {
            setSelectedEmployeeIds(prev => prev.filter(id => !idsToToggle.includes(id)));
        }
    };

    const handleSend = async () => {
        if (selectedEmployeeIds.length === 0) {
            error("Vui lòng chọn ít nhất một nhân sự");
            return;
        }

        if (mode === 'auto' && !scheduledAt) {
            error("Vui lòng chọn thời gian tự động gửi");
            return;
        }

        setSending(true);
        try {
            await holidayService.sendNotification({
                employeeIds: selectedEmployeeIds,
                holidayId: holiday?.id,
                type: mode,
                scheduledAt: mode === 'auto' ? new Date(scheduledAt) : undefined
            });
            success(mode === 'auto' ? "Đã lên lịch gửi thông báo thành công" : "Đã gửi thông báo thành công");
            onOpenChange(false);
            setSelectedEmployeeIds([]);
        } catch (err) {
            error(err.response?.data?.message || "Gửi thông báo thất bại");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full sm:max-w-[500px] h-[100vh] fixed right-0 top-0 translate-x-0 translate-y-0 rounded-none border-l shadow-2xl bg-white p-0 flex flex-col">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-indigo-600" />
                
                <DialogHeader className="p-6 border-b">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Bell className="h-5 w-5 text-blue-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-900">Gửi thông báo nghỉ lễ</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-500">
                        {holiday ? `Thông báo cho ngày lễ: ${holiday.name}` : 'Chọn nhân sự và cấu hình gửi thông báo cho kỳ nghỉ sắp tới.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex border-b">
                    <button 
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                            mode === 'manual' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4" />
                            Gửi thủ công
                        </div>
                    </button>
                    <button 
                        onClick={() => setMode('auto')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                            mode === 'auto' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" />
                            Gửi tự động
                        </div>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                            Danh sách nhân sự ({selectedEmployeeIds.length})
                        </h3>
                        {selectedEmployeeIds.length > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedEmployeeIds([])}
                                className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                Bỏ chọn tất cả
                            </Button>
                        )}
                    </div>

                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                <p className="text-sm text-gray-500 font-medium">Đang tải cây nhân sự...</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {treeData.map(dept => (
                                    <TreeNode 
                                        key={dept.id} 
                                        item={dept} 
                                        onSelect={handleSelect} 
                                        selectedIds={selectedEmployeeIds} 
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {mode === 'auto' && (
                        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <label className="text-sm font-semibold text-indigo-900 mb-2 block flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Thời gian gửi tự động
                            </label>
                            <Input 
                                type="datetime-local" 
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="bg-white border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                            />
                            <p className="text-[11px] text-indigo-600 mt-2 italic">
                                * Hệ thống sẽ tự động gửi thông báo đến các nhân sự đã chọn vào thời gian này.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-gray-50/50">
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            className="flex-1 py-6 border-gray-200 text-gray-700 hover:bg-white transition-all shadow-sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Hủy
                        </Button>
                        <Button 
                            className={`flex-[2] py-6 shadow-lg transition-all ${
                                mode === 'auto' 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                            }`}
                            disabled={sending || selectedEmployeeIds.length === 0}
                            onClick={handleSend}
                        >
                            {sending ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                mode === 'auto' ? <Clock className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />
                            )}
                            {mode === 'auto' ? 'Lên lịch tự động' : 'Gửi ngay bây giờ'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
