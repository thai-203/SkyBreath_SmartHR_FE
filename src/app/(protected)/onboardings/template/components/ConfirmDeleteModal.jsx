"use client";

import React from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  loading = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        {/* Nút đóng góc trên */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon cảnh báo */}
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-2">Xác nhận xóa mẫu</h3>
          <p className="text-slate-500 leading-relaxed mb-8">
            Bạn có chắc chắn muốn xóa quy trình <span className="font-bold text-slate-700">"{title}"</span>? 
            Dữ liệu này sẽ biến mất vĩnh viễn và không thể phục hồi lại được.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              {loading ? "Đang xóa..." : "Xác nhận xóa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}