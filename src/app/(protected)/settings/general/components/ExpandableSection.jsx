"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";

export const ExpandableSection = ({
  title,
  children,
  defaultOpen = false,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="bg-slate-50 border-slate-200 shadow-sm">
      <CardHeader
        className="cursor-pointer hover:bg-slate-100 transition-colors py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {icon && <span className="text-lg">{icon}</span>}
              {title}
            </CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-500 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="divide-y divide-slate-200 -mx-6 px-6">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ExpandableSection;
