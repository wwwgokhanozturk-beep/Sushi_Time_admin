import api from './api';

export const settingsService = {
  getCategoryOrder:    ()              => api.get('/settings/category-order'),
  updateCategoryOrder: (categoryOrder) => api.put('/settings/category-order', { categoryOrder }),
  getContact:          ()              => api.get('/settings/contact'),
  updateContact:       (data)          => api.put('/settings/contact', data),
  getSlideshow:        ()              => api.get('/settings/slideshow'),
  updateSlideshow:     (data)          => api.put('/settings/slideshow', data),
};
