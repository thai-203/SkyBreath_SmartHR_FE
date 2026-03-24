import api from "@/lib/api";

export const overtimeTypesService = {
    getAll: async () => {
        const response = await api.get("/overtime-types");
        return response.data;
    },
};
