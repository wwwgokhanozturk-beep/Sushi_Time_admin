import api from './api';

export const analyticsService = {
  getAnalytics: (from, to) =>
    api.get('/admin/analytics', { params: { from, to } }),
};
