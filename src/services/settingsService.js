import api from './api';

export const settingsService = {
  getCategoryOrder:    ()             => api.get('/settings/category-order'),
  updateCategoryOrder: (categoryOrder) => api.put('/settings/category-order', { categoryOrder }),
};
