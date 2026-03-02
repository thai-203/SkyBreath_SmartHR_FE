"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";

export const ProfileSection = ({
  title,
  description,
  children,
  className = "",
}) => {
  return (
    <Card className={`border-slate-200 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-200 -mx-6 px-6">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
