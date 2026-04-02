import api from "@/lib/api";

export const attendanceService = {
  getTodayContext: async () => {
    const response = await api.get("/attendance/today-context");
    return response.data;
  },

  checkIn: async (lat, lng, images) => {
    const formData = new FormData();
    formData.append("lat", lat);
    formData.append("lng", lng);
    images.forEach((blob, index) => {
      formData.append("frames", blob, `face_${index}.jpg`);
    });
    const response = await api.post("/attendance/check-in", formData);
    return response.data;
  },
  checkOut: async (lat, lng, images) => {
    const formData = new FormData();
    formData.append("lat", lat);
    formData.append("lng", lng);
    images.forEach((blob, index) => {
      formData.append("frames", blob, `face_${index}.jpg`);
    });
    const response = await api.post("/attendance/check-out", formData);
    return response.data;
  },
};
