"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Calendar,
  ShieldCheck,
  Bell,
  Check,
  Send
} from "lucide-react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Switch } from "@/components/common/Switch";
import { Checkbox } from "@/components/common/Checkbox";
import { useToast } from "@/components/common/Toast";
import { holidayConfigService, holidayService } from "@/services";
import { Modal } from "@/components/common/Modal";
import { HolidayGroupModal } from "../components/HolidayGroupModal";

export default function HolidayConfigurationPage() {
  const { success, error: toastError } = useToast();
  
  // State
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
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  
  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({ 
    groupName: "", 
    groupCode: "",
    year: new Date().getFullYear(),
    applicableScope: "GLOBAL",
    status: "ACTIVE",
    description: "" 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, groupsRes] = await Promise.all([
        holidayConfigService.getConfig(),
        holidayConfigService.getGroups()
      ]);
      if (configRes.success) setConfig(configRes.data);
      if (groupsRes.success) setGroups(groupsRes.data);
    } catch (err) {
      toastError("Không thể tải dữ liệu cấu hình");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await holidayConfigService.updateConfig(config);
      if (res.success) {
        success("Cập nhật cấu hình thành công");
      }
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
      if (res.success) {
        success("Đã kích hoạt gửi thông báo nhắc nhở thành công");
      }
    } catch (err) {
      toastError("Lỗi khi kích hoạt thông báo");
    } finally {
      setTriggering(false);
    }
  };

  const handleOpenGroupModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({ 
        groupName: group.groupName, 
        groupCode: group.groupCode || "",
        year: group.year || new Date().getFullYear(),
        applicableScope: group.applicableScope || "GLOBAL",
        status: group.status || "ACTIVE",
        description: group.description || "" 
      });
    } else {
      setEditingGroup(null);
      setGroupFormData({ 
        groupName: "", 
        groupCode: "",
        year: new Date().getFullYear(),
        applicableScope: "GLOBAL",
        status: "ACTIVE",
        description: "" 
      });
    }
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (data) => {
    try {
      if (editingGroup) {
        await holidayConfigService.updateGroup(editingGroup.id, data);
        success("Cập nhật danh mục thành công");
      } else {
        await holidayConfigService.createGroup(data);
        success("Thêm danh mục mới thành công");
      }
      setIsGroupModalOpen(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Lỗi khi lưu danh mục");
    }
  };

  const handleDeleteGroup = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhóm này?")) {
      try {
        await holidayConfigService.deleteGroup(id);
        success("Xóa nhóm thành công");
        fetchData();
      } catch (err) {
        toastError(err.response?.data?.message || "Lỗi khi xóa nhóm");
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Cấu hình Ngày nghỉ lễ" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <Settings className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold">Cài đặt chung</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mặc định là ngày nghỉ có lương</p>
                  <p className="text-sm text-slate-500">Tự động đánh dấu nghỉ có lương khi tạo mới</p>
                </div>
                <Switch 
                  checked={config.isPaidByDefault} 
                  onCheckedChange={(val) => setConfig({...config, isPaidByDefault: val})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Hỗ trợ ngày làm bù</p>
                  <p className="text-sm text-slate-500">Cho phép cấu hình các ngày làm việc bù cho ngày lễ</p>
                </div>
                <Switch 
                  checked={config.compensatoryWorkingDaysEnabled} 
                  onCheckedChange={(val) => setConfig({...config, compensatoryWorkingDaysEnabled: val})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <p className="font-medium">Nhắc nhở ngày nghỉ lễ</p>
                </div>
                
                <div className="space-y-4 pl-6 border-l-2 border-slate-100 ml-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bật nhắc nhở</span>
                    <Switch 
                      checked={config.remindersEnabled} 
                      onCheckedChange={(val) => setConfig({...config, remindersEnabled: val})}
                    />
                  </div>

                  {config.remindersEnabled && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">Thời gian nhắc (ngày trước lễ)</label>
                        <Input 
                          type="number"
                          min="0"
                          value={config.reminderLeadTime || 0}
                          onChange={(e) => setConfig({...config, reminderLeadTime: parseInt(e.target.value)})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase font-bold">Kênh thông báo</label>
                        <div className="flex gap-4">
                          <Checkbox 
                            label="Trong ứng dụng"
                            checked={config.reminderChannels?.includes('IN_APP')}
                            onCheckedChange={(checked) => {
                              const channels = config.reminderChannels || [];
                              const newChannels = checked 
                                ? [...channels, 'IN_APP'] 
                                : channels.filter(c => c !== 'IN_APP');
                              setConfig({...config, reminderChannels: newChannels});
                            }}
                          />
                          <Checkbox 
                            label="Email"
                            checked={config.reminderChannels?.includes('EMAIL')}
                            onCheckedChange={(checked) => {
                              const channels = config.reminderChannels || [];
                              const newChannels = checked 
                                ? [...channels, 'EMAIL'] 
                                : channels.filter(c => c !== 'EMAIL');
                              setConfig({...config, reminderChannels: newChannels});
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase font-bold">Người nhận (Vai trò)</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].map(role => (
                            <Checkbox 
                              key={role}
                              label={role}
                              checked={config.reminderRecipients?.includes(role)}
                              onCheckedChange={(checked) => {
                                const recs = config.reminderRecipients || [];
                                const newRecs = checked 
                                  ? [...recs, role] 
                                  : recs.filter(r => r !== role);
                                setConfig({...config, reminderRecipients: newRecs});
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">Nhóm loại ngày nghỉ (phân cách bởi dấu phẩy)</label>
                        <Input 
                          placeholder="Ví dụ: Nghỉ lễ, tết"
                          value={Array.isArray(config.reminderHolidayTypes) ? config.reminderHolidayTypes.join(', ') : (config.reminderHolidayTypes || "")}
                          onChange={(e) => {
                            const val = e.target.value;
                            const types = val.split(',').map(s => s.trim()).filter(s => s !== '');
                            setConfig({...config, reminderHolidayTypes: types});
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">Chính sách/Ghi chú</label>
                        <Input 
                          placeholder="Thông báo chung"
                          value={config.holidayReminderPolicy || ""}
                          onChange={(e) => setConfig({...config, holidayReminderPolicy: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 space-y-2 border-t mt-4">
                <Button 
                  className="w-full" 
                  onClick={handleSaveConfig}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Đang lưu..." : "Lưu cài đặt"}
                </Button>

                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={handleTriggerReminders}
                  disabled={triggering}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {triggering ? "Đang xử lý..." : "Chạy kiểm tra thông báo ngay"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Groups List */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-semibold">Danh sách Nhóm Ngày lễ</h2>
              </div>
              <Button size="sm" onClick={() => handleOpenGroupModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm nhóm
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-xs">Mã</th>
                    <th className="px-4 py-3">Tên danh mục</th>
                    <th className="px-4 py-3 text-xs">Năm</th>
                    <th className="px-4 py-3 text-xs">Trạng thái</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{group.groupCode}</td>
                      <td className="px-4 py-3 font-medium">{group.groupName}</td>
                      <td className="px-4 py-3">{group.year}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {group.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">{group.description || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenGroupModal(group)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteGroup(group.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">
                        Chưa có nhóm nào được định nghĩa
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <HolidayGroupModal 
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleSaveGroup}
        group={editingGroup}
      />
    </div>
  );
}
