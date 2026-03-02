"use client";

import { Eye, EyeOff } from "lucide-react";

export const ProfileField = ({
  label,
  value,
  icon: Icon,
  fieldName,
  isSensitive = false,
  showSensitive = false,
  onToggleSensitive,
  variant = "default", // default | sensitive | readonly | info
}) => {
  const maskSensitiveField = (val, field) => {
    if (!val) return val;

    if (field === "email") {
      const parts = val.split("@");
      if (parts.length === 2) {
        const [localPart, domain] = parts;
        const maskedLocal =
          localPart.substring(0, 2) + "*".repeat(Math.max(0, localPart.length - 2));
        return `${maskedLocal}@${domain}`;
      }
    }

    if (field === "username") {
      return "*".repeat(Math.min(val.length, 12));
    }

    return "*".repeat(Math.min(val.length, 10));
  };

  const displayValue =
    isSensitive && !showSensitive ? maskSensitiveField(value, fieldName) : value || "-";

  const getVariantClasses = () => {
    switch (variant) {
      case "sensitive":
        return "bg-red-50 hover:bg-red-100";
      case "readonly":
        return "bg-slate-50 hover:bg-slate-100";
      case "info":
        return "bg-blue-50 hover:bg-blue-100";
      default:
        return "hover:bg-slate-50";
    }
  };

  return (
    <div
      className={`flex items-center justify-between py-3 px-4 border-b border-slate-200 last:border-0 transition-colors ${getVariantClasses()}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="font-medium text-slate-900 truncate break-words">
            {displayValue}
          </p>
        </div>
      </div>

      {isSensitive && value && (
        <button
          onClick={() => onToggleSensitive && onToggleSensitive(fieldName)}
          className="p-2 hover:bg-slate-300 hover:bg-opacity-30 rounded-lg transition-colors flex-shrink-0 ml-2"
          title={showSensitive ? "Ẩn trường" : "Hiển thị trường"}
          type="button"
        >
          {showSensitive ? (
            <EyeOff className="w-4 h-4 text-slate-500" />
          ) : (
            <Eye className="w-4 h-4 text-slate-500" />
          )}
        </button>
      )}
    </div>
  );
};

export default ProfileField;
