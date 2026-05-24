import api from './api';

export const notificationService = {
  broadcast: (title, body) => api.post('/notifications/broadcast', { title, body }),
  getHistory: (params) => api.get('/notifications', { params }),
};
