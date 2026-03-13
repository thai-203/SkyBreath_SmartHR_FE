'use client';

import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    ChevronDown, 
    ChevronRight, 
    Building2, 
    User,
    CheckCircle2
} from 'lucide-react';

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
                className={`flex items-center py-1.5 px-2 rounded-md hover:bg-gray-50 transition-colors group ${
                    isEmployee ? 'ml-6' : ''
                }`}
            >
                {!isEmployee && hasChildren && (
                    <button 
                        type="button"
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
                        className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=indeterminate]:bg-blue-400 data-[state=indeterminate]:border-blue-400"
                    />
                    
                    <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => onSelect(item, !isSelected)}>
                        {isEmployee ? (
                            <User className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        )}
                        <span className={`text-[13px] ${isEmployee ? 'text-gray-600' : 'font-semibold text-gray-800 uppercase'}`}>
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

export default function EmployeeTreeSelector({ 
    treeData, 
    selectedIds, 
    onSelect, 
    loading = false,
    maxHeight = "300px"
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 shadow-inner">
            <ScrollArea className={`h-auto max-h-[${maxHeight}]`}>
                <div className="space-y-1">
                    {treeData.map(dept => (
                        <TreeNode 
                            key={dept.id} 
                            item={dept} 
                            onSelect={onSelect} 
                            selectedIds={selectedIds} 
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
