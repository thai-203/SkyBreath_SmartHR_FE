"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTION_TYPE_LABELS = {
  check_in: "Check-in",
  check_out: "Check-out",
  join: "Tham gia",
};

const ACTION_TYPE_COLORS = {
  check_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  check_out: "bg-blue-50 text-blue-700 border-blue-200",
  join: "bg-purple-50 text-purple-700 border-purple-200",
};

const STATUS_COLORS = {
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS = {
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

export function AttendanceLogsTable({ logs, onViewDetail }) {
  const formatTime = (time) => {
    if (!time) return "—";
    return new Date(time).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50 border-y border-border/40">
          <TableHead className="pl-6">Nhân viên</TableHead>
          <TableHead>Mã NV</TableHead>
          <TableHead>Loại hành động</TableHead>
          <TableHead className="text-center">Trạng thái</TableHead>
          <TableHead>Thời gian</TableHead>
          <TableHead className="pr-6 text-right">Chi tiết</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs?.map((log) => (
          <TableRow key={log.id} className="border-border/40">
            <TableCell className="pl-6 font-medium text-foreground">
              {log.empFullName ?? (
                <span className="text-muted-foreground italic text-xs">Không xác định</span>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {log.empCode ?? "—"}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={ACTION_TYPE_COLORS[log.actionType] ?? ""}
              >
                {ACTION_TYPE_LABELS[log.actionType] ?? log.actionType}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge
                variant="outline"
                className={STATUS_COLORS[log.status] ?? ""}
              >
                {STATUS_LABELS[log.status] ?? log.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatTime(log.time)}
            </TableCell>
            <TableCell className="pr-6 text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetail(log)}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Eye className="h-4 w-4 text-blue-500" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {(!logs || logs.length === 0) && (
          <TableRow>
            <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
              Không có log điểm danh nào.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
