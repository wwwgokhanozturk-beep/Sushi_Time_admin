import api from './api';

export const userService = {
  getAdminUsers: (params = {}) =>
    api.get('/admin/users', { params }),
  // Who uses Sushi Time and from where: website / App Store / Play Market.
  getUserStats: (params = {}) =>
    api.get('/admin/user-stats', { params }),
  getUsers: (params = {}) =>
    api.get('/users', { params }),
  updateUser: (id, data) =>
    api.put(`/users/${id}`, data),
  // Role is a privileged change with its own endpoint — PUT /users/:id ignores it.
  updateUserRole: (id, role) =>
    api.patch(`/users/${id}/role`, { role }),
  deleteUser: (id) =>
    api.delete(`/users/${id}`),
};
