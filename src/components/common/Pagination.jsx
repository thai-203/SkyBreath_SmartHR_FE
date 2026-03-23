"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export function Pagination({
    table,
    currentPage: controlledCurrentPage,
    totalPages: controlledTotalPages,
    onPageChange,
    siblingCount = 1,
}) {
    const tablePagination = table?.getState?.()?.pagination;
    const currentPage = tablePagination
        ? tablePagination.pageIndex + 1
        : (controlledCurrentPage ?? 1);
    const totalPages = table
        ? Math.max(table.getPageCount?.() || 1, 1)
        : Math.max(controlledTotalPages || 1, 1);

    const handlePageChange = (page) => {
        const nextPage = Math.min(Math.max(page, 1), totalPages);

        if (table) {
            table.setPageIndex(nextPage - 1);
        }

        onPageChange?.(nextPage);
    };

    const generatePagination = () => {
        const pages = [];

        // Always show first page
        pages.push(1);

        // Calculate range around current page
        const leftSibling = Math.max(2, currentPage - siblingCount);
        const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);

        // Add ellipsis after first page if needed
        if (leftSibling > 2) {
            pages.push("ellipsis-left");
        }

        // Add pages around current
        for (let i = leftSibling; i <= rightSibling; i++) {
            if (i !== 1 && i !== totalPages) {
                pages.push(i);
            }
        }

        // Add ellipsis before last page if needed
        if (rightSibling < totalPages - 1) {
            pages.push("ellipsis-right");
        }

        // Always show last page if more than 1 page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    const pages = generatePagination();

    return (
        <div className="flex items-center justify-center gap-1">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="gap-1 px-2.5"
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trước</span>
            </Button>

            <div className="flex items-center gap-1">
                {pages.map((page, index) => {
                    if (page === "ellipsis-left" || page === "ellipsis-right") {
                        return (
                            <span
                                key={page}
                                className="flex h-8 w-8 items-center justify-center text-slate-400"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </span>
                        );
                    }

                    return (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={cn(
                                "h-8 w-8 p-0",
                                currentPage === page && "pointer-events-none"
                            )}
                        >
                            {page}
                        </Button>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="gap-1 px-2.5"
            >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
