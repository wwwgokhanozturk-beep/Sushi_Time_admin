import api from './api';

export const orderService = {

  getAll:        (params) => api.get('/orders', { params }),
  getById:       (id)     => api.get(`/orders/${id}`),
  updateStatus:  (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancel:        (id)     => api.delete(`/orders/${id}`),
};
