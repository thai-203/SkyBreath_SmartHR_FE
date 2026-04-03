import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_DISPLAY = {
  "not-started": {
    label: "CHƯA CHECK-IN",
    variant: "outline",
    dotClass: "bg-muted-foreground",
    badgeStyle: {},
  },
  "checked-in": {
    label: "CHECKED IN",
    variant: "default",
    dotClass: "bg-white animate-pulse",
    badgeStyle: { backgroundColor: "var(--success)", color: "#fff", border: "none" },
  },
  "checked-out": {
    label: "CHECKED OUT",
    variant: "secondary",
    dotClass: "bg-muted-foreground",
    badgeStyle: {},
  },
};

const AttendanceClock = ({ status }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  const dateStr = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const display = STATUS_DISPLAY[status];

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div
        className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground tabular-nums"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {timeStr}
      </div>
      <p className="text-sm text-muted-foreground">{dateStr}</p>
      <div className="flex items-center gap-2 mt-1">
        <Badge
          variant={display.variant}
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={display.badgeStyle}
        >
          <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", display.dotClass)} />
          {display.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{timezone}</span>
      </div>
    </div>
  );
};

export default AttendanceClock;