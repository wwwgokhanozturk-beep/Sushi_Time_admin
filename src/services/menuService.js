import api from './api';

export const menuService = {
  getAll:    (params) => api.get('/menu', { params }),
  getById:   (id)     => api.get(`/menu/${id}`),
  create:    (data)   => api.post('/menu', data),
  update:    (id, data) => api.put(`/menu/${id}`, data),
  remove:    (id)     => api.delete(`/menu/${id}`),
  categories:()       => api.get('/menu/categories'),
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
