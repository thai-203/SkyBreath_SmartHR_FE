"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ShieldAlert } from "lucide-react";
import PenaltyViewTable from "./components/PenaltyViewTable";
import { penaltiesService } from "@/services";
import { useToast } from "@/components/common/Toast";

const PAGE_SIZE = 10;

const emptyFilters = {
    violationType: "",
    status: "",
};

export default function EmployeePenaltyPolicyPage() {
    const [penalties, setPenalties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(emptyFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const { error: showError } = useToast();
    const searchTimerRef = useRef(null);

    const fetchPenalties = useCallback(async (searchValue, filtersValue, page) => {
        try {
            setLoading(true);
            const params = { page, limit: PAGE_SIZE };
            if (searchValue?.trim()) params.search = searchValue.trim();
            if (filtersValue.violationType) params.violationType = filtersValue.violationType;
            if (filtersValue.status) params.status = filtersValue.status;

            const res = await penaltiesService.getAll(params);
            setPenalties(res.data?.items || []);
            setTotalPages(res.data?.pagination?.totalPages || 1);
            setTotalItems(res.data?.pagination?.total || 0);
        } catch (err) {
            showError("Không thể tải danh sách quy định vi phạm");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPenalties(search, filters, currentPage); }, []);
    useEffect(() => { fetchPenalties(search, filters, currentPage); }, [filters, currentPage]);

    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchPenalties(value, filters, 1);
        }, 400);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white">
                    <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quy định Vi phạm (Penalty)
                    </h1>
                    <p className="text-sm text-slate-500">
                        Xem các quy định xử phạt đi muộn, về sớm
                    </p>
                </div>
            </div>

            <PenaltyViewTable
                data={penalties}
                loading={loading}
                search={search}
                onSearchChange={handleSearchChange}
                filters={filters}
                onFilterChange={handleFilterChange}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={totalItems}
            />
        </div>
    );
}
