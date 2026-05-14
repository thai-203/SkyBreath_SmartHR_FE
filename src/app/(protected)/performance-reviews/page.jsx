"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { performanceReviewsService, employeesService } from "@/services";
import { Plus, Download, ClipboardCheck } from "lucide-react";

import PerformanceReviewTable from "./components/PerformanceReviewTable";
import PerformanceReviewFormModal from "./components/PerformanceReviewFormModal";
import ViewPerformanceReviewModal from "./components/ViewPerformanceReviewModal";
import DeletePerformanceReviewModal from "./components/DeletePerformanceReviewModal";

const initialFormData = {
    employeeId: "",
    reviewMonth: "",
    reviewYear: "",
    scoreCompliance: 0,
    scoreAttitude: 0,
    scoreLearning: 0,
    scoreTeamwork: 0,
    scoreSkills: 0,
    scoreResult: 0,
    managerComment: "",
};

export default function PerformanceReviewsPage() {
    const { success, error } = useToast();

    // Data states
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    // Dropdown data
    const [employeeList, setEmployeeList] = useState([]);

    // ==================== API Calls ====================
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await performanceReviewsService.getAll({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search: search || undefined,
                month: filterMonth || undefined,
                year: filterYear || undefined,
            });

            // API trả về: { data: { data: [...], total, page, limit, totalPages } }
            setData(response.data?.data || []);
            setTotalPages(response.data?.totalPages || 1);
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const fetchManagedEmployees = async () => {
        try {
            const response = await performanceReviewsService.getManagedEmployees();
            const items = Array.isArray(response.data) ? response.data : [];
            setEmployeeList(
                items.map((e) => ({
                    value: e.id,
                    label: e.fullName,
                    data: e,
                })),
            );
        } catch (err) {
            console.error("Error fetching managed employees:", err);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [pagination.pageIndex, pagination.pageSize, search, filterMonth, filterYear]);

    useEffect(() => {
        fetchManagedEmployees();
    }, []);

    // ==================== Handlers ====================
    const handleCreate = () => {
        setSelectedReview(null);
        setFormData(initialFormData);
        setErrors({});
        setIsCreateOpen(true);
    };

    const handleView = (review) => {
        setSelectedReview(review);
        setIsViewOpen(true);
    };

    const handleEdit = (review) => {
        setSelectedReview(review);
        setFormData({
            employeeId: review.employeeId,
            reviewMonth: review.reviewMonth,
            reviewYear: review.reviewYear,
            scoreCompliance: parseFloat(review.scoreCompliance) || 0,
            scoreAttitude: parseFloat(review.scoreAttitude) || 0,
            scoreLearning: parseFloat(review.scoreLearning) || 0,
            scoreTeamwork: parseFloat(review.scoreTeamwork) || 0,
            scoreSkills: parseFloat(review.scoreSkills) || 0,
            scoreResult: parseFloat(review.scoreResult) || 0,
            managerComment: review.managerComment || "",
        });
        setErrors({});
        setIsEditOpen(true);
    };

    const handleDeleteClick = (review) => {
        setSelectedReview(review);
        setIsDeleteOpen(true);
    };

    const handleSubmitCreate = async () => {
        setFormLoading(true);
        try {
            const payload = {
                employeeId: parseInt(formData.employeeId),
                reviewMonth: parseInt(formData.reviewMonth),
                reviewYear: parseInt(formData.reviewYear),
                scoreCompliance: parseFloat(formData.scoreCompliance) || 0,
                scoreAttitude: parseFloat(formData.scoreAttitude) || 0,
                scoreLearning: parseFloat(formData.scoreLearning) || 0,
                scoreTeamwork: parseFloat(formData.scoreTeamwork) || 0,
                scoreSkills: parseFloat(formData.scoreSkills) || 0,
                scoreResult: parseFloat(formData.scoreResult) || 0,
                managerComment: formData.managerComment || "",
            };

            await performanceReviewsService.create(payload);
            success("Tạo đánh giá KPI thành công!");
            setIsCreateOpen(false);
            fetchReviews();
        } catch (err) {
            error(err.response?.data?.message || "Không thể tạo đánh giá");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitEdit = async () => {
        setFormLoading(true);
        try {
            const payload = {
                reviewMonth: parseInt(formData.reviewMonth),
                reviewYear: parseInt(formData.reviewYear),
                scoreCompliance: parseFloat(formData.scoreCompliance) || 0,
                scoreAttitude: parseFloat(formData.scoreAttitude) || 0,
                scoreLearning: parseFloat(formData.scoreLearning) || 0,
                scoreTeamwork: parseFloat(formData.scoreTeamwork) || 0,
                scoreSkills: parseFloat(formData.scoreSkills) || 0,
                scoreResult: parseFloat(formData.scoreResult) || 0,
                managerComment: formData.managerComment || "",
            };

            await performanceReviewsService.update(selectedReview.id, payload);
            success("Cập nhật đánh giá KPI thành công!");
            setIsEditOpen(false);
            fetchReviews();
        } catch (err) {
            error(err.response?.data?.message || "Không thể cập nhật đánh giá");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            await performanceReviewsService.delete(selectedReview.id);
            success("Xóa đánh giá KPI thành công!");
            setIsDeleteOpen(false);
            fetchReviews();
        } catch (err) {
            error(err.response?.data?.message || "Không thể xóa đánh giá");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    const handleMonthChange = (value) => {
        setFilterMonth(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    const handleYearChange = (value) => {
        setFilterYear(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    const handleReset = () => {
        setSearch("");
        setFilterMonth("");
        setFilterYear("");
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    // ==================== Render ====================
    return (
        <div className="space-y-6">
            <PageTitle title="Đánh giá KPI" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý đánh giá KPI
                    </h1>
                    <p className="text-slate-500">
                        Theo dõi và đánh giá hiệu suất làm việc của nhân viên
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo đánh giá
                    </Button>
                </div>
            </div>

            {/* Table */}
            <PerformanceReviewTable
                data={data}
                loading={loading}
                search={search}
                onSearchChange={handleSearchChange}
                filterMonth={filterMonth}
                onMonthChange={handleMonthChange}
                filterYear={filterYear}
                onYearChange={handleYearChange}
                onReset={handleReset}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalPages={totalPages}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
            />

            {/* Create Modal */}
            <PerformanceReviewFormModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleSubmitCreate}
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
                employeeList={employeeList}
                loading={formLoading}
                mode="create"
            />

            {/* Edit Modal */}
            <PerformanceReviewFormModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleSubmitEdit}
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
                employeeList={employeeList}
                loading={formLoading}
                mode="edit"
                selectedReview={selectedReview}
            />

            {/* View Modal */}
            <ViewPerformanceReviewModal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                review={selectedReview}
            />

            {/* Delete Modal */}
            <DeletePerformanceReviewModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                review={selectedReview}
                loading={formLoading}
            />
        </div>
    );
}
