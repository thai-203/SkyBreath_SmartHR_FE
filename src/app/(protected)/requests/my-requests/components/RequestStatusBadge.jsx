"use client";

import { CheckCircle, Clock, XCircle, RotateCcw, FileEdit } from "lucide-react";

const STATUS_CONFIG = {
    DRAFT:     { label: "Nháp",       bg: "bg-gray-100",   text: "text-gray-600",   Icon: FileEdit },
    PENDING:   { label: "Chờ duyệt",  bg: "bg-yellow-100", text: "text-yellow-700", Icon: Clock },
    APPROVED:  { label: "Đã duyệt",   bg: "bg-green-100",  text: "text-green-700",  Icon: CheckCircle },
    REJECTED:  { label: "Từ chối",    bg: "bg-red-100",    text: "text-red-700",    Icon: XCircle },
    CANCELLED: { label: "Đã hủy",     bg: "bg-gray-100",   text: "text-gray-400",   Icon: XCircle },
    REVOKED:   { label: "Hủy duyệt",  bg: "bg-orange-100", text: "text-orange-700", Icon: RotateCcw },
};

export default function RequestStatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600", Icon: Clock };
    const { label, bg, text, Icon } = cfg;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    );
}
