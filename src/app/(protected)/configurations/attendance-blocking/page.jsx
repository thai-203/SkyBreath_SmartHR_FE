"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, ArrowLeft, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { attendanceBlockingConfigService } from "@/services/attendance-blocking-config.service";
import { AttendanceBlockingTable } from "./components/AttendanceBlockingTable";
import { AttendanceLogsTable } from "./components/AttendanceLogsTable";
import { LogDetailModal } from "./components/LogDetailModal";
import { EditModal } from "./components/EditModal";
import { DeleteModal } from "./components/DeleteModal";
import { useToast } from "@/components/common/Toast";
import { PermissionGate } from "@/components/common/AuthGuard";
import { Input } from "@/components/ui/input";
import { Search, History, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import các components đã tách

// ─── Animations ───────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
  },
};

export default function AttendanceConfig() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho Form Modal (Thêm/Sửa)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // States cho Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // States cho Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsMeta, setLogsMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [logSearch, setLogSearch] = useState("");
  const [logActionType, setLogActionType] = useState("ALL");
  const [logStatus, setLogStatus] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDetailOpen, setLogDetailOpen] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchLogs();
  }, []);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const data = await attendanceBlockingConfigService.getRules();
      setRules(data.data);
    } catch (error) {
      toastError("Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      setLogsLoading(true);
      const res = await attendanceBlockingConfigService.getLogs({
        page,
        limit: 10,
        search: logSearch || undefined,
        actionType: logActionType === "ALL" ? undefined : logActionType || undefined,
        status: logStatus === "ALL" ? undefined : logStatus || undefined,
      });
      const payload = res.data ?? res;
      setLogs(payload.items ?? []);
      setLogsMeta({ total: payload.total, page: payload.page, totalPages: payload.totalPages });
    } catch {
      toastError("Lỗi tải lịch sử log");
    } finally {
      setLogsLoading(false);
    }
  };
  // ─── Handlers cho Form ───────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleSaveModal = async (payload, ruleId) => {
    try {
      if (ruleId) {
        await attendanceBlockingConfigService.updateRule(ruleId, payload);
        toastSuccess("Cập nhật cấu hình thành công.");
      } else {
        await attendanceBlockingConfigService.createRule(payload);
        toastSuccess("Thêm quy tắc thành công.");
      }
      fetchRules();
      setModalOpen(false);
    } catch (error) {
      toastError("Lỗi lưu cấu hình. Vui lòng thử lại!");
    }
  };

  const handleToggle = async (id, checked) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: checked } : r)),
    );
    try {
      await attendanceBlockingConfigService.toggleRule(id, checked);
      toastSuccess(checked ? "Đã kích hoạt quy tắc." : "Đã tạm dừng quy tắc.");
    } catch (error) {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !checked } : r)),
      );
      toastError("Cập nhật thất bại");
    }
  };

  // ─── Handlers cho Delete ─────────────────────────────────────────────────────
  const openDeleteModal = (id) => {
    setRuleToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      setIsDeleting(true);
      await attendanceBlockingConfigService.deleteRule(ruleToDelete);
      fetchRules();
      toastSuccess("Đã xóa quy tắc.");
      setDeleteModalOpen(false);
    } catch (error) {
      toastError("Xóa thất bại");
    } finally {
      setIsDeleting(false);
      setRuleToDelete(null);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-10">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Cấu Hình Chặn Điểm Danh
              </h1>
              <p className="text-sm text-muted-foreground">
                Thiết lập quy tắc tự động khóa theo vi phạm
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => router.push("/configurations")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại cấu hình
          </Button>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div></div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="ATTENDANCE_BLOCKING_CONFIG_CREATE">
            <Button size="sm" onClick={openAddModal}>
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm quy tắc
            </Button>
          </PermissionGate>
        </div>
      </motion.div>

      {/* Main Table Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-border/40 bg-white backdrop-blur-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Danh sách quy tắc</CardTitle>
                <CardDescription>
                  {rules?.length} quy tắc đang được áp dụng
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Truyền openDeleteModal vào RulesTable */}
            <AttendanceBlockingTable
              rules={rules}
              onToggle={handleToggle}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        {/* ...Giữ nguyên Info Cards của bạn... */}
        <Card className="border-destructive-20 bg-destructive-5 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-destructive">
              Thông báo khi sai
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Xác thực thất bại. Bạn còn <strong>{"{remaining}"}</strong> lần
              thử.
            </p>
          </CardContent>
        </Card>
        <Card className="border-warning-20 bg-warning-5 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Thông báo khi bị chặn
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Điểm danh bị khóa trong <strong>{"{minutes}"}</strong> phút.
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary-20 bg-primary-5 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-primary">Đang bị khóa</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tạm khóa điểm danh. Thử lại sau <strong>{"{time}"}</strong>.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <EditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingRule={editingRule}
        rulesList={rules}
        onSave={handleSaveModal}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      {/* Logs Section */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-border/40 bg-white backdrop-blur-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Lịch sử điểm danh</CardTitle>
                <CardDescription>Log check-in, check-out từ hệ thống</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-4 space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên, mã nhân viên..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={logActionType} onValueChange={setLogActionType}>
                <SelectTrigger className="h-9 w-40 text-sm">
                  <SelectValue placeholder="Loại hành động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="check_in">Check-in</SelectItem>
                  <SelectItem value="check_out">Check-out</SelectItem>
                </SelectContent>
              </Select>
              <Select value={logStatus} onValueChange={setLogStatus}>
                <SelectTrigger className="h-9 w-36 text-sm">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="SUCCESS">Thành công</SelectItem>
                  <SelectItem value="FAILED">Thất bại</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => fetchLogs(1)} className="h-9 gap-1.5">
                <Filter className="w-4 h-4" />
                Lọc
              </Button>
            </div>
          </CardContent>
          <CardContent className="p-0">
            {logsLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Đang tải...</p>
            ) : (
              <AttendanceLogsTable
                logs={logs}
                onViewDetail={(log) => { setSelectedLog(log); setLogDetailOpen(true); }}
              />
            )}
          </CardContent>
          {/* Pagination */}
          {logsMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border/40">
              <span className="text-xs text-muted-foreground">
                Tổng: {logsMeta.total} bản ghi
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsMeta.page <= 1}
                  onClick={() => fetchLogs(logsMeta.page - 1)}
                >
                  Trước
                </Button>
                <span className="text-sm">{logsMeta.page} / {logsMeta.totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsMeta.page >= logsMeta.totalPages}
                  onClick={() => fetchLogs(logsMeta.page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      <LogDetailModal
        isOpen={logDetailOpen}
        onClose={() => setLogDetailOpen(false)}
        log={selectedLog}
      />
    </motion.div>
  );
}
