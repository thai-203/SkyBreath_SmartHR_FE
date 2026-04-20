const DAY_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getProgressDisplayMeta = (progress = {}, now = new Date()) => {
  if (progress.displayStatus) {
    return {
      status: progress.displayStatus,
      isOverdue: Boolean(progress.isOverdue),
      overdueDays: Number(progress.overdueDays || 0),
    };
  }

  const status = String(progress.overallStatus || "NOT_STARTED").toUpperCase();
  const expectedEndDate = toDateOnly(progress.expectedEndDate);
  const today = toDateOnly(now);

  if (!expectedEndDate || !today || status === "COMPLETED") {
    return {
      status,
      isOverdue: false,
      overdueDays: 0,
    };
  }

  if (today <= expectedEndDate) {
    return {
      status,
      isOverdue: false,
      overdueDays: 0,
    };
  }

  const overdueDays = Math.floor(
    (today.getTime() - expectedEndDate.getTime()) / DAY_MS,
  );
  return {
    status: "OVERDUE",
    isOverdue: true,
    overdueDays,
  };
};

export const getTaskOverdueMeta = (task = {}, now = new Date()) => {
  const status = String(task.status || "PENDING").toUpperCase();
  if (status === "COMPLETED") {
    return {
      isOverdue: false,
      overdueDays: 0,
    };
  }

  const dueDate = toDateOnly(task.dueDate);
  const today = toDateOnly(now);

  if (!dueDate || !today || today <= dueDate) {
    return {
      isOverdue: false,
      overdueDays: 0,
    };
  }

  const overdueDays = Math.floor(
    (today.getTime() - dueDate.getTime()) / DAY_MS,
  );
  return {
    isOverdue: true,
    overdueDays,
  };
};

export const canManagerEditPlan = (progress = {}) => {
  const status = String(progress.overallStatus || "").toUpperCase();
  return status === "NOT_STARTED";
};
