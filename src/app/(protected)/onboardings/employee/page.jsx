"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, LayoutDashboard } from "lucide-react";
import EmployeeOnboardingView from "./components/EmployeeOnboardingView";
import { onboardingsService } from "@/services/onboardings.service";
import { authService } from "@/services/auth.service";

export default function EmployeeOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [onboardingPlan, setOnboardingPlan] = useState(null);
  const [error, setError] = useState(null);

// Hàm này dùng để lấy dữ liệu mới nhất từ Server
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const userRes = await authService.getCurrentEmployeeByUserId();
      const user = userRes.data;
      setEmployeeInfo(user);

      if (user?.id) {
        const planRes = await onboardingsService.getProgressByEmployee(user.id);
        setOnboardingPlan(planRes.data);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
      setError("Không thể tải thông tin lộ trình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hàm xử lý làm mới dữ liệu (Refresh)
  const handleRefresh = async () => {
    // Gọi lại fetchData nhưng không bật màn hình loading chính để tránh giật trang
    await fetchData(true);
  };

  // 1. Trạng thái đang tải dữ liệu
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#f8fafc]">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
          </div>
        </div>
        <p className="mt-4 text-slate-500 font-bold tracking-tight">
          Đang tải lộ trình của bạn...
        </p>
      </div>
    );
  }

  // 2. Trạng thái lỗi hệ thống
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 text-center max-w-md">
          <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Đã xảy ra lỗi
          </h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // 3. Trạng thái nhân viên chưa được gán lộ trình
  if (!onboardingPlan) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 text-center max-w-lg">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">
            Sẵn sàng để bắt đầu?
          </h2>
          <p className="text-slate-500 leading-relaxed mb-8">
            Chào <strong>{employeeInfo?.fullName || "bạn"}</strong>! Hiện tại hệ
            thống chưa ghi nhận lộ trình hội nhập dành riêng cho bạn. Đừng lo
            lắng, hãy liên hệ với quản lý trực tiếp hoặc phòng Nhân sự để được
            kích hoạt checklist nhé.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-400 font-medium">
            Mã nhân viên: {employeeInfo?.employeeCode || "N/A"}
          </div>
        </div>
      </div>
    );
  }

  // 4. Hiển thị giao diện checklist chính
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <EmployeeOnboardingView
        employeeData={employeeInfo}
        onboardingData={onboardingPlan}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
