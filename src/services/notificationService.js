import api from './api';

export const notificationService = {
  broadcast: (title, body) => api.post('/notifications/broadcast', { title, body }),
  // messages: { tr: { title, body }, ru: {…}, en: {…} }
  broadcastByLanguage: (messages) => api.post('/notifications/broadcast', { messages }),
  getAudience: () => api.get('/notifications/audience'),
  getHistory: (params) => api.get('/notifications', { params }),
};
