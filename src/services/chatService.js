import api from './api';

export const chatService = {
  getThreads: (params = {}) => api.get('/chat/threads', { params }),
  getMessages: (threadId) => api.get(`/chat/threads/${threadId}/messages`),
  sendMessage: (threadId, text) => api.post(`/chat/threads/${threadId}/messages`, { text }),
  remove: (threadId) => api.delete(`/chat/threads/${threadId}`),
  // Opens the customer's thread, creating an empty one if they never wrote.
  startWithCustomer: (customerId) => api.post(`/chat/threads/customer/${customerId}`),
};
