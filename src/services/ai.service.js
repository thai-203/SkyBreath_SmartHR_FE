import api from "@/lib/api";

export const aiService = {
  // ── Chat ─────────────────────────────────────────────────────────────────
  getStatus: async () => {
    const response = await api.get("/ai/status");
    return response.data;
  },

  chat: async (conversationId, content) => {
    const response = await api.post("/ai/chat", { conversationId, content });
    return response.data;
  },

  // ── Conversation management ───────────────────────────────────────────────
  getConversations: async () => {
    const response = await api.get("/ai/conversations");
    return response.data;
  },

  createConversation: async (title) => {
    const response = await api.post("/ai/conversations", { title });
    return response.data;
  },

  deleteConversation: async (id) => {
    const response = await api.delete(`/ai/conversations/${id}`);
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await api.get(`/ai/conversations/${conversationId}/messages`);
    return response.data;
  },
};
