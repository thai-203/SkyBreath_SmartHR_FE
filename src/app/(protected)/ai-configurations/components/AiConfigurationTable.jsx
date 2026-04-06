"use client";

import { Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/common/Button";

function maskToken(token) {
    if (!token) return "";
    if (token.length <= 8) return "********";
    return token.substring(0, 4) + "********" + token.substring(token.length - 4);
}

export default function AiConfigurationTable({
    data,
    loading,
    onEdit,
    onDelete,
}) {
    if (loading) {
        return <div className="text-center py-6 text-slate-500">Đang tải dữ liệu...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="text-center py-6 text-slate-500">Chưa có cấu hình AI nào.</div>;
    }

    return (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 font-medium">Key định danh</th>
                            <th className="px-4 py-3 font-medium">Model</th>
                            <th className="px-4 py-3 font-medium">Giá trị (Token)</th>
                            <th className="px-4 py-3 font-medium">Mô tả</th>
                            <th className="px-4 py-3 font-medium">Trạng thái</th>
                            <th className="px-4 py-3 font-medium text-center">Người cập nhật</th>
                            <th className="px-4 py-3 font-medium text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-medium text-slate-900">{item.configKey}</td>
                                <td className="px-4 py-3 text-slate-600">{item.aiModel || "-"}</td>
                                <td className="px-4 py-3">
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        {maskToken(item.configValue)}
                                    </code>
                                </td>
                                <td className="px-4 py-3 truncate max-w-[200px]" title={item.description}>
                                    {item.description || "-"}
                                </td>
                                <td className="px-4 py-3">
                                    {item.status === 'ACTIVE' ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> ACTIVE
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20">
                                            <XCircle className="w-3 h-3 mr-1" /> INACTIVE
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {item.updaterName || item.creatorName || "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(item)}
                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                            title="Sửa"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(item)}
                                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            title="Xóa"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
