"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { departmentsService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { ChevronDown, ChevronRight, Building2, User, FileText, Download } from "lucide-react";
import Link from "next/link";
import { Select } from "@/components/common/Select";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Mảng màu viền cho các cấp bậc
const LEVEL_COLORS = ["border-t-blue-500", "border-t-red-500", "border-t-yellow-500", "border-t-green-500", "border-t-purple-500"];
const LEVEL_COLORS_LEFT = ["border-l-blue-500", "border-l-red-500", "border-l-yellow-500", "border-l-green-500", "border-l-purple-500"];

function OrgNode({ department, level = 0, viewType = "rut-gon" }) {
    const [isOpen, setIsOpen] = useState(level < 2);
    const hasChildren = department.children && department.children.length > 0;
    const childCount = department.children ? department.children.length : 0;
    
    // Dữ liệu thật từ API
    const tns = department.totalEmployeeCount ?? 0;
    const tt = department.totalProbationCount ?? 0;

    if (!viewType || viewType === "rut-gon") {
        return (
            <div className="relative">
                <div
                    className={`flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-white hover:shadow-md transition-all duration-200 ${level === 0 ? "shadow-lg" : ""
                        }`}
                >
                    {hasChildren && (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    )}
                    {!hasChildren && <div className="w-6" />}
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${level === 0
                            ? "bg-[var(--primary)] text-white"
                            : "bg-slate-100 text-slate-600"
                            }`}
                    >
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-slate-900">{department.departmentName}</p>
                        {department.manager && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <User className="h-3 w-3" />
                                {department.manager.fullName}
                            </div>
                        )}
                    </div>
                </div>
                {hasChildren && isOpen && (
                    <div className="ml-8 mt-2 space-y-2 border-l-2 border-slate-200 pl-4">
                        {department.children.map((child) => (
                            <OrgNode key={child.id} department={child} level={level + 1} viewType={viewType} />
                        ))}
                    </div>
                )}
            </div>
        );
    }
    
    const borderColorClass = LEVEL_COLORS[level % LEVEL_COLORS.length];
    const borderLeftColorClass = LEVEL_COLORS_LEFT[level % LEVEL_COLORS_LEFT.length];

    if (viewType === "ngang") {
        return (
            <li>
                <div className={`node-content mx-auto w-max bg-white rounded-lg shadow-sm border border-slate-200 border-t-4 ${borderColorClass} relative z-10 transition-all hover:shadow-md min-w-[200px]`}>
                    <div className="p-3 text-center border-b border-slate-100">
                        <h4 className="font-semibold text-slate-800 text-sm whitespace-nowrap">{department.departmentName}</h4>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600 font-medium bg-slate-50/50 rounded-b-lg">
                        <span className="px-1.5 py-1.5 border-r border-slate-200 flex-1 text-center" title="Tổng nhân sự"><span className="text-blue-500">TNS:</span> {tns}</span>
                        <span className="px-1.5 py-1.5 flex-1 text-center" title="Thử việc"><span className="text-indigo-500">TT:</span> {tt}</span>
                    </div>
                    {hasChildren && (
                        <div 
                            onClick={() => setIsOpen(!isOpen)}
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-5 px-1.5 bg-white border border-red-400 text-red-500 rounded flex items-center justify-center text-[10px] hover:bg-slate-50 cursor-pointer z-20"
                        >
                            {isOpen ? "−" : `^${childCount}`}
                        </div>
                    )}
                </div>
                {hasChildren && isOpen && (
                    <ul>
                        {department.children.map((child) => (
                            <OrgNode key={child.id} department={child} level={level + 1} viewType={viewType} />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    // Kiểu dọc
    return (
        <div className="flex items-start mb-4 relative org-tree-doc-node">
            <div className={`node-content bg-white w-[250px] shrink-0 rounded-lg shadow-sm border border-slate-200 border-l-4 ${borderLeftColorClass} relative z-10 transition-all hover:shadow-md`}>
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800 text-sm whitespace-nowrap truncate" title={department.departmentName}>{department.departmentName}</h4>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-600 font-medium bg-slate-50/50 rounded-b-lg">
                    <span className="px-1.5 py-1.5 border-r border-slate-200 flex-1 text-center" title="Tổng nhân sự"><span className="text-blue-500">TNS:</span> {tns}</span>
                    <span className="px-1.5 py-1.5 flex-1 text-center" title="Thử việc"><span className="text-indigo-500">TT:</span> {tt}</span>
                </div>
                {hasChildren && (
                    <div 
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute top-1/2 -right-2.5 -translate-y-1/2 h-5 px-1.5 bg-white border border-red-400 text-red-500 rounded flex items-center justify-center text-[10px] hover:bg-slate-50 cursor-pointer z-20"
                    >
                        {isOpen ? "−" : `^${childCount}`}
                    </div>
                )}
            </div>
            {hasChildren && isOpen && (
                <div className="flex flex-col ml-8 org-tree-doc-children relative pt-2">
                    {department.children.map((child) => (
                        <OrgNode key={child.id} department={child} level={level + 1} viewType={viewType} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Function to find node by id
const findNodeById = (nodes, id) => {
    for (let node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

// Function to flatten tree
const flattenDepartments = (nodes) => {
    let list = [];
    nodes.forEach(node => {
        list.push({ value: node.id, label: node.departmentName, originalData: node });
        if (node.children && node.children.length > 0) {
            list = list.concat(flattenDepartments(node.children));
        }
    });
    return list;
};

export default function DepartmentsChartPage() {
    const { success, error } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [viewType, setViewType] = useState(""); // "", ngang, doc

    useEffect(() => {
        const fetchChart = async () => {
            try {
                const response = await departmentsService.getChart();
                setData(response.data || []);
            } catch (err) {
                error(err.response?.data?.message || "Có lỗi xảy ra");
            } finally {
                setLoading(false);
            }
        };
        fetchChart();
    }, []);

    const allDepartmentsFlat = useMemo(() => flattenDepartments(data), [data]);
    
    // If a specific department is selected, find it and make it the root. Otherwise use original data roots.
    const treeDataToRender = useMemo(() => {
        if (!selectedDepartmentId) return data;
        // Parse to number vì id từ DB là number, value từ select là string
        const idNum = Number(selectedDepartmentId);
        const foundNode = findNodeById(data, idNum);
        return foundNode ? [foundNode] : data;
    }, [data, selectedDepartmentId]);

    const viewOptions = [
        { value: "ngang", label: "Kiểu ngang" },
        { value: "doc", label: "Kiểu dọc" },
    ];

    const depOptions = useMemo(() => {
        return allDepartmentsFlat;
    }, [allDepartmentsFlat]);

    const exportToPDF = async () => {
        const input = document.getElementById("org-chart-container");
        if (!input) return;

        setIsExporting(true);
        try {
            // ── 1. Lưu style gốc ──
            const savedOverflow = input.style.overflow;
            const savedWidth = input.style.width;
            const savedMinWidth = input.style.minWidth;
            const savedHeight = input.style.height;

            // ── 2. Reset scroll của container ──
            input.scrollLeft = 0;
            input.scrollTop = 0;

            // ── 3. Bỏ clip overflow TRƯỚC, để layout tự mở rộng tự do ──
            input.style.overflow = "visible";
            input.style.width = "max-content";
            input.style.minWidth = "max-content";

            // ── 4. Đợi browser reflow xong (quan trọng: đo SAU khi overflow đã được gỡ) ──
            await new Promise((r) => setTimeout(r, 120));

            // ── 5. Đo kích thước thực của toàn bộ nội dung (sau khi layout đã mở rộng) ──
            const fullW = Math.max(input.scrollWidth, input.offsetWidth);
            const fullH = Math.max(input.scrollHeight, input.offsetHeight);

            // Cố định kích thước để html2canvas có reference chuẩn
            input.style.width = `${fullW}px`;
            await new Promise((r) => setTimeout(r, 40));

            // ── 6. Scroll trang về góc trên cùng tránh lệch toạ độ ──
            window.scrollTo(0, 0);

            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#f8fafc",
                windowWidth: fullW + 100,
                windowHeight: fullH + 100,
            });

            // ── 7. Khôi phục style ──
            input.style.overflow = savedOverflow;
            input.style.width = savedWidth;
            input.style.minWidth = savedMinWidth;
            input.style.height = savedHeight;

            // ── 8. Tạo PDF custom size vừa khít nội dung ──
            const imgData = canvas.toDataURL("image/png");
            // canvas.width = fullW * scale(2), nên chia 2 để về px gốc
            const chartWmm = (canvas.width / 2) * 0.264583;
            const chartHmm = (canvas.height / 2) * 0.264583;
            const margin = 10; // mm

            const pdf = new jsPDF({
                orientation: chartWmm > chartHmm ? "l" : "p",
                unit: "mm",
                format: [chartWmm + margin * 2, chartHmm + margin * 2],
            });
            pdf.addImage(imgData, "PNG", margin, margin, chartWmm, chartHmm);
            pdf.save("so-do-to-chuc.pdf");

            success("Xuất Sơ đồ tổ chức thành file PDF thành công!");
        } catch (err) {
            console.error("PDF Export Error:", err);
            error("Đã xảy ra lỗi khi xuất file PDF");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageTitle title="Sơ đồ tổ chức" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 uppercase">SƠ ĐỒ TỔ CHỨC VÀ DANH SÁCH NHÂN SỰ</h1>
                </div>
                {/* <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg">
                    <User className="w-4 h-4 text-[var(--primary)]" />
                    <span>Sơ đồ tổ chức và danh sách nhân sự</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                </div> */}
            </div>

            <div className="flex items-center gap-6 bg-white p-4 rounded-lg border border-slate-200">
                <div className="w-64">
                    <Select
                        label="Đơn vị"
                        options={depOptions}
                        value={selectedDepartmentId}
                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                        placeholder="Tất cả đơn vị"
                    />
                </div>
                <div className="w-48">
                    <Select
                        label="Kiểu xem"
                        options={viewOptions}
                        value={viewType}
                        onChange={(e) => setViewType(e.target.value)}
                        placeholder="Rút gọn"
                    />
                </div>
                
                <div className="ml-auto flex items-center gap-2 mt-6">
                    <Button 
                        onClick={exportToPDF} 
                        disabled={loading || data.length === 0 || isExporting}
                        className="gap-2 shrink-0 bg-rose-600 hover:bg-rose-700 text-white"
                    >
                        {isExporting ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Đang xuất...
                            </div>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Xuất PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent id="org-chart-container" className="p-6 overflow-x-auto bg-slate-50 min-h-[600px] border border-slate-200 shadow-inner rounded-xl">
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : treeDataToRender.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">
                            Chưa có dữ liệu phòng ban
                        </div>
                    ) : (
                        <div className={
                            viewType === "ngang" ? "org-tree-ngang" : 
                            viewType === "doc" ? "org-tree-doc" : "space-y-4"
                        }>
                            {viewType === "ngang" ? (
                                <ul>
                                    {treeDataToRender.map((dept) => (
                                        <OrgNode key={dept.id} department={dept} viewType={viewType} />
                                    ))}
                                </ul>
                            ) : viewType === "doc" ? (
                                <div className="flex flex-col">
                                    {treeDataToRender.map((dept) => (
                                        <OrgNode key={dept.id} department={dept} viewType={viewType} />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {treeDataToRender.map((dept) => (
                                        <OrgNode key={dept.id} department={dept} viewType={viewType} />
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
