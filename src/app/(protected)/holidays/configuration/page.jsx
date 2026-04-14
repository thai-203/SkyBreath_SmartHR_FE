"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  Bell,
  Send,
  Users,
  Building2,
  Calendar,
} from "lucide-react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Switch } from "@/components/common/Switch";
import { Checkbox } from "@/components/common/Checkbox";
import { useToast } from "@/components/common/Toast";
import { holidayConfigService, departmentsService, employeesService } from "@/services";
import EmployeeTreeSelector from "../components/EmployeeTreeSelector";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

export default function HolidayConfigurationPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  
  // ── Config state ───────────────────────────────────────
  const [config, setConfig] = useState({
    isPaidByDefault: false,
    compensatoryWorkingDaysEnabled: false,
    holidayReminderPolicy: "",
    defaultHolidayGroupId: null,
    remindersEnabled: true,
    reminderLeadTime: 1,
    reminderChannels: ['IN_APP'],
    reminderRecipients: [],
    reminderHolidayTypes: []
  });
  const [recipientMode, setRecipientMode] = useState('ALL'); // ALL, PARTIAL
  const [treeData, setTreeData] = useState([]);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  
  // ── Fetch configuration ────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const configRes = await holidayConfigService.getConfig();
      if (configRes.success) {
        const fetchedConfig = configRes.data;
        setConfig(fetchedConfig);
        // Set mode based on content
        if (fetchedConfig.reminderRecipients?.includes('ALL_EMPLOYEES')) {
          setRecipientMode('ALL');
        } else {
          setRecipientMode('PARTIAL');
        }
      }
    } catch (err) {
      toastError("Không thể tải dữ liệu cấu hình");
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    setLoadingChart(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        departmentsService.getChartForHoliday(),
        employeesService.getAllForPublic({ limit: 1000 })
      ]);
      const departments = deptRes.data || [];
      const employees = empRes.data?.items || empRes.data || [];
      
      const buildTree = (depts) => {
        return depts.map(dept => {
          const deptEmployees = employees.filter(emp => emp.departmentId === dept.id);
          return {
            ...dept,
            employees: deptEmployees,
            children: dept.children ? buildTree(dept.children) : []
          };
        });
      };
      setTreeData(buildTree(departments));
    } catch {
      toastError("Không thể tải sơ đồ nhân sự");
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchChartData();
  }, []);

  // ── Recipient Handlers ─────────────────────────────────
  const handleRecipientModeChange = (mode) => {
    setRecipientMode(mode);
    if (mode === 'ALL') {
      setConfig(prev => ({ ...prev, reminderRecipients: ['ALL_EMPLOYEES'] }));
    } else {
      const currentRecipients = config.reminderRecipients || [];
      const newRecs = currentRecipients.includes('ALL_EMPLOYEES') ? [] : currentRecipients;
      setConfig(prev => ({ ...prev, reminderRecipients: newRecs }));
    }
  };

  const handleTreeSelect = (item, checked) => {
    const isEmployee = !!item.fullName;
    let idsToToggle = [];
    if (isEmployee) {
      idsToToggle = [String(item.id)];
    } else {
      idsToToggle = item.employees?.map(e => String(e.id)) || [];
    }

    let nextRecipients = [...(config.reminderRecipients || [])];
    if (checked) {
      nextRecipients = Array.from(new Set([...nextRecipients, ...idsToToggle]));
    } else {
      nextRecipients = nextRecipients.filter(id => !idsToToggle.includes(id));
    }
    setConfig(prev => ({ ...prev, reminderRecipients: nextRecipients }));
  };

  // ── Config actions ─────────────────────────────────────
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await holidayConfigService.updateConfig(config);
      if (res.success) toastSuccess("Cập nhật cấu hình thành công");
    } catch (err) {
      toastError("Lỗi khi cập nhật cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerReminders = async () => {
    if (!confirm("Bạn có muốn chạy kiểm tra và gửi thông báo nhắc nhở cho các ngày lễ sắp tới ngay bây giờ?")) return;
    setTriggering(true);
    try {
      const res = await holidayConfigService.triggerReminders();
      if (res.success) toastSuccess("Đã kích hoạt gửi thông báo nhắc nhở thành công");
    } catch (err) {
      toastError("Lỗi khi kích hoạt thông báo");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Đang tải cấu hình...</div>;
  }

  return (
    <div className="space-y-6 container mx-auto py-8 max-w-4xl">
      <PageTitle title="Cấu hình Ngày nghỉ lễ" />

      <Card className="p-8">
        <div className="flex items-center gap-3 mb-8 border-b pb-4">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Settings className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cài đặt chung & Nhắc nhở</h2>
            <p className="text-sm text-slate-500 mt-0.5">Thiết lập các quy tắc mặc định và chính sách thông báo ngày nghỉ.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Section: Core Rules */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-l-4 border-indigo-400 pl-3">Quy tắc mặc định</h3>
            
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                <div>
                  <p className="font-bold text-slate-800">Mặc định nghỉ có lương</p>
                  <p className="text-xs text-slate-500 mt-1">Tự động đánh dấu là ngày nghỉ có hưởng lương khi tạo mới ngày lễ.</p>
                </div>
                <Switch 
                  checked={config.isPaidByDefault} 
                  onCheckedChange={(val) => setConfig({...config, isPaidByDefault: val})}
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                <div>
                  <p className="font-bold text-slate-800">Hỗ trợ ngày làm bù</p>
                  <p className="text-xs text-slate-500 mt-1">Bật tính năng cấu hình các ngày làm việc thay thế cho ngày nghỉ lễ.</p>
                </div>
                <Switch 
                  checked={config.compensatoryWorkingDaysEnabled} 
                  onCheckedChange={(val) => setConfig({...config, compensatoryWorkingDaysEnabled: val})}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <Button className="w-full h-12 rounded-xl shadow-lg shadow-indigo-200" onClick={handleSaveConfig} disabled={saving}>
                <Save className="h-5 w-5 mr-2" />
                {saving ? "Đang lưu cấu hình..." : "Lưu cài đặt cấu hình"}
              </Button>

              <Button variant="outline" className="w-full h-12 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50" onClick={handleTriggerReminders} disabled={triggering}>
                <Send className="h-4 w-4 mr-2 text-indigo-500" />
                {triggering ? "Đang xử lý..." : "Kích hoạt kiểm tra thông báo ngay"}
              </Button>
            </div>
          </div>

          {/* Section: Reminders */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-l-4 border-amber-400 pl-3">Thông báo nhắc nhở</h3>
              <Switch 
                checked={config.remindersEnabled} 
                onCheckedChange={(val) => setConfig({...config, remindersEnabled: val})}
              />
            </div>
            
            <div className={`space-y-6 transition-all duration-500 ${config.remindersEnabled ? 'opacity-100 scale-100' : 'opacity-40 grayscale pointer-events-none scale-[0.98]'}`}>
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 uppercase font-extrabold tracking-tighter">Thời gian nhắc (ngày trước lễ)</label>
                <div className="relative">
                  <Input 
                    type="number"
                    min="0"
                    placeholder="Số ngày..."
                    className="h-11 rounded-xl bg-white border-slate-200 focus:ring-amber-200"
                    value={config.reminderLeadTime || 0}
                    onChange={(e) => setConfig({...config, reminderLeadTime: parseInt(e.target.value)})}
                  />
                  <Calendar className="absolute right-3.5 top-3 h-5 w-5 text-slate-300" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] text-slate-400 uppercase font-extrabold tracking-tighter">Kênh thông báo</label>
                <div className="flex gap-6 p-1">
                  <Checkbox 
                    label="Trong ứng dụng"
                    checked={config.reminderChannels?.includes('IN_APP')}
                    onCheckedChange={(checked) => {
                      const channels = config.reminderChannels || [];
                      setConfig({...config, reminderChannels: checked ? [...channels, 'IN_APP'] : channels.filter(c => c !== 'IN_APP')});
                    }}
                  />
                  <Checkbox 
                    label="Email"
                    checked={config.reminderChannels?.includes('EMAIL')}
                    onCheckedChange={(checked) => {
                      const channels = config.reminderChannels || [];
                      setConfig({...config, reminderChannels: checked ? [...channels, 'EMAIL'] : channels.filter(c => c !== 'EMAIL')});
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] text-slate-400 uppercase font-extrabold tracking-tighter">Đối tượng người nhận</label>
                <div className="flex p-1.5 bg-slate-100/80 rounded-2xl w-full border border-slate-200/50">
                  <button 
                    type="button"
                    onClick={() => handleRecipientModeChange('ALL')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      recipientMode === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Tất cả nhân viên
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleRecipientModeChange('PARTIAL')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      recipientMode === 'PARTIAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Chọn một phần
                  </button>
                </div>

                {recipientMode === 'PARTIAL' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <Button 
                      variant="outline" 
                      className="w-full h-11 text-[13px] border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-400 transition-all text-indigo-600 rounded-xl"
                      onClick={() => setIsTreeModalOpen(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Mở sơ đồ chọn nhân sự ({config.reminderRecipients?.filter(r => r !== 'ALL_EMPLOYEES').length || 0})
                    </Button>
                  </div>
                )}
                
                {recipientMode === 'ALL' && (
                  <p className="text-[11px] text-indigo-500/80 italic font-medium bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                    * Hệ thống sẽ tự động gửi thông báo đến toàn bộ nhân sự đang hoạt động.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 uppercase font-extrabold tracking-tighter">Áp dụng cho loại ngày nghỉ</label>
                <Input 
                  placeholder="Ví dụ: Nghỉ lễ, tết"
                  className="h-11 rounded-xl bg-white border-slate-200"
                  value={Array.isArray(config.reminderHolidayTypes) ? config.reminderHolidayTypes.join(', ') : (config.reminderHolidayTypes || "")}
                  onChange={(e) => {
                    const types = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                    setConfig({...config, reminderHolidayTypes: types});
                  }}
                />
                <p className="text-[10px] text-slate-400 italic">Để trống nếu muốn áp dụng cho tất cả loại nghỉ lễ.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 uppercase font-extrabold tracking-tighter">Chính sách/Ghi chú mẫu</label>
                <textarea 
                  placeholder="Nhập nội dung ghi chú cho thông báo..."
                  className="w-full min-h-[100px] p-4 text-sm rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none transition-all"
                  value={config.holidayReminderPolicy || ""}
                  onChange={(e) => setConfig({...config, holidayReminderPolicy: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recipient Selector Modal */}
      <Dialog open={isTreeModalOpen} onOpenChange={setIsTreeModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-indigo-600 text-white rounded-xl">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span>Chọn đối tượng nhận thông báo</span>
                <span className="text-xs font-normal text-slate-500 mt-0.5">Sử dụng sơ đồ tổ chức để chọn chính xác nhân sự hoặc phòng ban.</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6">
            <EmployeeTreeSelector 
              treeData={treeData}
              selectedIds={config.reminderRecipients || []}
              onSelect={handleTreeSelect}
              loading={loadingChart}
              maxHeight="450px"
            />
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between sm:justify-between">
            <div className="text-sm font-medium text-slate-500">
              Đã chọn <span className="text-indigo-600 font-bold">{config.reminderRecipients?.length || 0}</span> nhân sự
            </div>
            <Button onClick={() => setIsTreeModalOpen(false)} className="px-10 h-11 rounded-xl shadow-lg shadow-indigo-200">
              Xác nhận và đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
