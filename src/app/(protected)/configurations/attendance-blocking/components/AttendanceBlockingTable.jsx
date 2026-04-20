import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/common/AuthGuard";

export const ERROR_TYPE_LABELS = {
  FACE: "Sai khuôn mặt",
  LOCATION: "Sai vị trí",
  NETWORK: "Mạng không hợp lệ",
};

export const ERROR_TYPE_COLORS = {
  FACE: "bg-destructive-10 text-destructive border-destructive-20",
  LOCATION: "bg-warning-10 text-warning border-warning-20",
  NETWORK: "bg-primary-10 text-primary border-primary-20",
};

export function AttendanceBlockingTable({ rules, onToggle, onEdit, onDelete }) {
  const formatDuration = (minutes) => {
    if (minutes === 0) return "Vĩnh viễn";
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}p` : `${h} giờ`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50 border-y border-border/40">
          <TableHead className="pl-6">Tên quy tắc</TableHead>
          <TableHead>Loại vi phạm</TableHead>
          <TableHead className="text-center">Giới hạn thử</TableHead>
          <TableHead className="text-center">Thời gian khóa</TableHead>
          <TableHead className="text-center">Trạng thái</TableHead>
          <TableHead className="pr-6 text-right">Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules?.map((rule) => (
          <TableRow key={rule?.id} className="border-border/40">
            <TableCell className="pl-6 font-medium text-foreground">
              {rule?.ruleName}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={ERROR_TYPE_COLORS[rule?.errorType]}
              >
                {ERROR_TYPE_LABELS[rule?.errorType]}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <span className="font-mono text-sm font-semibold text-foreground">
                {rule?.maxRetryLimit}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">lần</span>
            </TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">
              {formatDuration(rule?.blockDurationMinutes)}
            </TableCell>
            <TableCell className="text-center">
              <PermissionGate permission="ATTENDANCE_BLOCKING_CONFIG_STATUS_CHANGE" fallback={<Switch disabled checked={rule?.isActive} />}>
                <Switch
                  checked={rule?.isActive}
                  onCheckedChange={(checked) => onToggle(rule?.id, checked)}
                />
              </PermissionGate>
            </TableCell>
            <TableCell className="pr-6 text-right">
              <PermissionGate permission="ATTENDANCE_BLOCKING_CONFIG_UPDATE">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(rule)}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4 text-blue-500" />
                </Button>
              </PermissionGate>
              <PermissionGate permission="ATTENDANCE_BLOCKING_CONFIG_DELETE">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(rule?.id)}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </PermissionGate>
            </TableCell>
          </TableRow>
        ))}
        {rules?.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={6}
              className="py-12 text-center text-muted-foreground"
            >
              Chưa có quy tắc nào. Nhấn "Thêm quy tắc" để bắt đầu.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
