"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    X,
    User,
    AlertCircle,
    Star,
    Trophy,
    MessageSquare,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Label } from "@/components/common/Label";

const MONTHS = [
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
];

const SCORE_CRITERIA = [
    {
        key: "scoreCompliance",
        label: "1.1 Chấp hành nội quy",
        maxScore: 1.0,
        description: "Tuân thủ các quy định, nội quy của công ty",
    },
    {
        key: "scoreAttitude",
        label: "1.2 Thái độ làm việc",
        maxScore: 1.0,
        description: "Tinh thần, thái độ phục vụ, tác phong làm việc",
    },
    {
        key: "scoreLearning",
        label: "1.3 Ý thức học hỏi",
        maxScore: 1.0,
        description: "Khả năng tiếp thu kiến thức mới, cầu thị học hỏi",
    },
    {
        key: "scoreTeamwork",
        label: "1.4 Tinh thần đồng đội",
        maxScore: 1.0,
        description: "Phối hợp với đồng nghiệp, tinh thần teamwork",
    },
    {
        key: "scoreSkills",
        label: "1.5 Kiến thức kỹ năng",
        maxScore: 1.0,
        description: "Trình độ chuyên môn, kỹ năng nghề nghiệp",
    },
    {
        key: "scoreResult",
        label: "2. Kết quả thực hiện",
        maxScore: 5.0,
        description: "Mức độ hoàn thành công việc được giao",
    },
];

export default function PerformanceReviewFormModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onFormChange,
    errors,
    employeeList = [],
    loading,
    mode = "create",
    selectedReview = null,
}) {
    const [localErrors, setLocalErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && selectedReview) {
                setSearchTerm(selectedReview.employee?.fullName || "");
            } else if (formData.employeeId) {
                const emp = employeeList.find(
                    (e) => String(e.value) === String(formData.employeeId)
                );
                setSearchTerm(emp ? emp.label : "");
            } else {
                setSearchTerm("");
            }
            setLocalErrors({});
        }
    }, [isOpen, mode, selectedReview, formData.employeeId, employeeList]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDropdownOpen]);

    const filteredEmployees = useMemo(() => {
        return employeeList.filter((emp) =>
            (emp.label || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employeeList, searchTerm]);

    const calculatedScores = useMemo(() => {
        const behaviorScore =
            (parseFloat(formData.scoreCompliance) || 0) +
            (parseFloat(formData.scoreAttitude) || 0) +
            (parseFloat(formData.scoreLearning) || 0) +
            (parseFloat(formData.scoreTeamwork) || 0) +
            (parseFloat(formData.scoreSkills) || 0);

        const resultScore = parseFloat(formData.scoreResult) || 0;
        const totalScore = behaviorScore + resultScore;

        return {
            behaviorScore: Math.round(behaviorScore * 100) / 100,
            resultScore: Math.round(resultScore * 100) / 100,
            totalScore: Math.round(totalScore * 100) / 100,
            behaviorPercentage: Math.round((behaviorScore / 5.0) * 100),
            resultPercentage: Math.round((resultScore / 5.0) * 100),
            totalPercentage: Math.round((totalScore / 10.0) * 100),
        };
    }, [formData]);

    const handleInputChange = (field, value) => {
        const numValue = parseFloat(value) || 0;
        onFormChange({ ...formData, [field]: numValue });
        if (localErrors[field]) {
            setLocalErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const handleSelectEmployee = (emp) => {
        onFormChange({ ...formData, employeeId: emp.value });
        setSearchTerm(emp.label);
        setIsDropdownOpen(false);
        if (localErrors.employeeId) {
            setLocalErrors((prev) => ({ ...prev, employeeId: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.employeeId && mode === "create") {
            newErrors.employeeId = "Vui lòng chọn nhân viên";
        }

        if (!formData.reviewMonth) {
            newErrors.reviewMonth = "Vui lòng chọn tháng đánh giá";
        }

        if (!formData.reviewYear) {
            newErrors.reviewYear = "Vui lòng chọn năm đánh giá";
        }

        for (const criteria of SCORE_CRITERIA) {
            const value = parseFloat(formData[criteria.key]) || 0;
            if (value < 0) {
                newErrors[criteria.key] = "Điểm không được nhỏ hơn 0";
            }
            if (value > criteria.maxScore) {
                newErrors[criteria.key] = `Điểm tối đa là ${criteria.maxScore}`;
            }
        }

        const behaviorScore =
            (parseFloat(formData.scoreCompliance) || 0) +
            (parseFloat(formData.scoreAttitude) || 0) +
            (parseFloat(formData.scoreLearning) || 0) +
            (parseFloat(formData.scoreTeamwork) || 0) +
            (parseFloat(formData.scoreSkills) || 0);

        if (behaviorScore > 5.0) {
            newErrors.behaviorTotal = "Tổng điểm 5 tiêu chí hành vi (1.1-1.5) không được vượt quá 5.0";
        }

        setLocalErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit();
        }
    };

    const getScoreColor = (value, maxScore) => {
        const percentage = (parseFloat(value) || 0) / maxScore;
        if (percentage >= 0.8) return "text-emerald-600";
        if (percentage >= 0.6) return "text-amber-600";
        return "text-rose-600";
    };

    const ErrorMsg = ({ name }) =>
        localErrors[name] ? (
            <span className="text-[10px] text-red-500 font-medium italic flex items-center gap-1 mt-1">
                <AlertCircle size={10} /> {localErrors[name]}
            </span>
        ) : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Tạo đánh giá KPI" : "Cập nhật đánh giá KPI"}
            size="2xl"
        >
            <div className="flex flex-col gap-6 mt-4">
                {(mode === "create" || localErrors.employeeId) && (
                    <div className="space-y-1">
                        <Label>
                            Nhân viên được đánh giá <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative" ref={dropdownRef}>
                            <div className="absolute left-3 top-2.5">
                                <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm tên nhân viên..."
                                value={searchTerm}
                                disabled={mode === "edit"}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className={`w-full rounded-lg border pl-10 pr-10 py-2 text-sm outline-none transition-all ${
                                    localErrors.employeeId
                                        ? "border-red-500 bg-red-50"
                                        : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                                }`}
                            />
                            {searchTerm && mode === "create" && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        onFormChange({ ...formData, employeeId: "" });
                                    }}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            {isDropdownOpen && mode === "create" && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto border-slate-100">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((emp) => (
                                            <div
                                                key={emp.value}
                                                onMouseDown={() => handleSelectEmployee(emp)}
                                                className="px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-none font-medium text-slate-700"
                                            >
                                                {emp.label}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-400 italic text-center">
                                            Không có dữ liệu
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <ErrorMsg name="employeeId" />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>
                            Tháng đánh giá <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.reviewMonth || ""}
                            options={MONTHS}
                            onChange={(e) => handleInputChange("reviewMonth", e.target.value)}
                            className={localErrors.reviewMonth ? "border-red-500" : ""}
                        />
                        <ErrorMsg name="reviewMonth" />
                    </div>

                    <div className="space-y-1">
                        <Label>
                            Năm đánh giá <span className="text-red-500">*</span>
                        </Label>
                        <select
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${
                                localErrors.reviewYear
                                    ? "border-red-500 bg-red-50"
                                    : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                            }`}
                            value={formData.reviewYear || ""}
                            onChange={(e) => handleInputChange("reviewYear", e.target.value)}
                        >
                            <option value="">Chọn năm</option>
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <ErrorMsg name="reviewYear" />
                    </div>
                </div>

                {localErrors.behaviorTotal && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">{localErrors.behaviorTotal}</span>
                    </div>
                )}

                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Star className="h-4 w-4 text-indigo-500" />
                        Phần 1: Đánh giá hành vi (Tổng tối đa 5.0 điểm)
                    </h3>

                    <div className="space-y-3">
                        {SCORE_CRITERIA.slice(0, 5).map((criteria) => (
                            <div key={criteria.key} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-700">
                                            {criteria.label}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {criteria.description}
                                    </span>
                                </div>
                                <div className="w-28">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max={criteria.maxScore}
                                            step="0.1"
                                            value={formData[criteria.key] || ""}
                                            onChange={(e) =>
                                                handleInputChange(criteria.key, e.target.value)
                                            }
                                            className={`w-full rounded-lg border px-3 py-2 text-sm text-center font-medium outline-none transition-all ${
                                                localErrors[criteria.key]
                                                    ? "border-red-500 bg-red-50"
                                                    : `${getScoreColor(formData[criteria.key], criteria.maxScore)} border-slate-200 focus:ring-2 focus:ring-indigo-500/20`
                                            }`}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                            /{criteria.maxScore}
                                        </span>
                                    </div>
                                    <ErrorMsg name={criteria.key} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600">
                                Tổng điểm hành vi:
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-indigo-600">
                                {calculatedScores.behaviorScore.toFixed(1)}/5.0
                            </div>
                            <div className={`text-sm font-medium ${
                                calculatedScores.behaviorPercentage >= 80 ? 'text-emerald-600' :
                                calculatedScores.behaviorPercentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                            }`}>
                                ({calculatedScores.behaviorPercentage}%)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 rounded-xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-indigo-500" />
                        Phần 2: Kết quả thực hiện (Tối đa 5.0 điểm)
                    </h3>

                    {SCORE_CRITERIA.slice(5).map((criteria) => (
                        <div key={criteria.key} className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700">
                                        {criteria.label}
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    {criteria.description}
                                </span>
                            </div>
                            <div className="w-28">
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max={criteria.maxScore}
                                        step="0.1"
                                        value={formData[criteria.key] || ""}
                                        onChange={(e) =>
                                            handleInputChange(criteria.key, e.target.value)
                                        }
                                        className={`w-full rounded-lg border px-3 py-2 text-sm text-center font-medium outline-none transition-all ${
                                            localErrors[criteria.key]
                                                ? "border-red-500 bg-red-50"
                                                : `${getScoreColor(formData[criteria.key], criteria.maxScore)} border-slate-200 focus:ring-2 focus:ring-indigo-500/20`
                                        }`}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                        /{criteria.maxScore}
                                    </span>
                                </div>
                                <ErrorMsg name={criteria.key} />
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-3 border-t border-indigo-200">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-indigo-700">
                                Điểm kết quả:
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-indigo-600">
                                {calculatedScores.resultScore.toFixed(1)}/5.0
                            </div>
                            <div className={`text-sm font-medium ${
                                calculatedScores.resultPercentage >= 80 ? 'text-emerald-600' :
                                calculatedScores.resultPercentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                            }`}>
                                ({calculatedScores.resultPercentage}%)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                                TỔNG ĐIỂM:
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-white">
                                {calculatedScores.totalScore.toFixed(1)}/10.0
                            </div>
                            <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                                calculatedScores.totalPercentage >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                                calculatedScores.totalPercentage >= 60 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                                {calculatedScores.totalPercentage}%
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${
                                calculatedScores.totalPercentage >= 80 ? 'bg-emerald-400' :
                                calculatedScores.totalPercentage >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${Math.min(calculatedScores.totalPercentage, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-400" />
                        Nhận xét của quản lý
                    </Label>
                    <textarea
                        className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50/30 min-h-[80px]"
                        value={formData.managerComment || ""}
                        onChange={(e) => handleInputChange("managerComment", e.target.value)}
                        placeholder="Nhập nhận xét, góp ý cho nhân viên..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="border-slate-200 text-slate-600"
                >
                    Hủy bỏ
                </Button>
                <Button
                    onClick={handleSubmit}
                    loading={loading}
                    className="px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                >
                    {mode === "create" ? "Tạo đánh giá" : "Lưu thay đổi"}
                </Button>
            </div>
        </Modal>
    );
}
