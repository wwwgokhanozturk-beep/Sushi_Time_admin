import api from './api';

export const chatService = {
  getThreads: (params = {}) => api.get('/chat/threads', { params }),
  getMessages: (threadId) => api.get(`/chat/threads/${threadId}/messages`),
  sendMessage: (threadId, text) => api.post(`/chat/threads/${threadId}/messages`, { text }),
};
