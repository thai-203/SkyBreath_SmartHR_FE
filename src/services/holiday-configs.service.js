import api from "@/lib/api";

export const holidayConfigService = {
  async getConfig() {
    const response = await api.get('/holiday-configs');
    return response.data;
  },

  async updateConfig(data) {
    const response = await api.put('/holiday-configs', data);
    return response.data;
  },

  async triggerReminders() {
    const response = await api.post('/holiday-configs/trigger-reminders');
    return response.data;
  },

  async getGroups() {
    const response = await api.get('/holiday-groups');
    return response.data;
  },

  async getGroup(id) {
    const response = await api.get(`/holiday-groups/${id}`);
    return response.data;
  },

  async createGroup(data) {
    const response = await api.post('/holiday-groups', data);
    return response.data;
  },

  async updateGroup(id, data) {
    const response = await api.put(`/holiday-groups/${id}`, data);
    return response.data;
  },

  async deleteGroup(id) {
    const response = await api.delete(`/holiday-groups/${id}`);
    return response.data;
  },

  async inheritGroup(id, targetYear) {
    const response = await api.post(`/holiday-groups/${id}/inherit`, { targetYear });
    return response.data;
  },
};
