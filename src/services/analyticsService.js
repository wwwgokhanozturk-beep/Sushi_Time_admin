import api from './api';

export const analyticsService = {
  getAnalytics: (from, to) =>
    api.get('/admin/analytics', { params: { from, to } }),
  getAvailableMonths: () =>
    api.get('/admin/analytics/months'),
  getMonthlyAnalytics: (month) =>
    api.get('/admin/analytics/monthly', { params: { month } }),
};
