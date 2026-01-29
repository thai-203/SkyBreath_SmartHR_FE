"use client";

import { useEffect } from "react";

export function PageTitle({ title }) {
    useEffect(() => {
        document.title = title ? `${title}` : "SmartHR - Hệ thống quản lý nhân sự";
    }, [title]);

    return null;
}
