import api from "@/lib/api";

export const aiService = {
  chat: async (messages) => {
    const response = await api.post("/ai/chat", { messages });
    return response.data;
  },
};
