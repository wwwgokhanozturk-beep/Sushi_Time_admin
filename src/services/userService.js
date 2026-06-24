import api from './api';

export const userService = {
  getAdminUsers: (params = {}) =>
    api.get('/admin/users', { params }),
  getUsers: (params = {}) =>
    api.get('/users', { params }),
  updateUser: (id, data) =>
    api.put(`/users/${id}`, data),
  deleteUser: (id) =>
    api.delete(`/users/${id}`),
};
