"use client";

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

/* ================= CONSTANTS ================= */

const contractTypeLabels = {
  probation: "Hợp đồng thử việc",
  internship: "Hợp đồng học việc",
  fixed_term: "Hợp đồng lao động có thời hạn",
  permanent: "Hợp đồng lao động không thời hạn",
};

const contractStatusLabels = {
  active: "Đang hiệu lực",
  expiring: "Sắp hết hạn",
  expired: "Hết hạn",
  terminated: "Đã chấm dứt",
};

const contractStatusColors = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  expiring: "bg-amber-100 text-amber-700 border-amber-200",
  expired: "bg-rose-100 text-rose-700 border-rose-200",
  terminated: "bg-slate-100 text-slate-700 border-slate-200",
};

/* ================= MAIN COMPONENT ================= */

export default function ViewContractModal({ isOpen, onClose, contract }) {
  if (!contract) return null;

  /* --- Chuẩn hoá dữ liệu giống Edit --- */
  const data = contract.data || contract;
  const employee = data.employee || {};
  const department = data.department || {};
  const position = data.position || {};
  const jobGrade = data.jobGrade || {};

  /* --- Helpers --- */
  const formatCurrency = (amount) => {
    const value = Number(amount);
    if (!value || isNaN(value)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "---";

  const totalIncome =
    Number(data.baseSalary || 0) +
    Number(data.performanceSalary || 0) +
    Number(data.lunchAllowance || 0) +
    Number(data.fuelAllowance || 0) +
    Number(data.phoneAllowance || 0) +
    Number(data.otherAllowance || 0);

  const handleDownload = () => {
    if (typeof window !== "undefined") window.print();
  };

  /* ================= RENDER ================= */

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết hợp đồng lao động"
      size="4xl"
    >
      <div className="space-y-6 mt-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">

        {/* ===== HEADER ===== */}
        <div className="flex flex-col md:flex-row justify-between gap-6 bg-slate-50 p-6 rounded-3xl border">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold">
              {employee.fullName?.charAt(0) || "U"}
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {employee.fullName || "Nhân viên chưa xác định"}
              </h3>

              <div className="flex flex-wrap gap-3 mt-2">
                <span className="px-3 py-1 text-sm font-bold bg-white border rounded-lg">
                  Số HĐ: {data.contractNumber}
                </span>

                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    contractStatusColors[data.status]
                  }`}
                >
                  {contractStatusLabels[data.status]?.toUpperCase() || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Loại hợp đồng
            </p>
            <p className="text-sm font-bold text-slate-700">
              {contractTypeLabels[data.contractType] || "---"}
            </p>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ---- INFO ---- */}
          <section className="md:col-span-2 p-6 rounded-3xl border bg-white space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <SectionTitle icon={<User size={16} />} title="Thông tin nhân sự" />
                <InfoItem label="Mã nhân viên" value={employee.code || data.employeeId} />
                <InfoItem
                  label="Phòng ban"
                  value={department.departmentName}
                  highlight
                />
                <InfoItem
                  label="Vị trí"
                  value={position.positionName}
                  highlight
                />
              </div>

              <div className="space-y-4">
                <SectionTitle
                  icon={<Calendar size={16} />}
                  title="Thời hạn hợp đồng"
                />
                <InfoItem label="Ngày ký" value={formatDate(data.signedDate)} />
                <InfoItem label="Bắt đầu" value={formatDate(data.startDate)} />
                <InfoItem
                  label="Kết thúc"
                  value={
                    data.contractType === "permanent"
                      ? "Không thời hạn"
                      : formatDate(data.endDate)
                  }
                />
              </div>
            </div>

            <hr />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <SectionTitle icon={<Clock size={16} />} title="Công việc" />
                <InfoItem
                  label="Giờ làm / tuần"
                  value={`${data.workingHours || 40} giờ`}
                />
                <InfoItem label="Ngạch lương" value={jobGrade.gradeName} />
              </div>
            </div>
          </section>

          {/* ---- SALARY ---- */}
          <section className="bg-indigo-600 text-white rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-5">
              <SectionTitle
                icon={<DollarSign size={16} />}
                title="Lương & Phụ cấp"
                color="text-white"
              />

              <div>
                <p className="text-indigo-200 text-xs uppercase font-bold">
                  Lương cơ bản
                </p>
                <p className="text-3xl font-black">
                  {formatCurrency(data.baseSalary)}
                </p>
              </div>

              <div>
                <p className="text-indigo-200 text-xs uppercase font-bold">
                  Lương KPI
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(data.performanceSalary)}
                </p>
              </div>

              <div className="border-t border-indigo-500 pt-4 space-y-2 text-sm">
                <Row label="Ăn trưa" value={formatCurrency(data.lunchAllowance)} />
                <Row label="Xăng xe" value={formatCurrency(data.fuelAllowance)} />
                <Row label="Điện thoại" value={formatCurrency(data.phoneAllowance)} />
                <Row label="Khác" value={formatCurrency(data.otherAllowance)} />
              </div>
            </div>

            <div className="mt-6 bg-white/10 p-4 rounded-xl">
              <div className="flex justify-between font-bold">
                <span>Tổng thu nhập</span>
                <span className="text-amber-300">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ===== ATTACHMENTS & NOTE ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Box title="Hợp đồng đính kèm" icon={<Paperclip size={16} />}>
            {data.attachments?.length ? (
              data.attachments.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <span className="text-sm font-medium">
                      {f.name || `Tài liệu ${i + 1}`}
                    </span>
                  </div>
                  <Download size={14} />
                </a>
              ))
            ) : (
              <p className="italic text-slate-400">Không có file đính kèm</p>
            )}
          </Box>

          <Box title="Ghi chú" icon={<Info size={16} />}>
            <p className="italic text-slate-600">
              {data.note || "Không có ghi chú"}
            </p>
          </Box>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Xuất PDF
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ================= SUB COMPONENTS ================= */

function SectionTitle({ icon, title, color = "text-slate-800" }) {
  return (
    <div className={`flex items-center gap-2 font-bold text-xs uppercase ${color}`}>
      <span className="p-2 bg-slate-50 border rounded-xl">{icon}</span>
      {title}
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className={`text-sm ${highlight ? "text-indigo-600 font-bold" : "font-semibold"}`}>
        {value || "---"}
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Box({ title, icon, children }) {
  return (
    <div className="p-6 rounded-3xl border bg-white space-y-4">
      <SectionTitle icon={icon} title={title} />
      {children}
    </div>
  );
}
