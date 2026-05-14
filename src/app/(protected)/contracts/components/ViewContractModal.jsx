"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Download,
  FileText,
  DollarSign,
  Clock,
  Paperclip,
  Info,
  Calendar,
  User,
  Eye,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const CONTRACT_TYPE_LABELS = {
  probation: "Hợp đồng thử việc",
  internship: "Hợp đồng học việc",
  fixed_term: "Hợp đồng lao động có thời hạn",
  permanent: "Hợp đồng lao động không thời hạn",
};

const STATUS_CONFIG = {
  NOT_EFFECTIVE: {
    label: "Chưa hiệu lực",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  ACTIVE: {
    label: "Đang hiệu lực",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  EXPIRING: {
    label: "Sắp hết hạn",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  EXPIRED: {
    label: "Hết hạn",
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
  TERMINATED: {
    label: "Đã chấm dứt",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  DEFAULT: {
    label: "Không xác định",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export default function ViewContractModal({
  isOpen,
  onClose,
  contract,
  formData = {}, // Default để tránh lỗi undefined
}) {
  const data = contract?.data || contract || {};
  const [exportingPdf, setExportingPdf] = useState(false);

  // --- Logic Helpers ---
  const getFullUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "---";

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const isImageFile = (fileUrl = "", fileName = "") => {
    const target = `${fileUrl} ${fileName}`.toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(target);
  };

  const getSalaryValue = (key) => {
    const formValue = formData?.[key];
    if (formValue !== undefined && formValue !== null && formValue !== "") {
      return Number(formValue) || 0;
    }
    return Number(data?.[key]) || 0;
  };

  const normalizedAttachments = useMemo(() => {
    const raw = Array.isArray(data.attachments) ? data.attachments : [];
    return raw
      .map((file, index) => {
        const fileUrl = typeof file === "string" ? file : file?.url;
        if (!fileUrl) return null;
        const fileName =
          typeof file === "string"
            ? file.split("/").pop()
            : file?.name || `Tài liệu ${index + 1}`;
        return {
          fileUrl,
          fileName,
          fullUrl: getFullUrl(fileUrl),
          isImage: isImageFile(fileUrl, fileName),
        };
      })
      .filter(Boolean);
  }, [data.attachments]);

  const statusInfo = useMemo(() => {
    const statusKey = String(data.contractStatus || "").toUpperCase();
    return STATUS_CONFIG[statusKey] || STATUS_CONFIG.DEFAULT;
  }, [data.contractStatus]);

  const totalIncome = (() => {
    const keys = [
      "baseSalary",
      "performanceSalary",
      "lunchAllowance",
      "fuelAllowance",
      "phoneAllowance",
      "otherAllowance",
    ];
    return keys.reduce((sum, key) => sum + getSalaryValue(key), 0);
  })();

  if (!contract) return null;

  // --- File Actions ---
  const handleViewFile = (fileUrl) => {
    if (!fileUrl) return;
    window.open(getFullUrl(fileUrl), "_blank", "noopener,noreferrer");
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    try {
      const url = getFullUrl(fileUrl);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "contract-document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Lỗi khi tải file:", error);
      // Fallback: Nếu fetch lỗi (CORS), thử mở link trực tiếp
      window.open(getFullUrl(fileUrl), "_blank");
    }
  };

  const waitForImageLoad = (img) =>
    new Promise((resolve) => {
      if (!img) {
        resolve();
        return;
      }
      if (img.complete) {
        resolve();
        return;
      }
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

  const handlePrint = async () => {
    if (typeof window === "undefined" || exportingPdf) return;

    setExportingPdf(true);
    try {
      const imageAttachments = normalizedAttachments.filter(
        (item) => item.isImage,
      );
      const nonImageAttachments = normalizedAttachments.filter(
        (item) => !item.isImage,
      );
      const fileName = `hop-dong-${data.contractNumber || data.employeeId || "chi-tiet"}.pdf`;

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-99999px";
      container.style.top = "0";
      container.style.width = "794px";
      container.style.background = "#ffffff";
      container.style.color = "#1e293b";
      container.style.padding = "24px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.boxSizing = "border-box";

      const attachmentImageMarkup = imageAttachments.length
        ? imageAttachments
            .map(
              (item) => `
                <div style="margin-bottom:16px;page-break-inside:avoid;">
                  <p style="margin:0 0 6px;font-size:12px;color:#334155;">${escapeHtml(item.fileName)}</p>
                  <img src="${escapeHtml(item.fullUrl)}" alt="${escapeHtml(item.fileName)}" style="max-width:100%;max-height:600px;border:1px solid #e2e8f0;border-radius:8px;" />
                </div>
              `,
            )
            .join("")
        : '<p style="color:#64748b;font-style:italic;">Không có hình ảnh đính kèm.</p>';

      const nonImageMarkup = nonImageAttachments.length
        ? `<ul style="margin:6px 0 0;padding-left:18px;">${nonImageAttachments
            .map((item) => `<li>${escapeHtml(item.fileName)}</li>`)
            .join("")}</ul>`
        : '<p style="color:#64748b;font-style:italic;">Không có tệp đính kèm khác.</p>';

      container.innerHTML = `
        <h1 style="margin:0 0 12px;font-size:22px;">Chi tiết hợp đồng lao động</h1>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;border:1px solid #cbd5e1;border-radius:8px;padding:12px;">
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Nhân viên</div><div style="font-weight:700;">${escapeHtml(data.employeeName || "---")}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Mã hợp đồng</div><div style="font-weight:700;">${escapeHtml(data.contractNumber || "---")}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Loại hợp đồng</div><div style="font-weight:700;">${escapeHtml(CONTRACT_TYPE_LABELS[data.contractType] || "---")}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Trạng thái</div><div style="font-weight:700;">${escapeHtml(statusInfo.label || "---")}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Ngày ký</div><div style="font-weight:700;">${escapeHtml(formatDate(data.signedDate))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Bắt đầu</div><div style="font-weight:700;">${escapeHtml(formatDate(data.startDate))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Kết thúc</div><div style="font-weight:700;">${escapeHtml(data.contractType === "permanent" ? "Không thời hạn" : formatDate(data.endDate))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Giờ làm/tuần</div><div style="font-weight:700;">${escapeHtml(`${data.workingHours || 40} giờ`)}</div></div>
        </div>

        <h2 style="margin:20px 0 8px;font-size:16px;">Lương và phụ cấp</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;border:1px solid #cbd5e1;border-radius:8px;padding:12px;">
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Lương cơ bản</div><div style="font-weight:700;">${escapeHtml(formatCurrency(getSalaryValue("baseSalary")))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Lương KPI/Thưởng</div><div style="font-weight:700;">${escapeHtml(formatCurrency(getSalaryValue("performanceSalary")))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Phụ cấp ăn trưa</div><div style="font-weight:700;">${escapeHtml(formatCurrency(getSalaryValue("lunchAllowance")))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Phụ cấp xăng xe</div><div style="font-weight:700;">${escapeHtml(formatCurrency(getSalaryValue("fuelAllowance")))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Phụ cấp điện thoại</div><div style="font-weight:700;">${escapeHtml(formatCurrency(getSalaryValue("phoneAllowance")))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Phụ cấp khác</div><div style="font-weight:700;">${escapeHtml(formatCurrency(getSalaryValue("otherAllowance")))}</div></div>
          <div><div style="color:#64748b;font-size:12px;margin-bottom:4px;">Tổng thu nhập</div><div style="font-weight:700;">${escapeHtml(formatCurrency(totalIncome))}</div></div>
        </div>

        <h2 style="margin:20px 0 8px;font-size:16px;">Hình ảnh đính kèm</h2>
        <div style="border:1px solid #cbd5e1;border-radius:8px;padding:12px;">${attachmentImageMarkup}</div>

        <h2 style="margin:20px 0 8px;font-size:16px;">Tệp đính kèm khác</h2>
        <div style="border:1px solid #cbd5e1;border-radius:8px;padding:12px;">${nonImageMarkup}</div>

        <h2 style="margin:20px 0 8px;font-size:16px;">Ghi chú</h2>
        <div style="border:1px solid #cbd5e1;border-radius:8px;padding:12px;">${data.note ? escapeHtml(data.note) : '<span style="color:#64748b;font-style:italic;">Không có ghi chú nội bộ</span>'}</div>
      `;

      document.body.appendChild(container);

      const images = Array.from(container.querySelectorAll("img"));
      await Promise.all(images.map((img) => waitForImageLoad(img)));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(fileName);
      document.body.removeChild(container);
    } catch (err) {
      console.error("Xuất PDF thất bại:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết hợp đồng lao động"
      size="4xl"
    >
      <div className="space-y-6 mt-4 pr-2">
        {/* Header Section */}
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
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${statusInfo.color}`}
                >
                  {statusInfo.label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:block text-left md:text-right border-t md:border-none pt-4 md:pt-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Loại hợp đồng
            </p>
            <p className="text-sm font-bold text-slate-700">
              {CONTRACT_TYPE_LABELS[data.contractType] || "---"}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <section className="lg:col-span-2 p-6 rounded-3xl border bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <SectionTitle
                  icon={<User size={16} />}
                  title="Thông tin nhân sự"
                />
                <div className="grid gap-4">
                  <InfoItem
                    label="Mã nhân viên"
                    value={data.employee?.employeeCode || data.employeeId}
                  />
                  <InfoItem
                    label="Phòng ban"
                    value={data.departmentName}
                    highlight
                  />
                  <InfoItem
                    label="Vị trí"
                    value={data.positionName}
                    highlight
                  />
                </div>
              </div>

              <div className="space-y-4">
                <SectionTitle
                  icon={<Calendar size={16} />}
                  title="Thời hạn hợp đồng"
                />
                <div className="grid gap-4">
                  <InfoItem
                    label="Ngày ký"
                    value={formatDate(data.signedDate)}
                  />
                  <InfoItem
                    label="Bắt đầu"
                    value={formatDate(data.startDate)}
                  />
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
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <SectionTitle
                icon={<Clock size={16} />}
                title="Chế độ làm việc"
              />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Giờ làm / tuần"
                  value={`${data.workingHours || 40} giờ`}
                />
                <InfoItem label="Ngạch lương" value={data.jobGradeName} />
              </div>
            </div>
          </section>

          {/* Salary Sidebar */}
          <aside className="bg-indigo-600 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-indigo-100">
            <div className="space-y-6">
              <SectionTitle
                icon={<DollarSign size={16} />}
                title="Lương & Phụ cấp"
                color="text-white"
              />

              <div className="space-y-4">
                <div>
                  <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest">
                    Lương cơ bản
                  </p>
                  <p className="text-3xl font-black">
                    {formatCurrency(getSalaryValue("baseSalary"))}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest">
                    Lương KPI
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(getSalaryValue("performanceSalary"))}
                  </p>
                </div>
              </div>

              <div className="border-t border-indigo-400/50 pt-4 space-y-3 text-sm">
                <Row
                  label="Ăn trưa"
                  value={formatCurrency(getSalaryValue("lunchAllowance"))}
                />
                <Row
                  label="Xăng xe"
                  value={formatCurrency(getSalaryValue("fuelAllowance"))}
                />
                <Row
                  label="Điện thoại"
                  value={formatCurrency(getSalaryValue("phoneAllowance"))}
                />
                <Row
                  label="Khác"
                  value={formatCurrency(getSalaryValue("otherAllowance"))}
                />
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

        {/* Attachments & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Box title="Hợp đồng đính kèm" icon={<Paperclip size={16} />}>
            <div className="space-y-2">
              {data.attachments && data.attachments.length > 0 ? (
                normalizedAttachments.map((file, i) => {
                  const { fileUrl, fileName } = file;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-transparent hover:border-indigo-100 group transition-all"
                    >
                      <div className="flex items-center gap-2 truncate mr-4">
                        <FileText
                          size={14}
                          className="text-slate-400 group-hover:text-indigo-500 shrink-0"
                        />
                        <span
                          className="text-sm font-medium text-slate-700 truncate"
                          title={fileName}
                        >
                          {fileName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleViewFile(fileUrl)}
                          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-100 shadow-sm"
                          title="Xem trực tiếp"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(fileUrl, fileName)}
                          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-emerald-600 transition-colors border border-transparent hover:border-slate-100 shadow-sm"
                          title="Tải về máy"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="italic text-slate-400 text-sm py-2 text-center">
                  Không có file đính kèm
                </p>
              )}
            </div>
          </Box>

          <Box title="Ghi chú" icon={<Info size={16} />}>
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.note || (
                <span className="italic text-slate-400">
                  Không có ghi chú nội bộ
                </span>
              )}
            </p>
          </Box>
        </div>

        {/* Footer Actions */}
        <footer className="flex justify-end gap-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrint}
            loading={exportingPdf}
            className="rounded-xl border-slate-200"
          >
            <Download className="mr-2 h-4 w-4" /> Xuất PDF
          </Button>
          <Button
            onClick={onClose}
            className="rounded-xl px-8 bg-slate-900 hover:bg-black"
          >
            Đóng
          </Button>
        </footer>
      </div>
    </Modal>
  );
}

// --- Sub-components (Giữ nguyên hoặc tinh chỉnh UI nhẹ) ---

function SectionTitle({ icon, title, color = "text-slate-800" }) {
  return (
    <div
      className={`flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider ${color}`}
    >
      <span className="p-2 bg-slate-50 border rounded-xl shadow-sm text-slate-600">
        {icon}
      </span>
      {title}
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tight">
        {label}
      </p>
      <p
        className={`text-sm mt-0.5 ${highlight ? "text-indigo-600 font-bold" : "font-semibold text-slate-700"}`}
      >
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
