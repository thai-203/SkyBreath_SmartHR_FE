"use client";

import { useState, useCallback } from "react";
import { timesheetsService } from "@/services/timesheets.service";
import { useToast } from "@/components/common/Toast";

/**
 * Shared hook for managing AttendanceDetailModal + ExcuseRequestModal state.
 * Used by both Data Management and Locking pages to avoid duplication.
 *
 * @param {Object} opts
 * @param {Function} opts.fetchTimesheets - callback to reload the timesheets list after an action
 * @param {boolean} [opts.canEdit=false] - whether the user can edit (for detail modal)
 */
export function useTimesheetDetail({ fetchTimesheets, canEdit = false }) {
    const [detailModal, setDetailModal] = useState({ open: false, data: null });
    const [excuseModal, setExcuseModal] = useState({ open: false, mode: 'view', date: '', employeeId: null, data: null });
    const { success, error: toastError } = useToast();

    const handleViewDetail = useCallback(async (timesheet) => {
        try {
            const res = await timesheetsService.getAttendanceDetails(timesheet.id);
            setDetailModal({ open: true, data: res?.data });
        } catch (err) {
            toastError("Lỗi khi tải chi tiết chấm công");
        }
    }, []);

    const reloadDetailModal = useCallback(async (id) => {
        try {
            const res = await timesheetsService.getAttendanceDetails(id);
            setDetailModal(prev => ({ ...prev, data: res?.data }));
        } catch { }
    }, []);

    const closeDetailModal = useCallback(() => {
        setDetailModal({ open: false, data: null });
    }, []);

    // --- Update handler (Data page) ---
    const handleDetailUpdate = useCallback(async (id, updateData) => {
        try {
            await timesheetsService.update(id, updateData);
            success("Cập nhật thành công");
            await reloadDetailModal(id);
            fetchTimesheets?.();
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi cập nhật");
            throw err;
        }
    }, [fetchTimesheets]);

    // --- Lock handler (Locking page) ---
    const handleDetailLock = useCallback(async (id) => {
        try {
            await timesheetsService.lock(id);
            success("Đã khóa bảng chấm công");
            fetchTimesheets?.();
            setDetailModal({ open: false, data: null });
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi khóa");
        }
    }, [fetchTimesheets]);

    // --- Excuse modals ---
    const handleViewExcuse = useCallback((excuseData, date) => {
        setExcuseModal({
            open: true,
            mode: 'view',
            data: excuseData,
            date,
            employeeId: detailModal.data?.timesheet?.employeeId
        });
    }, [detailModal.data]);

    const handleCreateExcuse = useCallback((date) => {
        setExcuseModal({
            open: true,
            mode: 'create',
            date,
            employeeId: detailModal.data?.timesheet?.employeeId,
            data: null
        });
    }, [detailModal.data]);

    const closeExcuseModal = useCallback(() => {
        setExcuseModal(prev => ({ ...prev, open: false }));
    }, []);

    const handleExcuseSuccess = useCallback(() => {
        if (detailModal.data?.timesheet?.id) {
            reloadDetailModal(detailModal.data.timesheet.id);
            fetchTimesheets?.();
        }
    }, [detailModal.data, fetchTimesheets]);

    return {
        // Detail modal
        detailModal,
        handleViewDetail,
        closeDetailModal,
        handleDetailUpdate,
        handleDetailLock,
        // Excuse modal
        excuseModal,
        handleViewExcuse,
        handleCreateExcuse,
        closeExcuseModal,
        handleExcuseSuccess,
    };
}
