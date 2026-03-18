"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { PageTitle } from '@/components/common/PageTitle';
import { useToast } from '@/components/common/Toast';
import { departmentsService, employeesService, holidayService } from '@/services';
import { 
    ChevronDown, 
    ChevronRight, 
    Building2, 
    User, 
    Bell, 
    Send, 
    Clock, 
    CheckSquare,
    Users,
    ArrowLeft,
    Loader2
} from 'lucide-react';

function TreeNode({ item, onSelect, selectedIds, level = 0 }) {
    const [isOpen, setIsOpen] = useState(level < 1);
    const hasChildren = (item.children && item.children.length > 0) || (item.employees && item.employees.length > 0);
    const isEmployee = !!item.fullName;
    
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

export default function HolidayNotificationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const holidayId = searchParams.get('holidayId');
    const { success: toastSuccess, error: toastError } = useToast();

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [mode, setMode] = useState('manual');
    const [scheduledAt, setScheduledAt] = useState('');
    const [holidays, setHolidays] = useState([]);
    const [selectedHolidayId, setSelectedHolidayId] = useState(holidayId || '');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [deptRes, empRes, holidayRes] = await Promise.all([
                departmentsService.getChart(),
                employeesService.getAll({ limit: 1000 }),
                holidayService.findAll({ limit: 100 })
            ]);

            const departments = deptRes.data || [];
            const employees = empRes.data?.items || empRes.data || [];
            setHolidays(holidayRes.data?.items || holidayRes.data || []);

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
            toastError("Không thể tải dữ liệu");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelect = (item, checked) => {
        const isEmployee = !!item.fullName;
        let idsToToggle = [];
        if (isEmployee) {
            idsToToggle = [item.id];
        } else {
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
        if (!selectedHolidayId) {
            toastError("Vui lòng chọn ngày lễ");
            return;
        }

        if (selectedEmployeeIds.length === 0) {
            toastError("Vui lòng chọn ít nhất một nhân sự");
            return;
        }

        if (mode === 'auto' && !scheduledAt) {
            toastError("Vui lòng chọn thời gian tự động gửi");
            return;
        }

        setSending(true);
        try {
            await holidayService.sendNotification({
                employeeIds: selectedEmployeeIds,
                holidayId: selectedHolidayId,
                type: mode,
                scheduledAt: mode === 'auto' ? new Date(scheduledAt) : undefined
            });
            toastSuccess(mode === 'auto' ? "Đã lên lịch gửi thông báo thành công" : "Đã gửi thông báo thành công");
            router.push('/holidays');
        } catch (err) {
            toastError(err.response?.data?.message || "Gửi thông báo thất bại");
        } finally {
            setSending(false);
        }
    };

    const selectedHoliday = holidays.find(h => h.id === selectedHolidayId);

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <PageTitle title="Gửi thông báo nghỉ lễ" />
                    <p className="text-sm text-slate-500">Gửi thông báo cho nhân viên về các kỳ nghỉ lễ sắp tới</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Holiday Selection and Tree */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Bell className="h-4 w-4 text-blue-600" />
                                Chọn ngày lễ
                            </label>
                            <select 
                                value={selectedHolidayId}
                                onChange={(e) => setSelectedHolidayId(e.target.value)}
                                className="w-full p-2 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">-- Chọn ngày lễ --</option>
                                {holidays.map(h => (
                                    <option key={h.id} value={h.id}>{h.holidayName} ({new Date(h.startDate).toLocaleDateString('vi-VN')})</option>
                                ))}
                            </select>
                            {selectedHoliday && (
                                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100">
                                    <p><strong>Ngày bắt đầu:</strong> {new Date(selectedHoliday.startDate).toLocaleDateString('vi-VN')}</p>
                                    <p><strong>Ngày kết thúc:</strong> {new Date(selectedHoliday.endDate).toLocaleDateString('vi-VN')}</p>
                                    {selectedHoliday.description && <p><strong>Ghi chú:</strong> {selectedHoliday.description}</p>}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-col h-[500px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
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

                            <ScrollArea className="flex-1">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                        <p className="text-sm text-slate-500">Đang tải cây nhân sự...</p>
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
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings and Action */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 sticky top-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Chế độ gửi</label>
                            <div className="flex p-1 bg-slate-100 rounded-lg">
                                <button 
                                    onClick={() => setMode('manual')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                                        mode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <Users className="h-3 w-3 inline mr-1" />
                                    Thủ công
                                </button>
                                <button 
                                    onClick={() => setMode('auto')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                                        mode === 'auto' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    Tự động
                                </button>
                            </div>
                        </div>

                        {mode === 'auto' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-sm font-semibold text-slate-700">Thời gian gửi</label>
                                <Input 
                                    type="datetime-local" 
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                    className="w-full"
                                />
                                <p className="text-[11px] text-slate-500 italic">* Hệ thống sẽ tự động gửi vào thời gian này.</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100">
                            <Button 
                                className="w-full py-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
                                disabled={sending || selectedEmployeeIds.length === 0 || !selectedHolidayId}
                                onClick={handleSend}
                            >
                                {sending ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    mode === 'auto' ? <Clock className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />
                                )}
                                {mode === 'auto' ? 'Lên lịch gửi' : 'Gửi thông báo ngay'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
