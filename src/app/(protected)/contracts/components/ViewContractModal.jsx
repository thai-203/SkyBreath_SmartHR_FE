"use client";

import React, { useMemo } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import {
  Download,
  FileText,
  DollarSign,
  Clock,
  Paperclip,
  Info,
  Calendar,
  User,
} from "lucide-react";

const CONTRACT_TYPE_LABELS = {
  probation: "Hợp đồng thử việc",
  internship: "Hợp đồng học việc",
  fixed_term: "Hợp đồng lao động có thời hạn",
  permanent: "Hợp đồng lao động không thời hạn",
};

const STATUS_CONFIG = {
  ACTIVE: { label: "Đang hiệu lực", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  EXPIRING: { label: "Sắp hết hạn", color: "bg-amber-100 text-amber-700 border-amber-200" },
  EXPIRED: { label: "Hết hạn", color: "bg-rose-100 text-rose-700 border-rose-200" },
  TERMINATED: { label: "Đã chấm dứt", color: "bg-slate-100 text-slate-700 border-slate-200" },
  DEFAULT: { label: "Không xác định", color: "bg-gray-100 text-gray-700 border-gray-200" }
};

export default function ViewContractModal({ isOpen, onClose, contract, formData }) {
  if (!contract) return null;

  const data = contract.data || contract;
  console.log(data);
  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : "---");

  const statusInfo = useMemo(() => {
    const statusKey = String(data.contractStatus || "").toUpperCase();
    return STATUS_CONFIG[statusKey] || STATUS_CONFIG.DEFAULT;
  }, [data.contractStatus]);

  const totalIncome = useMemo(() => {
    const keys = ["baseSalary", "performanceSalary", "lunchAllowance", "fuelAllowance", "phoneAllowance", "otherAllowance"];
    return keys.reduce((sum, key) => sum + Number(formData?.[key] || 0), 0);
  }, [formData]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết hợp đồng lao động" size="4xl">
      <div className="space-y-6 mt-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        
        <header className="flex flex-col md:flex-row justify-between gap-6 bg-slate-50 p-6 rounded-3xl border">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-100">
              {data.employeeName?.charAt(0) || "U"}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-900 leading-none">
                {data.employeeName || "Nhân viên chưa xác định"}
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-3 py-1 text-xs font-bold bg-white border rounded-lg text-slate-600">
                  Số HĐ: {data.contractNumber}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${statusInfo.color}`}>
                  {statusInfo.label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:block text-left md:text-right border-t md:border-none pt-4 md:pt-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại hợp đồng</p>
            <p className="text-sm font-bold text-slate-700">
              {CONTRACT_TYPE_LABELS[data.contractType] || "---"}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <section className="lg:col-span-2 p-6 rounded-3xl border bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <SectionTitle icon={<User size={16} />} title="Thông tin nhân sự" />
                <div className="grid gap-4">
                  <InfoItem label="Mã nhân viên" value={data.employee?.employeeCode || data.employeeId} />
                  <InfoItem label="Phòng ban" value={data.departmentName} highlight />
                  <InfoItem label="Vị trí" value={data.positionName} highlight />
                </div>
              </div>

              <div className="space-y-4">
                <SectionTitle icon={<Calendar size={16} />} title="Thời hạn hợp đồng" />
                <div className="grid gap-4">
                  <InfoItem label="Ngày ký" value={formatDate(data.signedDate)} />
                  <InfoItem label="Bắt đầu" value={formatDate(data.startDate)} />
                  <InfoItem 
                    label="Kết thúc" 
                    value={data.contractType === "permanent" ? "Không thời hạn" : formatDate(data.endDate)} 
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <SectionTitle icon={<Clock size={16} />} title="Chế độ làm việc" />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Giờ làm / tuần" value={`${data.workingHours || 40} giờ`} />
                <InfoItem label="Ngạch lương" value={data.jobGradeName} />
              </div>
            </div>
          </section>

          <aside className="bg-indigo-600 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-indigo-100">
            <div className="space-y-6">
              <SectionTitle icon={<DollarSign size={16} />} title="Lương & Phụ cấp" color="text-white" />

              <div className="space-y-4">
                <div>
                  <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest">Lương cơ bản</p>
                  <p className="text-3xl font-black">{formatCurrency(formData.baseSalary)}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest">Lương KPI</p>
                  <p className="text-xl font-bold">{formatCurrency(formData.performanceSalary)}</p>
                </div>
              </div>

              <div className="border-t border-indigo-400/50 pt-4 space-y-3 text-sm">
                <Row label="Ăn trưa" value={formatCurrency(formData.lunchAllowance)} />
                <Row label="Xăng xe" value={formatCurrency(formData.fuelAllowance)} />
                <Row label="Điện thoại" value={formatCurrency(formData.phoneAllowance)} />
                <Row label="Khác" value={formatCurrency(formData.otherAllowance)} />
              </div>
            </div>

            <div className="mt-8 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex justify-between items-center font-bold">
                <span className="text-sm opacity-90">Tổng thu nhập</span>
                <span className="text-xl text-amber-300 font-black">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Box title="Hợp đồng đính kèm" icon={<Paperclip size={16} />}>
            <div className="space-y-2">
              {data.attachments?.length ? (
                data.attachments.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100 group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">{f.name || `Tài liệu ${i + 1}`}</span>
                    </div>
                    <Download size={14} className="text-slate-400" />
                  </a>
                ))
              ) : (
                <p className="italic text-slate-400 text-sm py-2">Không có file đính kèm</p>
              )}
            </div>
          </Box>

          <Box title="Ghi chú" icon={<Info size={16} />}>
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.note || <span className="italic text-slate-400">Không có ghi chú nội bộ</span>}
            </p>
          </Box>
        </div>

        <footer className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handlePrint} className="rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Xuất PDF
          </Button>
          <Button onClick={onClose} className="rounded-xl px-8">Đóng</Button>
        </footer>
      </div>
    </Modal>
  );
}

function SectionTitle({ icon, title, color = "text-slate-800" }) {
  return (
    <div className={`flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider ${color}`}>
      <span className="p-2 bg-slate-50 border rounded-xl shadow-sm text-slate-600">{icon}</span>
      {title}
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tight">{label}</p>
      <p className={`text-sm mt-0.5 ${highlight ? "text-indigo-600 font-bold" : "font-semibold text-slate-700"}`}>
        {value || "---"}
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="opacity-70 text-xs">{label}</span>
      <span className="font-semibold text-xs tracking-wide">{value}</span>
    </div>
  );
}

function Box({ title, icon, children }) {
  return (
    <div className="p-6 rounded-3xl border bg-white space-y-4 shadow-sm">
      <SectionTitle icon={icon} title={title} />
      {children}
    </div>
  );
}