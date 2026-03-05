"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { userService } from "@/services";
import { Skeleton } from "./Skeleton";
import { User, Mail, Phone } from "lucide-react";

/**
 * Quick Profile Widget
 * Displays user profile summary in a compact card format
 * Can be used in dashboard, sidebar, or other layouts
 * 
 * @param {Object} props
 * @param {boolean} props.showAvatar - Show profile avatar (default: true)
 * @param {boolean} props.showContact - Show email and phone (default: false)
 * @param {string} props.size - Card size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onProfileClick - Callback when card is clicked
 */
export function ProfileWidget({ 
    showAvatar = true, 
    showContact = false,
    size = "md",
    className = "",
    onProfileClick 
}) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await userService.getProfile();
            setProfile(data.data || data);
        } catch (err) {
            console.error("Failed to load profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const sizeClasses = {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
    };

    const avatarClasses = {
        sm: "w-12 h-12",
        md: "w-16 h-16",
        lg: "w-24 h-24",
    };

    if (loading) {
        return (
            <div className={`${sizeClasses[size]} bg-white border border-slate-200 rounded-lg ${className}`}>
                <Skeleton className="h-6 w-32" />
                {showContact && (
                    <>
                        <Skeleton className="h-4 w-40 mt-2" />
                        <Skeleton className="h-4 w-36 mt-1" />
                    </>
                )}
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    const handleClick = () => {
        if (onProfileClick) {
            onProfileClick(profile);
        }
    };

    return (
        <Link href="/settings/general">
            <div 
                onClick={handleClick}
                className={`${sizeClasses[size]} bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer ${className}`}
            >
                <div className="flex items-center gap-4">
                    {showAvatar && profile.avatar && (
                        <img
                            src={profile.avatar}
                            alt={profile.name}
                            className={`${avatarClasses[size]} rounded-full object-cover flex-shrink-0`}
                        />
                    )}
                    {!showAvatar && profile.avatar && (
                        <div className={`${avatarClasses[size]} rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0`}>
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                            {profile.name}
                        </p>
                        {showContact && (
                            <div className="space-y-1 mt-2">
                                {profile.email && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{profile.email}</span>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{profile.phone}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {profile.department && (
                            <p className="text-xs text-slate-500 truncate mt-1">
                                {profile.department}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
