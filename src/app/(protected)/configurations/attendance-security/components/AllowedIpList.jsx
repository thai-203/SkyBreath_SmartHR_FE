"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal, ConfirmModal } from "@/components/common/Modal";

function isValidIpv4(value) {
  const regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return regex.test(value);
}

function isValidCidr(value) {
  const parts = value.split("/");
  if (parts.length !== 2) return false;
  const [ip, prefix] = parts;
  if (!isValidIpv4(ip)) return false;
  const p = Number(prefix);
  return Number.isInteger(p) && p >= 0 && p <= 32;
}

function isSpecialLocalhost(value) {
  const normalized = (value || "").trim().toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0"
  );
}

function isValidIpOrCidr(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  if (isSpecialLocalhost(trimmed)) return true;
  if (trimmed.includes("/")) return isValidCidr(trimmed);
  return isValidIpv4(trimmed);
}

export function AllowedIpList({
  allowedIps = [],
  onCreate,
  onDelete,
  currentIp,
  disabled,
  loading = false,
}) {
  const [inputValue, setInputValue] = useState("");
  const [checkMessage, setCheckMessage] = useState("");
  const [checkStatus, setCheckStatus] = useState(null); // 'ok' | 'notFound' | 'invalid'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalValue, setAddModalValue] = useState("");
  const [addModalError, setAddModalError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const currentIpInList = useMemo(
    () => allowedIps.some((item) => item.ipRange === currentIp),
    [allowedIps, currentIp],
  );

  const isInList = (ip) => allowedIps.some((item) => item.ipRange === ip);

  const handleCheck = () => {
    const nextValue = inputValue.trim();
    if (!nextValue) {
      setCheckStatus("invalid");
      setCheckMessage("Vui lòng nhập địa chỉ IP hoặc CIDR");
      return;
    }

    if (!isValidIpOrCidr(nextValue)) {
      setCheckStatus("invalid");
      setCheckMessage("Định dạng IP/CIDR không hợp lệ");
      return;
    }

    if (isInList(nextValue)) {
      setCheckStatus("ok");
      setCheckMessage("IP này đã nằm trong danh sách");
    } else {
      setCheckStatus("notFound");
      setCheckMessage("IP không tồn tại trong danh sách");
    }
  };

  const handleOpenAddModal = () => {
    setAddModalValue("");
    setAddModalError("");
    setIsAddModalOpen(true);
  };

  const handleAddConfirm = async () => {
    const nextValue = addModalValue.trim();
    if (!nextValue) {
      setAddModalError("Vui lòng nhập địa chỉ IP hoặc CIDR");
      return;
    }
    if (!isValidIpOrCidr(nextValue)) {
      setAddModalError("Định dạng IP/CIDR không hợp lệ");
      return;
    }

    if (isInList(nextValue)) {
      setAddModalError("IP đã tồn tại trong danh sách");
      return;
    }

    setAddModalError("");
    setAdding(true);
    try {
      await onCreate({ ipRange: nextValue });
      setAddModalValue("");
      setIsAddModalOpen(false);
    } catch (e) {
      setAddModalError(e?.response?.data?.message || "Không thể thêm IP. Vui lòng thử lại.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      setDeleteCandidate(null);
    } catch (e) {
      // ignore - caller can surface errors if needed
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Danh sách IP cho phép</h3>
          <p className="text-sm text-slate-500">
            Thêm dải IP (IPv4) hoặc CIDR để chặn/cho phép khi điểm danh.
          </p>
        </div>
        {currentIp && (
          <div
            className={
              "rounded-full px-3 py-1 text-xs font-medium " +
              (currentIpInList
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800")
            }
          >
            <span className="font-semibold">IP hiện tại:</span> {currentIp}{" "}
            {currentIpInList ? (
              <CheckCircle className="inline-block h-4 w-4 align-text-bottom" />
            ) : (
              <AlertTriangle className="inline-block h-4 w-4 align-text-bottom" />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            value={inputValue}
            disabled={disabled || loading}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="192.168.1.0/24 hoặc 10.0.0.5"
          />
          {checkMessage ? (
            <p
              className={
                "text-xs mt-1 " +
                (checkStatus === "ok" ? "text-emerald-600" : "text-red-600")
              }
            >
              {checkMessage}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCheck}
            disabled={disabled || loading || !inputValue.trim()}
            className="w-full sm:w-auto"
          >
            <Search className="mr-2 h-4 w-4" />
            Kiểm tra
          </Button>
          <Button
            onClick={handleOpenAddModal}
            disabled={disabled || loading}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">IP đã lưu</span>
          <span className="text-xs text-slate-500">{allowedIps.length} mục</span>
        </div>
        <div className="divide-y divide-slate-100">
          {allowedIps.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">Chưa có IP nào được thêm.</div>
          ) : (
            allowedIps.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">{item.ipRange}</span>
                  {item.description ? (
                    <span className="text-xs text-slate-500">{item.description}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {item.ipRange === currentIp ? (
                    <span className="text-xs text-emerald-600">(IP hiện tại)</span>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || loading || deletingId === item.id}
                    onClick={() => setDeleteCandidate(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm IP mới"
        description="Nhập IP (hoặc CIDR) bạn muốn thêm vào danh sách."
      >
        <div className="space-y-4">
          <Input
            value={addModalValue}
            onChange={(e) => setAddModalValue(e.target.value)}
            placeholder="192.168.1.0/24 hoặc 10.0.0.5"
          />
          {addModalError ? <p className="text-xs text-red-600">{addModalError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddConfirm} loading={adding}>
              Thêm
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => deleteCandidate && handleDelete(deleteCandidate.id)}
        title="Xác nhận xóa IP"
        description={
          deleteCandidate
            ? `Bạn có chắc chắn muốn xóa IP ${deleteCandidate.ipRange} khỏi danh sách?`
            : undefined
        }
        confirmText="Xóa"
        cancelText="Hủy"
        loading={deletingId !== null}
      />
    </div>
  );
}
