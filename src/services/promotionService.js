import api from './api';

export const promotionService = {
  getAll:    ()           => api.get('/promotions/all'),
  getById:   (id)         => api.get(`/promotions/${id}`),
  create:    (data)       => api.post('/promotions', data),
  update:    (id, data)   => api.put(`/promotions/${id}`, data),
  remove:    (id)         => api.delete(`/promotions/${id}`),
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
