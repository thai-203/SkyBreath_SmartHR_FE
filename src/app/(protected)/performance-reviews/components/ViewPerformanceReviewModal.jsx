"use client";

import {
    X,
    User,
    Calendar,
    MessageSquare,
    CheckCircle,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";

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
    { key: "scoreCompliance", label: "1.1 Chấp hành nội quy", maxScore: 1.0 },
    { key: "scoreAttitude", label: "1.2 Thái độ làm việc", maxScore: 1.0 },
    { key: "scoreLearning", label: "1.3 Ý thức học hỏi", maxScore: 1.0 },
    { key: "scoreTeamwork", label: "1.4 Tinh thần đồng đội", maxScore: 1.0 },
    { key: "scoreSkills", label: "1.5 Kiến thức kỹ năng", maxScore: 1.0 },
    { key: "scoreResult", label: "2. Kết quả thực hiện", maxScore: 5.0 },
];

const REVIEW_STATUS_CONFIG = {
    DRAFT: {
        label: "Nháp",
        class: "bg-amber-100 text-amber-700 border-amber-200",
    },
    SUBMITTED: {
        label: "Đã đánh giá",
        class: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
};

export default function ViewPerformanceReviewModal({
    isOpen,
    onClose,
    review,
}) {
    if (!review) return null;

    const behaviorScore =
        (parseFloat(review.scoreCompliance) || 0) +
        (parseFloat(review.scoreAttitude) || 0) +
        (parseFloat(review.scoreLearning) || 0) +
        (parseFloat(review.scoreTeamwork) || 0) +
        (parseFloat(review.scoreSkills) || 0);

    const resultScore = parseFloat(review.scoreResult) || 0;
    const totalScore = parseFloat(review.totalScore) || 0;
    const totalPercentage = Math.round((totalScore / 10.0) * 100);

    const monthLabel = MONTHS.find((m) => m.value === review.reviewMonth)?.label || review.reviewMonth;
    const status = REVIEW_STATUS_CONFIG[review.status] || {
        label: review.status,
        class: "bg-gray-100 text-gray-600 border-gray-200",
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 80) return "text-emerald-600";
        if (percentage >= 60) return "text-amber-600";
        return "text-rose-600";
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return "bg-emerald-500";
        if (percentage >= 60) return "bg-amber-500";
        return "bg-rose-500";
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết đánh giá KPI" size="2xl">
            <div className="space-y-6 mt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 uppercase text-xl font-bold">
                            {review.employee?.fullName?.charAt(0) || "?"}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                {review.employee?.fullName || "Chưa xác định"}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {review.employee?.department?.departmentName || "---"} |{" "}
                                {review.employee?.position?.positionName || "---"}
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${status.class}`}
                    >
                        {status.label}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>
                            Đánh giá tháng {monthLabel}/{review.reviewYear}
                        </span>
                    </div>
                    <div className="h-4 border-l border-slate-300" />
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>
                            Người đánh giá: {review.manager?.fullName || "---"}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Chi tiết điểm số
                    </h4>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                            Phần 1: Đánh giá hành vi (Tối đa 5.0)
                        </div>
                        {SCORE_CRITERIA.slice(0, 5).map((criteria) => {
                            const score = parseFloat(review[criteria.key]) || 0;
                            const percentage = Math.round((score / criteria.maxScore) * 100);
                            return (
                                <div key={criteria.key} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <span className="text-sm text-slate-700">{criteria.label}</span>
                                    </div>
                                    <div className="w-32">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${getProgressColor(percentage)}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium w-12 text-right ${getScoreColor(percentage)}`}>
                                                {score.toFixed(1)}/{criteria.maxScore}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                            <span className="text-sm font-semibold text-slate-600">Tổng điểm hành vi</span>
                            <span className={`text-sm font-bold ${getScoreColor(Math.round((behaviorScore / 5.0) * 100))}`}>
                                {behaviorScore.toFixed(1)}/5.0
                            </span>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                        <div className="text-xs font-semibold text-indigo-600 uppercase mb-2">
                            Phần 2: Kết quả thực hiện (Tối đa 5.0)
                        </div>
                        {SCORE_CRITERIA.slice(5).map((criteria) => {
                            const score = parseFloat(review[criteria.key]) || 0;
                            const percentage = Math.round((score / criteria.maxScore) * 100);
                            return (
                                <div key={criteria.key} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <span className="text-sm text-slate-700">{criteria.label}</span>
                                    </div>
                                    <div className="w-32">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${getProgressColor(percentage)}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium w-12 text-right ${getScoreColor(percentage)}`}>
                                                {score.toFixed(1)}/{criteria.maxScore}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
                            <span className="text-sm font-semibold text-indigo-700">Điểm kết quả</span>
                            <span className={`text-sm font-bold ${getScoreColor(Math.round((resultScore / 5.0) * 100))}`}>
                                {resultScore.toFixed(1)}/5.0
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-medium text-slate-300">TỔNG ĐIỂM</span>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white">
                                {totalScore.toFixed(1)}/10.0
                            </div>
                            <div className={`text-sm font-medium mt-1 ${
                                totalPercentage >= 80 ? 'text-emerald-300' :
                                totalPercentage >= 60 ? 'text-amber-300' : 'text-rose-300'
                            }`}>
                                {totalPercentage}% Hoàn thành
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${getProgressColor(totalPercentage)}`}
                            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                        />
                    </div>
                </div>

                {review.managerComment && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Nhận xét của quản lý
                        </h4>
                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap">
                            {review.managerComment}
                        </div>
                    </div>
                )}

                <div className="text-xs text-slate-400 text-center pt-2">
                    Ngày tạo: {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-600">
                    Đóng
                </Button>
            </div>
        </Modal>
    );
}
