import api from './api';

export const settingsService = {
  getCategoryOrder:    ()              => api.get('/settings/category-order'),
  updateCategoryOrder: (categoryOrder) => api.put('/settings/category-order', { categoryOrder }),
  getCategoryImages:    ()               => api.get('/settings/category-images'),
  updateCategoryImages: (categoryImages) => api.put('/settings/category-images', { categoryImages }),
  getCategoryNames:     ()              => api.get('/settings/category-names'),
  updateCategoryNames:  (categoryNames) => api.put('/settings/category-names', { categoryNames }),
  getContact:          ()              => api.get('/settings/contact'),
  updateContact:       (data)          => api.put('/settings/contact', data),
  getSlideshow:        ()              => api.get('/settings/slideshow'),
  updateSlideshow:     (data)          => api.put('/settings/slideshow', data),
  getBusinessHours:    ()              => api.get('/settings/business-hours'),
  updateBusinessHours: (data)          => api.put('/settings/business-hours', data),
};
