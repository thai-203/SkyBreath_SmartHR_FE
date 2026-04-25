"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Upload, FileText, FileSpreadsheet, Image, File, X, Download,
    Loader2, Paperclip, AlertCircle, CheckCircle2, Trash2,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { toast } from "sonner";
import { payrollService } from "@/services/payroll.service";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".webp", ".txt"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const FILE_ICONS = {
    "application/pdf": { icon: FileText, color: "text-red-500", bg: "bg-red-50", label: "PDF" },
    "application/msword": { icon: FileText, color: "text-blue-600", bg: "bg-blue-50", label: "DOC" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: FileText, color: "text-blue-600", bg: "bg-blue-50", label: "DOCX" },
    "application/vnd.ms-excel": { icon: FileSpreadsheet, color: "text-emerald-600", bg: "bg-emerald-50", label: "XLS" },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { icon: FileSpreadsheet, color: "text-emerald-600", bg: "bg-emerald-50", label: "XLSX" },
};

const getFileIcon = (mimeType) => {
    if (!mimeType) return { icon: File, color: "text-slate-400", bg: "bg-slate-50", label: "FILE" };
    if (mimeType.startsWith("image/")) return { icon: Image, color: "text-indigo-500", bg: "bg-indigo-50", label: "IMG" };
    return FILE_ICONS[mimeType] || { icon: File, color: "text-slate-400", bg: "bg-slate-50", label: "FILE" };
};

const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const validateFiles = (files) => {
    const valid = [];
    const errors = [];
    for (const f of files) {
        const ext = "." + f.name.split(".").pop().toLowerCase();
        if (!ALLOWED_EXTS.includes(ext)) {
            errors.push(`"${f.name}": loại file không được phép (${ext})`);
        } else if (f.size > MAX_FILE_SIZE) {
            errors.push(`"${f.name}": vượt quá 20MB`);
        } else {
            valid.push(f);
        }
    }
    return { valid, errors };
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PayrollAttachments — Quản lý file đính kèm cho bảng lương
 * Props:
 *   - payrollId: number           (required)
 *   - isLocked: boolean           (khi LOCKED, ẩn upload/xóa)
 *   - canEdit: boolean            (phân quyền từ parent)
 */
export default function PayrollAttachments({ payrollId, isLocked = false, canEdit = true }) {
    const [attachments, setAttachments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [pendingFiles, setPendingFiles] = useState([]); // files đã chọn nhưng chưa upload
    const inputRef = useRef(null);

    const canUpload = canEdit && !isLocked;

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchAttachments = useCallback(async () => {
        if (!payrollId) return;
        try {
            setIsLoading(true);
            const res = await payrollService.getAttachments(payrollId);
            setAttachments(res?.data || res || []);
        } catch (err) {
            console.error("[PayrollAttachments] fetch error", err);
            toast.error("Không thể tải danh sách file đính kèm.");
        } finally {
            setIsLoading(false);
        }
    }, [payrollId]);

    useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

    // ── File picking / dragging ───────────────────────────────────────────────
    const handleFilePick = (rawFiles) => {
        if (!canUpload) return;
        const filesArr = Array.from(rawFiles);
        const { valid, errors } = validateFiles(filesArr);
        if (errors.length > 0) {
            errors.forEach((e) => toast.error(e));
        }
        if (valid.length > 0) {
            setPendingFiles((prev) => {
                // Loại trùng tên
                const existing = new Set(prev.map((f) => f.name));
                return [...prev, ...valid.filter((f) => !existing.has(f.name))];
            });
        }
    };

    const removePending = (name) => {
        setPendingFiles((prev) => prev.filter((f) => f.name !== name));
    };

    // Drag & Drop handlers
    const onDragOver = (e) => { e.preventDefault(); if (canUpload) setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (canUpload) handleFilePick(e.dataTransfer.files);
    };

    // ── Upload ────────────────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (pendingFiles.length === 0) return;
        if (pendingFiles.length > 5) {
            toast.error("Chỉ được upload tối đa 5 file mỗi lần.");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading(`Đang tải lên ${pendingFiles.length} file...`);
        try {
            await payrollService.uploadAttachments(payrollId, pendingFiles);
            toast.dismiss(toastId);
            toast.success(`Đã tải lên ${pendingFiles.length} file thành công!`);
            setPendingFiles([]);
            await fetchAttachments();
        } catch (err) {
            toast.dismiss(toastId);
            const msg = err?.response?.data?.message || "Lỗi khi tải lên file.";
            toast.error(msg);
        } finally {
            setIsUploading(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (attachment) => {
        if (!canUpload) return;
        if (!window.confirm(`Bạn có chắc muốn xóa file "${attachment.fileName}"?`)) return;

        setDeletingId(attachment.id);
        try {
            await payrollService.deleteAttachment(payrollId, attachment.id);
            toast.success(`Đã xóa file "${attachment.fileName}"`);
            setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
        } catch (err) {
            toast.error(err?.response?.data?.message || "Không thể xóa file. Vui lòng thử lại.");
        } finally {
            setDeletingId(null);
        }
    };

    // ── Download ──────────────────────────────────────────────────────────────
    const handleDownload = async (attachment) => {
        setDownloadingId(attachment.id);
        try {
            await payrollService.downloadAttachment(payrollId, attachment.id, attachment.fileName);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Không thể tải file. Vui lòng thử lại.");
        } finally {
            setDownloadingId(null);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">

            {/* Drop Zone (ẩn khi không có quyền hoặc LOCKED) */}
            {canUpload && (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all select-none
                        ${isDragging
                            ? "border-indigo-400 bg-indigo-50/80 scale-[1.01]"
                            : "border-slate-200 bg-slate-50/30 hover:border-indigo-300 hover:bg-indigo-50/30"
                        }`}
                >
                    <div className={`p-4 rounded-2xl transition-colors ${isDragging ? "bg-indigo-100" : "bg-white shadow-sm border border-slate-100"}`}>
                        <Upload className={`h-7 w-7 transition-colors ${isDragging ? "text-indigo-600" : "text-slate-400"}`} />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-700 text-sm">
                            {isDragging ? "Thả file vào đây..." : "Kéo & thả file hoặc click để chọn"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            PDF, Word, Excel, ảnh — tối đa 20MB / file, 5 file / lần
                        </p>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={ALLOWED_EXTS.join(",")}
                        className="hidden"
                        onChange={(e) => { handleFilePick(e.target.files); e.target.value = ""; }}
                    />
                </div>
            )}

            {/* Pending files (chưa upload) */}
            {pendingFiles.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[12px] font-bold text-amber-700 uppercase tracking-wide">
                            {pendingFiles.length} file sẵn sàng tải lên
                        </p>
                        <Button
                            size="sm"
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold text-white"
                        >
                            {isUploading
                                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...</>
                                : <><Upload className="h-3.5 w-3.5" /> Tải lên</>
                            }
                        </Button>
                    </div>
                    {pendingFiles.map((f) => {
                        const iconInfo = getFileIcon(f.type);
                        const Icon = iconInfo.icon;
                        return (
                            <div key={f.name} className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-amber-100 shadow-sm">
                                <div className={`p-1.5 rounded-lg ${iconInfo.bg}`}>
                                    <Icon className={`h-4 w-4 ${iconInfo.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 truncate">{f.name}</p>
                                    <p className="text-[10px] text-slate-400">{formatSize(f.size)}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removePending(f.name); }}
                                    className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Uploaded attachments list */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-400 italic">Đang tải danh sách file...</p>
                </div>
            ) : attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-slate-50/30 border border-dashed border-slate-100">
                    <Paperclip className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400 font-medium">Chưa có file đính kèm nào</p>
                    {canUpload && (
                        <p className="text-[11px] text-slate-300 mt-1">Kéo thả hoặc click vào vùng trên để thêm file</p>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-3">
                        {attachments.length} file đính kèm
                    </p>
                    {attachments.map((att) => {
                        const iconInfo = getFileIcon(att.mimeType);
                        const Icon = iconInfo.icon;
                        const isDeleting = deletingId === att.id;
                        const isDownloading = downloadingId === att.id;
                        const uploadDate = att.createdAt
                            ? new Date(att.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                            : "—";

                        return (
                            <div
                                key={att.id}
                                className="group flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
                            >
                                {/* Icon */}
                                <div className={`flex-shrink-0 p-2.5 rounded-xl ${iconInfo.bg} transition-colors`}>
                                    <Icon className={`h-5 w-5 ${iconInfo.color}`} />
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{att.fileName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                            {iconInfo.label}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{formatSize(att.fileSize)}</span>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <span className="text-[10px] text-slate-400">{uploadDate}</span>
                                        {att.uploadedByName && (
                                            <>
                                                <span className="text-[10px] text-slate-300">•</span>
                                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                                    {att.uploadedByName}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Download */}
                                    <button
                                        onClick={() => handleDownload(att)}
                                        disabled={isDownloading}
                                        title="Tải xuống"
                                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                    >
                                        {isDownloading
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Download className="h-4 w-4" />
                                        }
                                    </button>

                                    {/* Delete (chỉ khi có quyền và chưa LOCKED) */}
                                    {canUpload && (
                                        <button
                                            onClick={() => handleDelete(att)}
                                            disabled={isDeleting}
                                            title="Xóa file"
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            {isDeleting
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <Trash2 className="h-4 w-4" />
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Locked notice */}
            {isLocked && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-[12px] text-amber-700 font-medium">
                        Bảng lương đã bị khóa — chỉ có thể xem và tải file, không thể thêm hoặc xóa.
                    </p>
                </div>
            )}
        </div>
    );
}
