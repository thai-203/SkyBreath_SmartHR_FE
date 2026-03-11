"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Eye } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { faceService } from "@/services";

export default function FaceDataManagePage() {
  const { success, error } = useToast();
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const groupedByEmployee = useMemo(() => {
    const map = new Map();

    faces.forEach((face) => {
      const key = face.employeeId;
      const existing = map.get(key) || {
        employeeId: face.employeeId,
        employeeName: face.employeeName || `#${face.employeeId}`,
        faces: [],
      };
      existing.faces.push(face);
      map.set(key, existing);
    });

    return Array.from(map.values()).map((group) => {
      const lastRegisteredAt = group.faces
        .map((f) => new Date(f.registeredAt))
        .sort((a, b) => b - a)[0];

      return {
        ...group,
        count: group.faces.length,
        lastRegisteredAt,
      };
    });
  }, [faces]);

  const fetchFaces = async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      const res = await faceService.getAllFaces();
      setFaces(res.data || []);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 403) {
        setUnauthorized(true);
        return;
      }
      error(err?.response?.data?.message || "Không thể tải dữ liệu Face");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaces();
  }, []);

  const openEmployeeDetail = (employee) => {
    setActiveEmployee(employee);
    setDetailOpen(true);
  };

  const handleDeleteFace = (face) => {
    setDeleteTarget({ type: "face", id: face.id, employeeId: face.employeeId });
    setConfirmOpen(true);
  };

  const handleDeleteAllForEmployee = (employee) => {
    setDeleteTarget({ type: "employee", employeeId: employee.employeeId });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.type === "face" ? deleteTarget.id : deleteTarget.employeeId);

    try {
      if (deleteTarget.type === "face") {
        await faceService.deleteFace(deleteTarget.id);
        success("Đã xoá ảnh khuôn mặt");
      } else {
        await faceService.deleteFacesByEmployee(deleteTarget.employeeId);
        success("Đã xoá dữ liệu khuôn mặt của nhân viên");
        setDetailOpen(false);
      }
      setConfirmOpen(false);
      setDeleteTarget(null);
      fetchFaces();
    } catch (err) {
      console.error(err);
      error(err?.response?.data?.message || "Xoá dữ liệu Face thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;

    const apiRoot = process.env.NEXT_PUBLIC_API_ROOT || "http://localhost:3000";
;
    return `${apiRoot}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Face Data</h1>
        <p className="text-sm text-slate-500">
          Danh sách dữ liệu khuôn mặt đã được lưu để so khớp và điểm danh.
        </p>
      </div>

      {unauthorized ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="text-base font-semibold text-slate-700">Không có quyền truy cập</p>
          <p className="text-sm text-slate-500">Chỉ quản trị viên mới có thể xem trang này.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Danh sách Face Data</CardTitle>
              <span className="text-sm text-slate-500">
                Tổng: {groupedByEmployee.length} nhân viên
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Nhân viên</th>
                    <th className="px-4 py-3">Số ảnh</th>
                    <th className="px-4 py-3">Lần cuối</th>
                    <th className="px-4 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                        Đang tải...
                      </td>
                    </tr>
                  ) : groupedByEmployee.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    groupedByEmployee.map((group, idx) => (
                      <tr key={group.employeeId} className="border-b border-slate-200">
                        <td className="px-4 py-3 text-slate-600">{idx + 1}</td>
                        <td className="px-4 py-3 text-slate-700">{group.employeeName}</td>
                        <td className="px-4 py-3 text-slate-600">{group.count}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {group.lastRegisteredAt
                            ? new Date(group.lastRegisteredAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEmployeeDetail(group)}
                              className="h-8"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="ml-1">Xem</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAllForEmployee(group)}
                              disabled={deletingId === group.employeeId}
                              className="h-8"
                            >
                              Xoá tất cả
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={
          activeEmployee
            ? `Face data của ${activeEmployee.employeeName}`
            : "Chi tiết Face Data"
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {activeEmployee?.faces?.map((face) => (
              <div key={face.id} className="relative overflow-hidden rounded-lg border border-slate-200">
                {face.imageUrl ? (
                  <img
                    src={getImageUrl(face.imageUrl)}
                    alt="Face"
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="h-28 w-full bg-slate-100" />
                )}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                  <span className="truncate rounded-md bg-slate-900/60 px-2 py-0.5 text-xs text-white">
                    {new Date(face.registeredAt).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFace(face)}
                    disabled={deletingId === face.id}
                    className="h-8 w-8 rounded-full bg-white/70"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              Tổng số ảnh: {activeEmployee?.faces?.length || 0}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Đóng
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  activeEmployee && handleDeleteAllForEmployee(activeEmployee)
                }
              >
                Xoá toàn bộ
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={
          deleteTarget?.type === "employee"
            ? "Xác nhận xoá toàn bộ"
            : "Xác nhận xoá ảnh"
        }
        description={
          deleteTarget?.type === "employee"
            ? "Bạn có chắc muốn xoá toàn bộ dữ liệu khuôn mặt của nhân viên này?"
            : "Bạn có chắc muốn xoá ảnh khuôn mặt này?"
        }
        confirmText="Xoá"
        cancelText="Hủy"
        variant="destructive"
        loading={Boolean(deletingId)}
      />
    </div>
  );
}
