import api from "@/lib/api";

export const requestsService = {
    getLeaveCalendar: async (params = {}) => {
        const response = await api.get("/requests/leaves/calendar", { params });
        return response.data;
    },
};
