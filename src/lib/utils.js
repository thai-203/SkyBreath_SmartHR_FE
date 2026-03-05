import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// export function formatDate(date) {
//   if (!date) return "-";
//   return new Date(date).toLocaleDateString("vi-VN");
// }

/**
 * Format date to Vietnamese locale
 * @param {string | Date} date - Date to format
 * @param {string} format - Format type: 'date', 'time', 'datetime', 'relative'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = "datetime") {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "-";

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: format !== "date" ? "2-digit" : undefined,
    minute: format !== "date" ? "2-digit" : undefined,
    second: format === "datetime" ? "2-digit" : undefined,
  });

  return formatter.format(dateObj);
}
