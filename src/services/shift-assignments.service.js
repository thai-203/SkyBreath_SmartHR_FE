import api from "@/lib/api";

export const shiftAssignmentsService = {
  assignToEmployee: async (data) => {
    const response = await api.post("/shifts/assign", data);
    return response.data;
  },

  assignByDepartment: async (data) => {
    const response = await api.post("/shifts/assign/department", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/shifts/assign/${id}`, data);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/shifts/assign/${id}`);
    return response.data;
  },

  list: async (params = {}) => {
    const response = await api.get("/shifts/assignments", { params });
    return response.data;
  },

  preview: async (data) => {
    const response = await api.post("/shifts/assignments/preview", data);
    return response.data;
  },

  getSchedules: async (params = {}) => {
    const response = await api.get("/shifts/schedules", { params });
    return response.data;
  },

  getEmployeeSchedule: async (employeeId, startDate, endDate) => {
    const isDateRange =
      typeof startDate === "string" &&
      startDate.includes("-") &&
      typeof endDate === "string" &&
      endDate.includes("-");

    const params = isDateRange
      ? { startDate, endDate }
      : { month: startDate, year: endDate };

    const response = await api.get(`/shifts/schedule/employee/${employeeId}`, {
      params,
    });
    return response.data;
  },

  getDepartmentSchedule: async (departmentId, month, year) => {
    const response = await api.get(
      `/shifts/schedule/department/${departmentId}`,
      { params: { month, year } },
    );
    return response.data;
  },
};
