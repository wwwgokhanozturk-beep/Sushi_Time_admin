import { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import useSocket from './useSocket';
import toast from 'react-hot-toast';

export function useOrders(params = {}) {
  const qc = useQueryClient();
  const seenDiscountIds = useRef(new Set());
  const seenOrderIds = useRef(new Set());

  const query = useQuery({
    queryKey: ['orders', params],
    queryFn:  () => orderService.getAll(params).then((r) => r.data.data.orders),
    refetchInterval: 30000, // fallback polling every 30s
  });

  // Real-time: invalidate query cache on socket events
  useSocket({
    'order:new': (order) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      const orderId = String(order?._id || '').slice(-6).toUpperCase();
      if (!seenOrderIds.current.has(order?._id)) {
        seenOrderIds.current.add(order?._id);
        toast.success(
          `🔔 New order #${orderId || '???'} \u2014 ${order?.totalPrice ?? ''} ₺`,
          { duration: 8000, style: { maxWidth: 380 } }
        );
      }
    },
    'order:status_changed': () => qc.invalidateQueries({ queryKey: ['orders'] }),
    'order:cancelled': () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  // Notify admin when a loyalty-discounted order appears for the first time
  useEffect(() => {
    if (!query.data) return;
    query.data.forEach((order) => {
      if (order.loyaltyDiscountApplied && !seenDiscountIds.current.has(order._id)) {
        seenDiscountIds.current.add(order._id);
        toast.success(
          `🎉 Loyalty discount applied!\n${order.customerName} — order #${order._id.slice(-6).toUpperCase()} (−${order.discountAmount} TRY)`,
          { duration: 6000, style: { maxWidth: 380 } }
        );
      }
    });
  }, [query.data]);

  return query;
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn:  () => orderService.getById(id).then((r) => r.data.data.order),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => orderService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => orderService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cancel failed'),
  });
}
