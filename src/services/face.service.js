import api from "@/lib/api";

const BASE_URL = "/face";

export const faceService = {
  async registerFaces(employeeId, images) {
    const formData = new FormData();

    formData.append("employeeId", employeeId);

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

  async getRegisteredFaces(employeeId) {
    const response = await api.get(`${BASE_URL}/registered`, {
      params: { employeeId },
    });
    return response.data;
  },

  async getAllFaces() {
    const response = await api.get(`${BASE_URL}`);
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
};
