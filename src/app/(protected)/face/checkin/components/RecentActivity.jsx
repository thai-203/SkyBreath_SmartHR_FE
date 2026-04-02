import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogIn, LogOut } from "lucide-react";

function formatDateTime(value) {
  const date = new Date(value);
  if (isNaN(date)) return "--";

  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  if (isToday) {
    return `Hôm nay, ${time}`;
  }

  const datePart = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "short",
  }).format(date);

  return `${datePart}, ${time}`;
}
const RecentActivity = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">Chưa có hoạt động nào hôm nay</p>
        <p className="text-xs mt-1">Nhấn Check-in để bắt đầu</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hoạt động</TableHead>
          <TableHead>Thời gian</TableHead>
          <TableHead className="hidden sm:table-cell">Thiết bị</TableHead>
          <TableHead className="text-right">Trạng thái</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((a, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="flex items-center gap-2">
                {a.actionType === "check_in" ? (
                  <LogIn className="h-4 w-4 text-[var(--success)]" />
                ) : (
                  <LogOut className="h-4 w-4 text-[var(--warning)]" />
                )}
                <span className="font-medium text-sm">
                  {a.actionType === "check_in" ? "Check In" : "Check Out"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDateTime(a.createdAt)}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
              {a.deviceInfo?.device || "Không xác định"}
            </TableCell>
            <TableCell className="text-right">
              <Badge
                className={`inline-flex justify-center items-center min-w-[110px] px-2.5 py-0.5 rounded-full text-xs font-medium
      ${
        a.status === "SUCCESS"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
              >
                {a.status === "SUCCESS" ? "Thành công" : "Thất bại"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RecentActivity;
