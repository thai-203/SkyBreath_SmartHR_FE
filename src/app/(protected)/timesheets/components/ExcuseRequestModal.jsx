"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Upload, Check, ExternalLink } from "lucide-react";
import { requestsService } from "@/services/requests.service";
import { toast } from "sonner";

/**
 * mode: 'view' | 'create'
 * date: string (e.g. "18/02/2026") used for create
 * employeeId: number (used for create)
 * data: { status, content: { reason, proofImage } } (used for view)
 */
export default function ExcuseRequestModal({
    isOpen,
    onClose,
    onSuccess,
    mode = "view",
    date,
    employeeId,
    data,
    canEdit = false
}) {
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        defaultValues: {
            reason: ""
        }
    });

    // Reset when modal opens/closes
    if (!isOpen && (file || previewUrl || submitting)) {
        setFile(null);
        setPreviewUrl(null);
        reset();
    }

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        } else {
            setFile(null);
            setPreviewUrl(null);
        }
    };
    
    // Create Mode logic
    const onSubmit = async (formData) => {
        if (!file && !formData.reason) {
            toast.error("Vui lòng nhập lý do hoặc đính kèm ảnh");
            return;
        }

        setSubmitting(true);
        try {
            let proofImage = "";
            if (file) {
                const uploadRes = await requestsService.uploadImage(file);
                if (uploadRes?.data?.url) {
                   proofImage = uploadRes.data.url;
                } else if (uploadRes?.url) {
                   proofImage = uploadRes.url;
                }
            }

            // Convert DD/MM/YYYY to YYYY-MM-DD for API
            const [day, month, year] = date.split("/");
            const isoDate = `${year}-${month}-${day}`;

            await requestsService.create({
                employeeId,
                requestType: "LATE_EARLY_EXCUSE",
                startDate: isoDate,
                endDate: isoDate,
                requestContent: {
                    reason: formData.reason,
                    proofImage: proofImage
                }
            });

            toast.success("Đã gửi đơn giải trình thành công");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Gửi đơn lỗi:", error);
            toast.error(error.response?.data?.message || "Lỗi tạo đơn");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!data?.id) return;
        setSubmitting(true);
        try {
            await requestsService.updateStatus(data.id, status);
            toast.success(status === 'APPROVED' ? 'Đã duyệt đơn' : 'Đã từ chối đơn');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Lỗi duyệt đơn:", error);
            toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    if (mode === "view" && data) {
        const { status, content } = data;
        const statusColors = {
            'APPROVED': 'text-emerald-600 bg-emerald-50 border-emerald-200',
            'REJECTED': 'text-rose-600 bg-rose-50 border-rose-200',
            'PENDING': 'text-amber-600 bg-amber-50 border-amber-200'
        };
        const statusTexts = {
            'APPROVED': 'Đã duyệt',
            'REJECTED': 'Từ chối',
            'PENDING': 'Chờ duyệt'
        };

        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
        const absoluteImageUrl = content?.proofImage?.startsWith('http') ? content.proofImage : `${apiUrl}${content?.proofImage}`;

        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết Đơn giải trình">
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Trạng thái:</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status] || 'bg-slate-100 text-slate-700'}`}>
                            {statusTexts[status] || status}
                        </span>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Lý do:</p>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 break-words whitespace-pre-wrap">
                            {content?.reason || <span className="text-slate-400 italic">Không có lý do</span>}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Ảnh bằng chứng:</p>
                        {content?.proofImage ? (
                            <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                                <img
                                    src={absoluteImageUrl}
                                    alt="Proof"
                                    className="max-h-[300px] max-w-full object-contain rounded"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <a 
                                    href={absoluteImageUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="absolute bottom-2 right-2 p-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-md shadow-sm backdrop-blur border border-slate-200"
                                    title="Mở ảnh kích thước lớn"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        ) : (
                            <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-sm text-slate-500 bg-slate-50">
                                Không có ảnh đính kèm
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    {canEdit && status === 'PENDING' && (
                        <>
                            <Button 
                                onClick={() => handleUpdateStatus('REJECTED')} 
                                variant="outline" 
                                className="text-rose-600 border-rose-200 hover:bg-rose-50" 
                                disabled={submitting}
                            >
                                Từ chối
                            </Button>
                            <Button 
                                onClick={() => handleUpdateStatus('APPROVED')} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" 
                                loading={submitting}
                            >
                                Phê duyệt
                            </Button>
                        </>
                    )}
                    <Button onClick={onClose} variant="outline">
                        Đóng
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gửi đơn giải trình ngày ${date}`}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700">
                    <p>Việc gửi đơn sẽ gửi yêu cầu duyệt tới Nhân sự/Quản lý. Nếu được Duyệt, thời gian <strong>Đi muộn / Về sớm</strong> của ngày này sẽ được xóa phạt nguyên vẹn.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lý do</label>
                    <textarea
                        {...register("reason", { required: "Vui lòng nhập lý do" })}
                        rows={3}
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${errors.reason ? 'border-rose-300' : 'border-slate-300'}`}
                        placeholder="Vd: Quẹt thẻ muộn do kẹt xe ở ngã tư..."
                    />
                    {errors.reason && <p className="text-xs text-rose-500 mt-1">{errors.reason.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh bằng chứng (Tùy chọn)</label>
                    <div className="flex flex-col gap-2">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 overflow-hidden relative">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-6 h-6 mb-2 text-slate-500" />
                                    <p className="text-xs text-slate-500 text-center px-2">Nhấn để tải lên ảnh chụp (tối đa 5MB)</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-200">
                    <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button type="submit" loading={submitting} className="gap-2">
                        <Check className="w-4 h-4" />
                        Gửi Yêu Cầu
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
