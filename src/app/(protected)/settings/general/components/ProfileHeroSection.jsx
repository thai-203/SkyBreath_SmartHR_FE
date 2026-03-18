"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";

const BACKEND_URL = "http://localhost:3000";

export const ProfileHeroSection = ({ profile, loading }) => {
  const [imgError, setImgError] = useState(false);

  const avatarSrc = profile?.avatar?.startsWith("http")
    ? profile.avatar
    : `${BACKEND_URL}/${profile?.avatar}`;

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border border-green-300";
      case "LOCKED":
        return "bg-red-100 text-red-800 border border-red-300";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 border border-gray-300";
      case "DELETED":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-300";
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      ACTIVE: "Hoạt động",
      LOCKED: "Bị khóa",
      INACTIVE: "Không hoạt động",
      DELETED: "Đã xóa",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
        <CardContent className="py-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <Skeleton className="w-40 h-40 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-1/2 rounded" />
              <Skeleton className="h-6 w-2/3 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-sm">
      <CardContent className="py-8 px-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile?.avatar && !imgError ? (
              <Image
                src={avatarSrc}
                alt={profile.fullName || "Ảnh đại diện"}
                width={160}
                height={160}
                className="w-40 h-40 rounded-lg object-cover shadow-lg border-4 border-white"
                unoptimized
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-40 h-40 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 shadow-sm">
                <div className="text-center">
                  <div className="text-2xl mb-1">👤</div>
                  <span className="text-xs">Chưa có ảnh đại diện</span>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {profile?.fullName || "Chưa cập nhật"}
              </h1>

              <p className="text-lg text-blue-600 font-medium mb-4">
                {profile?.position?.name ||
                  profile?.position ||
                  "Chưa được giao chức vụ"}
              </p>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Phòng ban:</span>{" "}
                  {profile?.department?.name ||
                    profile?.department ||
                    "Chưa được phân công"}
                </p>

                <p>
                  <span className="font-semibold">Quản lý trực tiếp:</span>{" "}
                  {profile?.directManager?.name || "Chưa được phân công"}
                </p>
              </div>
            </div>

            {profile?.status && (
              <div className="pt-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  Trạng thái:
                </span>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                    profile.status,
                  )}`}
                >
                  {getStatusLabel(profile.status)}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
