"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";
import { cn } from "@/lib/utils";

// Tải react-quill động để tránh lỗi window is not defined lúc SSR
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <div className="h-64 mt-1 bg-slate-50 animate-pulse rounded-xl border border-slate-200"></div> });

export function RichTextEditor({ value, onChange, placeholder, className, error }) {
    const modules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ indent: "-1" }, { indent: "+1" }],
                [{ align: [] }],
                ["link", "image"],
                ["clean"],
            ],
        }),
        []
    );

    const formats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "color",
        "background",
        "list",
        "indent",
        "align",
        "link",
        "image",
    ];

    return (
        <div className={cn("rich-text-editor-wrapper", className, error && "has-error")}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className={cn(
                    "bg-white mt-1",
                    error ? "[&_.ql-container]:border-red-400 [&_.ql-container]:bg-red-50 [&_.ql-toolbar]:border-red-400 [&_.ql-toolbar]:bg-red-50/50" : "[&_.ql-container]:border-slate-200 [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50/50",
                    "[&_.ql-container]:rounded-b-xl [&_.ql-toolbar]:rounded-t-xl [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm"
                )}
            />
        </div>
    );
}
