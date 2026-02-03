"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { 
  Download, FileText, Briefcase, DollarSign, 
  ShieldCheck, Clock, MapPin, CreditCard 
} from "lucide-react";

// --- Constants (Đồng bộ với Form) ---
const contractTypeLabels = {
  probation: "Thử việc",
  fixed_6m: "Xác định thời hạn (6 tháng)",
  fixed_12m: "Xác định thời hạn (12 tháng)",
  fixed_24m: "Xác định thời hạn (24 tháng)",
  permanent: "Hợp đồng vĩnh viễn",
  seasonal: "Thời vụ / Cộng tác viên",
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

const workModelLabels = {
  fulltime: "Toàn thời gian",
  parttime: "Bán thời gian",
  remote: "Remote",
  hybrid: "Hybrid",
};

export default function ViewContractModal({ isOpen, onClose, contract, loading }) {
  if (!contract) return null;

  // Helper format tiền tệ
  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const handleDownload = () => {
    console.log("Downloading contract:", contract.contractNumber);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết hợp đồng lao động" size="2xl">
      <div className="space-y-8 mt-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* 1. Header & Trạng thái */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              {contract.employee?.fullName?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{contract.employee?.fullName}</h3>
              <p className="text-sm text-slate-500 font-medium">Số HĐ: <span className="text-indigo-600">{contract.contractNumber || contract.id}</span></p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${contractStatusColors[contract.contractStatus || contract.status]}`}>
            {contractStatusLabels[contract.contractStatus || contract.status]?.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-1">
          
          {/* 2. Thông tin chung & Thời hạn */}
          <section className="space-y-4">
            <SectionTitle icon={<FileText size={16}/>} title="Thông tin chung & Thời hạn" />
            <div className="grid grid-cols-1 gap-3 ml-7">
              <InfoItem label="Loại hợp đồng" value={contractTypeLabels[contract.contractType] || contract.contractType} />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Ngày bắt đầu" value={contract.startDate} isDate />
                <InfoItem label="Ngày kết thúc" value={contract.endDate || "Vô thời hạn"} isDate={!!contract.endDate} />
              </div>
              <InfoItem label="Ngày ký" value={contract.signedDate || contract.signDate} isDate />
            </div>
          </section>

          {/* 3. Vị trí & Công việc */}
          <section className="space-y-4">
            <SectionTitle icon={<Briefcase size={16}/>} title="Vị trí & Công việc" />
            <div className="grid grid-cols-1 gap-3 ml-7">
              <InfoItem label="Chức danh" value={contract.jobTitle || contract.position} />
              <InfoItem label="Hình thức" value={workModelLabels[contract.workModel] || contract.workModel} />
              <InfoItem icon={<MapPin size={12}/>} label="Địa điểm" value={contract.location} />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Giờ làm/ngày" value={contract.hoursPerDay ? `${contract.hoursPerDay}h` : "-"} />
                <InfoItem label="Giờ làm/tuần" value={contract.hoursPerWeek ? `${contract.hoursPerWeek}h` : "-"} />
              </div>
            </div>
          </section>

          {/* 4. Lương & Phụ cấp */}
          <section className="space-y-4 md:col-span-2 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
            <SectionTitle icon={<DollarSign size={16}/>} title="Chế độ Lương & Phụ cấp" color="text-indigo-700" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-7 mt-4">
              <div className="md:col-span-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Lương cơ bản</p>
                <p className="text-xl font-bold text-indigo-600">{formatCurrency(contract.baseSalary || contract.salary)}</p>
                <div className="flex items-center gap-1 mt-2 text-slate-500">
                  <CreditCard size={14}/>
                  <span className="text-xs">{contract.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}</span>
                </div>
              </div>
              
              <div className="md:col-span-2 grid grid-cols-2 gap-4 border-l border-indigo-100 pl-6">
                <InfoItem label="Ăn trưa" value={formatCurrency(contract.allowanceLunch)} />
                <InfoItem label="Xăng xe" value={formatCurrency(contract.allowanceTravel)} />
                <InfoItem label="Trách nhiệm" value={formatCurrency(contract.allowanceResponsibility)} />
                <InfoItem label="Thưởng KPI" value={formatCurrency(contract.bonusKpi)} />
              </div>
            </div>
          </section>

          {/* 5. Bảo hiểm & Thuế */}
          <section className="space-y-4">
            <SectionTitle icon={<ShieldCheck size={16}/>} title="Bảo hiểm & Thuế" />
            <div className="grid grid-cols-1 gap-3 ml-7">
              <InfoItem label="Mức đóng BHXH" value={formatCurrency(contract.insuranceAmount)} />
              <InfoItem label="Mã số thuế" value={contract.taxCode} />
              <InfoItem label="Ngày bắt đầu đóng BH" value={contract.insuranceStartDate} isDate />
            </div>
          </section>

          {/* 6. Điều khoản & Cam kết */}
          <section className="space-y-4">
            <SectionTitle icon={<Clock size={16}/>} title="Điều khoản" />
            <div className="grid grid-cols-1 gap-3 ml-7">
              <InfoItem label="Thử việc" value={contract.probationPeriod} />
              <InfoItem label="Thông báo nghỉ" value={contract.noticePeriod} />
            </div>
          </section>

        </div>

        {/* Mô tả / Điều khoản bổ sung */}
        {contract.jobDescription || contract.termsAndConditions && (
          <div className="border-t border-slate-100 pt-6 px-1">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Ghi chú & Điều khoản bổ sung</h4>
            <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed italic">
              {contract.termsAndConditions || contract.jobDescription}
            </p>
          </div>
        )}

        {/* 7. Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <Button variant="outline" onClick={handleDownload} className="border-slate-200 hover:bg-slate-50">
            <Download className="mr-2 h-4 w-4 text-slate-500" />
            Xuất file PDF
          </Button>
          <Button onClick={onClose} className="px-8 bg-slate-900 hover:bg-slate-800 text-white">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// --- Sub-components để code gọn sạch hơn ---

function SectionTitle({ icon, title, color = "text-slate-800" }) {
  return (
    <div className={`flex items-center gap-2 ${color} font-bold text-sm uppercase tracking-tight`}>
      <span className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">{icon}</span>
      {title}
    </div>
  );
}

function InfoItem({ label, value, isDate = false, icon }) {
  const displayValue = isDate && value ? new Date(value).toLocaleDateString("vi-VN") : value;
  
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">
        {displayValue || "---"}
      </p>
    </div>
  );
}