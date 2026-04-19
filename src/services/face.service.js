import api from "@/lib/api";

const BASE_URL = "/face";

export const faceService = {
  async registerFaces(images) {
    const formData = new FormData();
    images.forEach((blob, index) => {
      formData.append("images", blob, `face_${index}.jpg`);
    });
    const response = await api.post(`${BASE_URL}/register-faces`, formData);
    return response.data;
  },

  async checkIn(imageBlob) {
    const formData = new FormData();
    formData.append("image", imageBlob, "face.jpg");

    const response = await api.post(`${BASE_URL}/checkin`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getRegisteredFaces() {
    const response = await api.get(`${BASE_URL}/registered`);
    return response.data;
  },

  async getAllFaces(params = {}) {
    const response = await api.get(`${BASE_URL}`, { params });
    return response.data;
  },

  getByEmployeeId: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async deleteFace(id) {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  async deleteFacesByEmployee(employeeId) {
    const response = await api.delete(`${BASE_URL}/employee/${employeeId}`);
    return response.data;
  },

  async getFaceManagementMetaData() {
    const response = await api.get(`${BASE_URL}/management/meta-data`);
    return response.data;
  },
};
