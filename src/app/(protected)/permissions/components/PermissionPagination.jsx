'use client';

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";

export default function PermissionPagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => onPageChange(i)}
                            className="w-9 h-9 cursor-pointer"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            // Complex logic for ellipsis (optional, but good for "Wow" factor)
            pages.push(
                <PaginationItem key={1}>
                    <PaginationLink isActive={currentPage === 1} onClick={() => onPageChange(1)} className="w-9 h-9 cursor-pointer">1</PaginationLink>
                </PaginationItem>
            );

            if (currentPage > 3) pages.push(<PaginationEllipsis key="ell-1" />);

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(
                    <PaginationItem key={i}>
                        <PaginationLink isActive={currentPage === i} onClick={() => onPageChange(i)} className="w-9 h-9 cursor-pointer">{i}</PaginationLink>
                    </PaginationItem>
                );
            }

            if (currentPage < totalPages - 2) pages.push(<PaginationEllipsis key="ell-2" />);

            pages.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink isActive={currentPage === totalPages} onClick={() => onPageChange(totalPages)} className="w-9 h-9 cursor-pointer">{totalPages}</PaginationLink>
                </PaginationItem>
            );
        }
        return pages;
    };

    return (
        <Pagination className="mt-8 justify-end">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        label="Trước"
                    />
                </PaginationItem>

                {renderPageNumbers()}

                <PaginationItem>
                    <PaginationNext
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        label="Tiếp"
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
