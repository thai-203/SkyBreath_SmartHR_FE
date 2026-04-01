"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Calendar, Clock, AlertTriangle, Info, UploadCloud } from "lucide-react";
import { differenceInMinutes, parse } from "date-fns";

export default function CreateOvertimeRequestPage() {
    const [formData, setFormData] = useState({
        date: "",
        startTime: "",
        endTime: "",
        overtimeTypeId: "",
        reason: "",
        approverId: "",
    });

    // Mock data for dropdowns
    const overtimeTypes = [
        { id: "1", name: "Ngày thường" },
        { id: "2", name: "Ngày nghỉ cuối tuần" },
        { id: "3", name: "Ngày lễ, Tết" }
    ];

    const approvers = [
        { id: "1", name: "Nguyễn Vân A" },
        { id: "2", name: "Trần Thị B" }
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Calculate total hours based on start and end times
    const calculateTotalHours = () => {
        if (!formData.startTime || !formData.endTime) return "0.0 giờ";
        
        try {
            const start = parse(formData.startTime, "HH:mm", new Date());
            const end = parse(formData.endTime, "HH:mm", new Date());
            
            let diffMins = differenceInMinutes(end, start);
            if (diffMins < 0) {
                // If end time is past midnight
                diffMins += 24 * 60;
            }
            
            const hours = diffMins / 60;
            return `${hours.toFixed(1)} giờ`;
        } catch (error) {
            return "0.0 giờ";
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        // UI Mock: Just prevent default behavior
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Đăng ký tăng ca
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="min-w-[100px] border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100">
                        Hủy
                    </Button>
                    <Button variant="outline" className="min-w-[100px] border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">
                        Lưu nháp
                    </Button>
                    <Button className="min-w-[100px] bg-[#4b208c] hover:bg-[#3d1973] text-white outline-none ring-0">
                        Gửi
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column (Main Form) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Thẻ 1: Thông tin tăng ca */}
                    <Card className="p-6 border-slate-200 shadow-sm rounded-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Thông tin tăng ca</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                            <div className="space-y-2 align-top">
                                <label className="block text-sm font-semibold text-slate-800">Ngày tăng ca</label>
                                <div className="relative">
                                    <Input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={(e) => handleChange("date", e.target.value)}
                                        className="pl-10 h-11 border-slate-200 rounded-lg text-slate-700" 
                                    />
                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            
                            <div className="space-y-2 align-top">
                                <label className="block text-sm font-semibold text-slate-800">Giờ bắt đầu</label>
                                <div className="relative">
                                    <Input 
                                        type="time" 
                                        value={formData.startTime}
                                        onChange={(e) => handleChange("startTime", e.target.value)}
                                        className="pl-10 h-11 border-slate-200 rounded-lg text-slate-700" 
                                    />
                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2 align-top">
                                <label className="block text-sm font-semibold text-slate-800">Giờ kết thúc</label>
                                <div className="relative">
                                    <Input 
                                        type="time" 
                                        value={formData.endTime}
                                        onChange={(e) => handleChange("endTime", e.target.value)}
                                        className="pl-10 h-11 border-slate-200 rounded-lg text-slate-700" 
                                    />
                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-800">Loại tăng ca</label>
                                <select
                                    value={formData.overtimeTypeId}
                                    onChange={(e) => handleChange("overtimeTypeId", e.target.value)}
                                    className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                >
                                    <option value="" disabled hidden>Ngày thường</option>
                                    {overtimeTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-800">Tổng số giờ</label>
                                <Input 
                                    value={calculateTotalHours()}
                                    readOnly
                                    className="bg-purple-50/50 border-purple-100 text-slate-700 font-medium h-11 focus-visible:ring-0"
                                />
                            </div>
                        </div>

                        {/* Info Summary Box */}
                        <div className="bg-[#fcfaff] rounded-xl p-4 flex gap-4 border border-purple-100">
                            <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-700 w-full">
                                <div>
                                    <p className="font-semibold text-slate-800 mb-1.5">Quy định áp dụng</p>
                                    <p>Hệ số lương: 150%</p>
                                </div>
                                <div className="space-y-1.5 sm:mt-[26px]">
                                    <p>• Tối đa/ngày: 4 giờ</p>
                                    <p>• Tối đa/tháng: 40 giờ</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Thẻ 2: Lý do & Phê duyệt */}
                    <Card className="p-6 border-slate-200 shadow-sm rounded-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Lý do & phê duyệt</h2>
                        
                        <div className="space-y-6">
                            <div className="space-y-2 relative">
                                <label className="block text-sm font-semibold text-slate-800">Lý do tăng ca</label>
                                <textarea
                                    className="w-full flex min-h-[110px] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 resize-none transition-all"
                                    placeholder="Ghi rõ lý do..."
                                    maxLength={400}
                                    value={formData.reason}
                                    onChange={(e) => handleChange("reason", e.target.value)}
                                />
                                <div className="absolute bottom-3 right-3 text-xs font-medium text-slate-400">
                                    {formData.reason.length}/400
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-800">Người duyệt</label>
                                <select
                                    value={formData.approverId}
                                    onChange={(e) => handleChange("approverId", e.target.value)}
                                    className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                >
                                    <option value="" disabled hidden>Nguyễn Vân A</option>
                                    {approvers.map(app => (
                                        <option key={app.id} value={app.id}>{app.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-800">Đính kèm minh chứng</label>
                                <div 
                                    className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onDrop={handleFileDrop}
                                    onDragOver={handleDragOver}
                                >
                                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform border border-slate-100">
                                        <UploadCloud className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 mb-1">
                                        Kéo thả tệp tin hoặc nhấp để chọn
                                    </p>
                                    <p className="text-xs font-medium text-slate-400 mt-2">
                                        PDF, JPG, PNG (Tối đa 5MB)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>

                {/* Right Column (Widget) */}
                <div className="lg:col-span-4 h-full">
                    <Card className="p-6 border-slate-200 shadow-sm rounded-xl sticky top-6">
                        <h3 className="text-base font-extrabold text-slate-900 mb-6">Tổng hợp</h3>
                        
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-medium">Tổng OT tháng này:</span>
                                <span className="font-bold text-slate-900">12 / 40 giờ</span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#4b208c] rounded-full transition-all duration-500" style={{ width: "30%" }}></div>
                            </div>
                        </div>

                        {/* Alert warning */}
                        <div className="bg-[#fffdfd] border border-red-100 rounded-lg p-3.5 text-sm flex gap-3 items-start shadow-sm">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" strokeWidth={2.5}/>
                            <p className="text-red-600 leading-relaxed font-medium">
                                Cảnh báo: Đã vượt quá 8 giờ tăng ca cho phép trong tuần này.
                            </p>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}
