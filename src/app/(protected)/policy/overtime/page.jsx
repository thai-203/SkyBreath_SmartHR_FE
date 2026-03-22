"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock } from "lucide-react";
import OvertimeViewTable from "./components/OvertimeViewTable";
import { overtimeRulesService } from "@/services";
import { departmentsService } from "@/services";
import { useToast } from "@/components/common/Toast";

const PAGE_SIZE = 5;

const emptyFilters = {
    status: "",
    departmentId: "",
    minMultiplier: "",
    maxMultiplier: "",
    minHoursPerDay: "",
    maxHoursPerDay: "",
    minHoursPerMonth: "",
    maxHoursPerMonth: "",
};

export default function EmployeeOvertimePolicyPage() {
    // ============ STATE ============
    const [rules, setRules] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(emptyFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const { error: showError } = useToast();
    const searchTimerRef = useRef(null);

    // ============ FETCH DATA ============
    const fetchRules = useCallback(async (searchValue, filtersValue, page) => {
        try {
            setLoading(true);
            const params = { page, limit: PAGE_SIZE };

            if (searchValue?.trim()) params.search = searchValue.trim();
            if (filtersValue.status) params.status = filtersValue.status;
            if (filtersValue.departmentId) params.departmentId = filtersValue.departmentId;
            if (filtersValue.minMultiplier) params.minMultiplier = filtersValue.minMultiplier;
            if (filtersValue.maxMultiplier) params.maxMultiplier = filtersValue.maxMultiplier;
            if (filtersValue.minHoursPerDay) params.minHoursPerDay = filtersValue.minHoursPerDay;
            if (filtersValue.maxHoursPerDay) params.maxHoursPerDay = filtersValue.maxHoursPerDay;
            if (filtersValue.minHoursPerMonth) params.minHoursPerMonth = filtersValue.minHoursPerMonth;
            if (filtersValue.maxHoursPerMonth) params.maxHoursPerMonth = filtersValue.maxHoursPerMonth;

            const res = await overtimeRulesService.getAll(params);
            setRules(res.data?.items || []);
            setTotalPages(res.data?.pagination?.totalPages || 1);
            setTotalItems(res.data?.pagination?.total || 0);
        } catch (err) {
            showError("Không thể tải danh sách quy định làm thêm giờ");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const res = await departmentsService.getList();
            setDepartments(res.data || []);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu phòng ban:", err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchRules(search, filters, currentPage);
        fetchDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch khi filter hoặc page thay đổi
    useEffect(() => {
        fetchRules(search, filters, currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, currentPage]);

    // ============ SEARCH với DEBOUNCE ============
    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchRules(value, filters, 1);
        }, 400);
    };

    // ============ FILTER CHANGE ============
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    // ============ RENDER ============
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                    <Clock className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quy định Overtime
                    </h1>
                    <p className="text-sm text-slate-500">
                        Xem các quy định làm thêm giờ áp dụng trong công ty
                    </p>
                </div>
            </div>

            {/* Table (Read-only) */}
            <OvertimeViewTable
                data={rules}
                loading={loading}
                search={search}
                onSearchChange={handleSearchChange}
                filters={filters}
                onFilterChange={handleFilterChange}
                departments={departments}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={totalItems}
            />
        </div>
    );
}
