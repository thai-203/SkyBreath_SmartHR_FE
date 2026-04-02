import api from "@/lib/api";

const BASE_URL = "/attendance-allowed-ips";

export const attendanceAllowedIpService = {
  async listAllowedIps() {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  async createAllowedIp(payload) {
    const response = await api.post(BASE_URL, payload);
    return response.data;
  },

  async deleteAllowedIp(id) {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};
