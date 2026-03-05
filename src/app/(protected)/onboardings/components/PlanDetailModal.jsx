"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Upload } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { onboardingsService } from "@/services";

export default function PlanDetailModal({ plan, onClose }) {
  const { success, error: toastError } = useToast();
  const [expandedTask, setExpandedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!plan?.id) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await onboardingsService.getPlanDetails(plan.id);
        setTasks(response.data?.tasks || []);
        setProgress(response.data?.progress || 0);
      } catch (error) {
        toastError("Lỗi khi tải chi tiết kế hoạch");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [plan?.id]);

  const completedPercent =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.status === "completed").length /
            tasks.length) *
            100
        )
      : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <img
              src={plan?.employee?.avatar || "/avatar-placeholder.png"}
              alt={plan?.employee?.name || "Employee"}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {plan?.employee?.name || "—"}
              </h2>
              <p className="text-sm text-muted">
                {plan?.employee?.position || ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted">
              Đang tải dữ liệu...
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex justify-between mb-3">
                  <h3 className="font-semibold">
                    Danh sách chi tiết công việc
                  </h3>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {progress}%
                    </p>
                    <p className="text-xs text-muted">Complete</p>
                  </div>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-sm text-muted mt-2">
                  {completedPercent}% công việc đã hoàn thành
                </p>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted">
                    Không có công việc nào
                  </div>
                ) : (
                  tasks.map((task, index) => {
                    const isExpanded = expandedTask === index;

                    const statusColor =
                      task.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : task.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700";

                    return (
                      <div
                        key={task.id || index}
                        className="border border-border rounded-lg overflow-hidden bg-card"
                      >
                        {/* Task Header */}
                        <button
                          onClick={() =>
                            setExpandedTask(isExpanded ? null : index)
                          }
                          className="w-full p-4 flex justify-between hover:bg-background"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-xl">
                              {task.category ===
                                "IT Equipment Provisioning" && "💻"}
                              {task.category ===
                                "Sign Employee Handbook" && "📄"}
                              {task.category ===
                                "Security Awareness Briefing" && "🔒"}
                              {task.category ===
                                "Team Introduction & Lunch" && "👥"}
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-muted">
                                {task.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${statusColor}`}
                            >
                              {task.status === "completed"
                                ? "ĐÃ HOÀN THÀNH"
                                : task.status === "in_progress"
                                ? "ĐANG THỰC HIỆN"
                                : "CHƯA BẮT ĐẦU"}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {/* Task Detail */}
                        {isExpanded && (
                          <div className="border-t p-4 bg-background space-y-4">
                            {/* Status */}
                            <div>
                              <p className="text-sm font-semibold mb-2">
                                TRẠNG THÁI HIỆN TẠI
                              </p>
                              <div className="flex gap-2">
                                <button className="px-3 py-1 border rounded text-xs">
                                  Pending
                                </button>
                                <button className="px-3 py-1 border rounded text-xs">
                                  In Progress
                                </button>
                                <button className="px-3 py-1 bg-primary text-white rounded text-xs">
                                  Completed
                                </button>
                              </div>
                            </div>

                            {/* Asset Code */}
                            {task.assetCode && (
                              <div>
                                <p className="text-sm font-semibold mb-2">
                                  MÃ TÀI SẢN
                                </p>
                                <input
                                  defaultValue={task.assetCode}
                                  className="w-full border rounded px-3 py-2 text-sm"
                                />
                              </div>
                            )}

                            {/* Upload */}
                            {!task.completedDate && (
                              <div>
                                <p className="text-sm font-semibold mb-2">
                                  BẰNG CHỨNG
                                </p>
                                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
                                  <Upload className="mx-auto mb-2 text-muted" />
                                  <p className="text-sm text-muted">
                                    Click hoặc kéo thả file
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Comments */}
                            <div>
                              <p className="text-sm font-semibold mb-2">
                                GHI CHÚ
                              </p>
                              <textarea
                                defaultValue={task.comments || ""}
                                rows={3}
                                className="w-full border rounded px-3 py-2 text-sm"
                              />
                            </div>

                            <button className="w-full bg-primary text-white py-2 rounded">
                              Cập nhật tiến độ
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-background flex justify-between">
          <button className="text-muted">Hủy thay đổi</button>
          <button className="bg-primary text-white px-6 py-2 rounded">
            Cập nhật tiến độ
          </button>
        </div>
      </div>
    </div>
  );
}
