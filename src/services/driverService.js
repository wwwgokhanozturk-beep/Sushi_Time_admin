import api from './api';

export const driverService = {
  getAll:         (params) => api.get('/drivers', { params }),
  getById:        (id)     => api.get(`/drivers/${id}`),
  updateStatus:   (id, s)  => api.patch(`/drivers/${id}/status`, { status: s }),
  assignToOrder:  (orderId, driverId) => api.post(`/orders/${orderId}/assign`, { driverId }),
};
