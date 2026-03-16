"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const INVALID_DATE = "INVALID_DATE";

export const DateInput = forwardRef(function DateInput(
  {
    className,
    value,
    onChange,
    label,
    error,
    placeholder = "dd/mm/yyyy",
    minDate,
    maxDate,
    ...props
  },
  ref,
) {
  const isDate = value instanceof Date && isValid(value);

  const [inputText, setInputText] = useState(
    isDate ? format(value, "dd/MM/yyyy") : "",
  );

  const [open, setOpen] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(
    isDate ? value : new Date(),
  );

  const wrapperRef = useRef(null);

  const prevValueRef = useRef(value);

  useEffect(() => {
    const prev = prevValueRef.current;

    const prevIsDate = prev instanceof Date && isValid(prev);
    const nextIsDate = value instanceof Date && isValid(value);

    const changed =
      prevIsDate !== nextIsDate ||
      (prevIsDate && nextIsDate && !isSameDay(prev, value));

    if (changed) {
      setInputText(nextIsDate ? format(value, "dd/MM/yyyy") : "");
      setCurrentMonth(nextIsDate ? value : new Date());
    }

    prevValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const autoFormat = (raw) => {
    const digits = raw.replace(/\D/g, "");

    if (digits.length <= 2) return digits;

    if (digits.length <= 4) {
      return digits.slice(0, 2) + "/" + digits.slice(2);
    }

    return (
      digits.slice(0, 2) +
      "/" +
      digits.slice(2, 4) +
      "/" +
      digits.slice(4, 8)
    );
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;

    if (raw === "") {
      setInputText("");
      onChange?.(null);
      return;
    }

    const isDeleting = raw.length < inputText.length;

    let next = isDeleting ? raw : autoFormat(raw);

    setInputText(next);

    if (next.length === 10) {
      const parsed = parse(next, "dd/MM/yyyy", new Date());

      if (isValid(parsed)) {
        const blocked =
          (minDate && isBefore(parsed, minDate)) ||
          (maxDate && isAfter(parsed, maxDate));

        if (!blocked) {
          onChange?.(parsed);
          setCurrentMonth(parsed);
        } else {
          onChange?.(INVALID_DATE);
        }
      } else {
        onChange?.(INVALID_DATE);
      }
    } else {
      onChange?.(INVALID_DATE);
    }
  };

  const selectDate = (date) => {
    setInputText(format(date, "dd/MM/yyyy"));
    onChange?.(date);
    setCurrentMonth(date);
    setOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= monthEnd || rows.length < 6) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;

      const disabled =
        (minDate && isBefore(cloneDay, minDate)) ||
        (maxDate && isAfter(cloneDay, maxDate));

      const selected =
        value instanceof Date && isSameDay(cloneDay, value);

      days.push(
        <button
          key={format(cloneDay, "yyyy-MM-dd")}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && selectDate(cloneDay)}
          className={cn(
            "h-9 w-9 rounded-md text-sm flex items-center justify-center transition-colors",
            disabled && "opacity-40 cursor-not-allowed",
            selected
              ? "bg-indigo-500 text-white"
              : "hover:bg-indigo-50",
            isToday(cloneDay) && !selected
              ? "border border-indigo-500"
              : "border border-transparent",
            cloneDay.getMonth() !== currentMonth.getMonth() &&
              "text-slate-300",
          )}
        >
          {format(cloneDay, "d")}
        </button>,
      );

      day = addDays(day, 1);
    }

    rows.push(
      <div key={format(day, "yyyy-MM-dd")} className="grid grid-cols-7 gap-1">
        {days}
      </div>,
    );

    days = [];

    if (rows.length >= 6) break;
  }

  return (
    <div className="w-full space-y-1 relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          value={inputText}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          maxLength={10}
          inputMode="numeric"
          className={cn(
            "flex h-10 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-slate-200 focus-visible:ring-indigo-500",
            className,
          )}
          {...props}
        />

        <Calendar
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
          onClick={() => setOpen((prev) => !prev)}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 rounded-md hover:bg-slate-100"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm font-semibold text-slate-700">
              {format(currentMonth, "MMMM yyyy")}
            </span>

            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 rounded-md hover:bg-slate-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs text-slate-400 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="space-y-1">{rows}</div>
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
});