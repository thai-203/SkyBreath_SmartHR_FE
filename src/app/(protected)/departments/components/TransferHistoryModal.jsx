"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Table, THead, TBody, TR, TH, TD } from "@/components/common/Table";
import { Pagination } from "@/components/common/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { departmentTransfersService } from "@/services";
import { format } from "date-fns";

export default function TransferHistoryModal({ isOpen, onClose }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await departmentTransfersService.getAll({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
            });
            setData(response.items || []);
            setTotalPages(response.totalPages || 1);
            setTotal(response.total || 0);
        } catch (err) {
            console.error("Lỗi khi lấy lịch sử:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, pagination.pageIndex, pagination.pageSize]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="3xl"
            title="Lịch sử chuyển phòng ban"
            description="Lịch sử chi tiết các lần thuyên chuyển nhân sự"
        >
            <div className="mt-4 space-y-4">
                <Table>
                    <THead>
                        <TR>
                            <TH>Mã chuyển</TH>
                            <TH>Ngày hiệu lực</TH>
                            <TH>Phòng ban nguồn</TH>
                            <TH>Phòng ban đích</TH>
                            <TH>Số NV</TH>
                            <TH>Người thực hiện</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TR key={i}>
                                    <TD><Skeleton className="h-4 w-24" /></TD>
                                    <TD><Skeleton className="h-4 w-24" /></TD>
                                    <TD><Skeleton className="h-4 w-32" /></TD>
                                    <TD><Skeleton className="h-4 w-32" /></TD>
                                    <TD><Skeleton className="h-4 w-12" /></TD>
                                    <TD><Skeleton className="h-4 w-32" /></TD>
                                </TR>
                            ))
                        ) : data.length === 0 ? (
                            <TR>
                                <TD colSpan="6" className="text-center py-8 text-slate-500">
                                    Chưa có lịch sử chuyển phòng ban
                                </TD>
                            </TR>
                        ) : (
                            data.map((item) => (
                                <TR key={item.id}>
                                    <TD className="font-medium text-indigo-600">{item.transferCode}</TD>
                                    <TD>{format(new Date(item.effectiveDate), 'dd/MM/yyyy')}</TD>
                                    <TD>{item.fromDepartment?.departmentName || '-'}</TD>
                                    <TD>{item.toDepartment?.departmentName || '-'}</TD>
                                    <TD className="font-semibold text-slate-700">{item.totalEmployees}</TD>
                                    <TD>{item.transferredByUser?.username || '-'}</TD>
                                </TR>
                            ))
                        )}
                    </TBody>
                </Table>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-sm text-slate-500">
                        Hiển thị {data.length} / Trang {pagination.pageIndex + 1} của {totalPages}
                    </span>
                    <Pagination
                        currentPage={pagination.pageIndex + 1}
                        totalPages={totalPages}
                        onPageChange={(page) => setPagination(prev => ({ ...prev, pageIndex: page - 1 }))}
                    />
                </div>
            </div>
        </Modal>
    );
}
