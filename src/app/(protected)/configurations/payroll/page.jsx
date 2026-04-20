"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Wallet, UserCheck, Save, ArrowLeft, Loader2, Search, Users, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { employeesService } from "@/services/employees.service";
import { payrollConfigurationsService } from "@/services/payroll-configurations.service";
import { toast } from "sonner";

export default function PayrollConfigurationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [config, setConfig] = useState({
    approver1Id: null,
    approver2Id: null,
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLevel, setActiveLevel] = useState(1); // 1 or 2

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, configRes] = await Promise.all([
        employeesService.getList(),
        payrollConfigurationsService.getConfig(),
      ]);
      const empList = Array.isArray(empRes) ? empRes : (empRes?.data || []);
      setEmployees(empList);
      if (configRes) {
        setConfig({
          approver1Id: configRes.approver1Id || configRes.approver1_id,
          approver2Id: configRes.approver2Id || configRes.approver2_id,
          isActive: configRes.isActive !== undefined ? configRes.isActive : configRes.is_active,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu cấu hình");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await payrollConfigurationsService.updateConfig(config);
      toast.success("Đã lưu cấu hình phê duyệt lương 2 cấp");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = (employees || []).filter((emp) =>
    emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedApprover1 = (employees || []).find(e => e.id === config.approver1Id);
  const selectedApprover2 = (employees || []).find(e => e.id === config.approver2Id);

  const handleSelectEmployee = (empId) => {
    if (activeLevel === 1) {
      if (empId === config.approver2Id) {
        toast.error("Người duyệt cấp 1 không được trùng với người duyệt cấp 2");
        return;
      }
      setConfig({ ...config, approver1Id: empId });
    } else {
      if (empId === config.approver1Id) {
        toast.error("Người duyệt cấp 2 không được trùng với người duyệt cấp 1");
        return;
      }
      setConfig({ ...config, approver2Id: empId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle
          icon={Wallet}
          title="Cấu Hình Quy Trình Lương 2 Cấp"
          description="Thiết lập hội đồng phê duyệt bảng lương (Cấp 1 & Cấp 2)"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/configurations")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Quay Lại
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-emerald-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-700">
                  <Users className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">Danh Sách Nhân Sự</CardTitle>
                    <CardDescription className="text-emerald-600/70">
                      Chọn người phê duyệt cho từng cấp độ
                    </CardDescription>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveLevel(1)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeLevel === 1 ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Cấp 1
                  </button>
                  <button
                    onClick={() => setActiveLevel(2)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeLevel === 2 ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Cấp 2
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p className="text-sm">Đang tải danh sách nhân sự...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Tìm kiếm người duyệt Cấp ${activeLevel}...`}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="max-h-[450px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 shadow-inner bg-slate-50/30">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => {
                        const isSelected = activeLevel === 1 ? config.approver1Id === emp.id : config.approver2Id === emp.id;
                        const isOtherLevel = activeLevel === 1 ? config.approver2Id === emp.id : config.approver1Id === emp.id;

                        return (
                          <div
                            key={emp.id}
                            onClick={() => !isOtherLevel && handleSelectEmployee(emp.id)}
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all hover:bg-white hover:shadow-sm ${
                              isSelected
                                ? "bg-emerald-50 border-l-4 border-l-emerald-500"
                                : "border-l-4 border-l-transparent"
                            } ${isOtherLevel ? "opacity-40 cursor-not-allowed bg-slate-50" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                isSelected ? "bg-emerald-500 text-white" : "bg-white text-slate-400 border border-slate-200"
                              }`}>
                                {emp.fullName?.split(" ").pop().charAt(0)}
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${isSelected ? "text-emerald-700" : "text-slate-700"}`}>
                                  {emp.fullName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {emp.employeeCode} • {emp.department?.departmentName || "N/A"}
                                  {isOtherLevel && ` (Đã chọn ở Cấp ${activeLevel === 1 ? 2 : 1})`}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 uppercase">
                                <UserCheck className="h-3 w-3" /> Selected
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-sm italic">
                        Không tìm thấy nhân viên nào
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Trạng Thái Phê Duyệt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Level 1 Slot */}
              <div className={`p-4 rounded-2xl border transition-all ${activeLevel === 1 ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20" : "bg-slate-50 border-slate-100"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Người duyệt Cấp 1</p>
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold italic">Sơ bộ</span>
                </div>
                {selectedApprover1 ? (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                      {selectedApprover1.fullName.split(" ").pop().charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{selectedApprover1.fullName}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{selectedApprover1.position?.positionName || "HR Manager"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa thiết lập Cấp 1</p>
                )}
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white border border-slate-200 p-1.5 rounded-full shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
              </div>

              {/* Level 2 Slot */}
              <div className={`p-4 rounded-2xl border transition-all ${activeLevel === 2 ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20" : "bg-slate-50 border-slate-100"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Người duyệt Cấp 2</p>
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold italic shadow-sm">Quyết định</span>
                </div>
                {selectedApprover2 ? (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-sm shadow-md">
                      {selectedApprover2.fullName.split(" ").pop().charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{selectedApprover2.fullName}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{selectedApprover2.position?.positionName || "CEO / Director"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa thiết lập Cấp 2</p>
                )}
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <span className="text-sm font-bold text-slate-600">Bắt buộc 2 cấp</span>
                  <div 
                    onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${config.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${config.isActive ? 'left-7' : 'left-1'}`} />
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving || loading || !config.approver1Id || !config.approver2Id}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span className="font-bold">Lưu Cấu Hình 2 Cấp</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-emerald-950 text-emerald-50 p-4 rounded-2xl shadow-xl">
                <p className="text-[10px] font-black uppercase mb-1 tracking-widest text-emerald-400">
                  ⚠️ Quy trình phê duyệt
                </p>
                <p className="text-[11px] leading-relaxed font-medium">
                  Bảng lương sẽ được gửi đến <strong className="text-white">Cấp 1</strong> để xem xét trước. Sau khi Cấp 1 đồng ý, <strong className="text-white">Cấp 2</strong> sẽ nhận được thông báo để ký duyệt cuối cùng.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
