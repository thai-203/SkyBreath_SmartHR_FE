import api from "@/lib/api";

export const onboardingsService = {
  // Plans
  getPlans: async (params = {}) => {
    const response = await api.get("/onboarding/plans", { params });
    return response.data;
  },

  getPlanById: async (id) => {
    const response = await api.get(`/onboarding/plans/${id}`);
    return response.data;
  },

  createPlan: async (data) => {
    const response = await api.post("/onboarding/plans", data);
    return response.data;
  },

  updatePlan: async (id, data) => {
    const response = await api.put(`/onboarding/plans/${id}`, data);
    return response.data;
  },

  deletePlan: async (id) => {
    const response = await api.delete(`/onboarding/plans/${id}`);
    return response.data;
  },

  getPlanStats: async (id) => {
    const response = await api.get(`/onboarding/plans/${id}/stats`);
    return response.data;
  },

  getPlansByDepartment: async (departmentId) => {
    const response = await api.get(`/onboarding/plans/department/${departmentId}`);
    return response.data;
  },

  getPlanTemplates: async () => {
    const response = await api.get("/onboarding/plans-templates/list");
    return response.data;
  },

  duplicatePlan: async (id) => {
    const response = await api.post(`/onboarding/plans/${id}/duplicate`);
    return response.data;
  },

  // Progress
  getProgress: async (params = {}) => {
    const response = await api.get("/onboarding/progress", { params });
    return response.data;
  },

  getProgressById: async (id) => {
    const response = await api.get(`/onboarding/progress/${id}`);
    return response.data;
  },

  getProgressStats: async () => {
    const response = await api.get("/onboarding/progress/stats/all");
    return response.data;
  },

  startOnboarding: async (data) => {
    const response = await api.post("/onboarding/progress/start", data);
    return response.data;
  },

  updateProgress: async (id, data) => {
    const response = await api.put(`/onboarding/progress/${id}`, data);
    return response.data;
  },

  completeProgress: async (id) => {
    const response = await api.put(`/onboarding/progress/${id}/complete`);
    return response.data;
  },

  pauseProgress: async (id) => {
    const response = await api.put(`/onboarding/progress/${id}/pause`);
    return response.data;
  },

  resumeProgress: async (id) => {
    const response = await api.put(`/onboarding/progress/${id}/resume`);
    return response.data;
  },

  getProgressByEmployee: async (employeeId) => {
    const response = await api.get(`/onboarding/progress/employee/${employeeId}`);
    return response.data;
  },

  getProgressByDepartment: async (departmentId) => {
    const response = await api.get(`/onboarding/progress/department/${departmentId}`);
    return response.data;
  },

  // Task Assignments
  getAssignments: async (params = {}) => {
    const response = await api.get("/onboarding/assignments", { params });
    return response.data;
  },

  getAssignmentById: async (id) => {
    const response = await api.get(`/onboarding/assignments/${id}`);
    return response.data;
  },

  getAssignmentStats: async () => {
    const response = await api.get("/onboarding/assignments/stats/all");
    return response.data;
  },

  createAssignment: async (data) => {
    const response = await api.post("/onboarding/assignments", data);
    return response.data;
  },

  updateAssignment: async (id, data) => {
    const response = await api.put(`/onboarding/assignments/${id}`, data);
    return response.data;
  },

  completeAssignment: async (id) => {
    const response = await api.put(`/onboarding/assignments/${id}/complete`);
    return response.data;
  },

  startAssignment: async (id) => {
    const response = await api.put(`/onboarding/assignments/${id}/start`);
    return response.data;
  },

  reassignAssignment: async (id, data) => {
    const response = await api.put(`/onboarding/assignments/${id}/reassign`, data);
    return response.data;
  },

  deleteAssignment: async (id) => {
    const response = await api.delete(`/onboarding/assignments/${id}`);
    return response.data;
  },

  getAssignmentsByProgress: async (progressId) => {
    const response = await api.get(`/onboarding/assignments/progress/${progressId}`);
    return response.data;
  },

  getAssignmentsByEmployee: async (employeeId) => {
    const response = await api.get(`/onboarding/assignments/employee/${employeeId}`);
    return response.data;
  },

  getAssignmentsByStatus: async (status) => {
    const response = await api.get(`/onboarding/assignments/status/${status}`);
    return response.data;
  },

  getOverdueAssignments: async () => {
    const response = await api.get("/onboarding/assignments/overdue");
    return response.data;
  },
};
