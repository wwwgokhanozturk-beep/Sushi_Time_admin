import { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import useSocket from './useSocket';
import toast from 'react-hot-toast';
import { startAlert } from '@/utils/alertSound';

// An order older than this was not "just placed" — it showed up because the
// operator switched a filter, and must not set off the alarm.
const FRESH_ORDER_WINDOW_MS = 5 * 60_000;

export function useOrders(params = {}) {
  const qc = useQueryClient();
  const seenDiscountIds = useRef(new Set());
  const seenOrderIds = useRef(new Set());
  // The first page of results is the starting picture, not a batch of news.
  const seenInitialised = useRef(false);
  const openedAt = useRef(Date.now());

  const query = useQuery({
    queryKey: ['orders', params],
    queryFn:  () => orderService.getAll(params).then((r) => r.data.data.orders),
    refetchInterval: 30000, // fallback polling every 30s
    // The panel spends most of its life in a background tab, and React Query
    // pauses interval refetches there by default — which would leave the
    // missed-order safety net switched off exactly when it is needed.
    refetchIntervalInBackground: true,
  });

  // Real-time: invalidate query cache on socket events
  useSocket({
    'order:new': (order) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      const orderId = String(order?._id || '').slice(-6).toUpperCase();
      if (!seenOrderIds.current.has(order?._id)) {
        seenOrderIds.current.add(order?._id);
        toast.success(
          `🔔 Yeni sipariş #${orderId || '???'} \u2014 ${order?.totalPrice ?? ''} ₺`,
          { duration: 8000, style: { maxWidth: 380 } }
        );
      }
    },
    'order:status_changed': () => qc.invalidateQueries({ queryKey: ['orders'] }),
    'order:cancelled': () => qc.invalidateQueries({ queryKey: ['orders'] }),
    'order:deleted': () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  // Safety net for a missed socket event. If the connection dropped (laptop
  // asleep, flaky Wi-Fi, a backend redeploy), `order:new` never arrives and the
  // order used to appear in the list in complete silence. The 30s poll now
  // rings for anything genuinely new that the socket did not announce.
  useEffect(() => {
    if (!query.data) return;

    if (!seenInitialised.current) {
      query.data.forEach((order) => seenOrderIds.current.add(order._id));
      seenInitialised.current = true;
      return;
    }

    const missed = query.data.filter(
      (order) =>
        !seenOrderIds.current.has(order._id) &&
        new Date(order.createdAt).getTime() > openedAt.current - FRESH_ORDER_WINDOW_MS,
    );
    if (missed.length === 0) return;

    missed.forEach((order) => seenOrderIds.current.add(order._id));
    startAlert('order');
    missed.forEach((order) => {
      toast.success(
        `🔔 Yeni sipariş #${order._id.slice(-6).toUpperCase()} — ${order.totalPrice ?? ''} ₺`,
        { duration: 8000, style: { maxWidth: 380 } },
      );
    });
  }, [query.data]);

  // Notify admin when a loyalty-discounted order appears for the first time
  useEffect(() => {
    if (!query.data) return;
    query.data.forEach((order) => {
      if (order.loyaltyDiscountApplied && !seenDiscountIds.current.has(order._id)) {
        seenDiscountIds.current.add(order._id);
        toast.success(
          `🎉 Sadakat indirimi uygulandı!\n${order.customerName} — sipariş #${order._id.slice(-6).toUpperCase()} (−${order.discountAmount} ₺)`,
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
      toast.success('Sipariş durumu güncellendi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Güncelleme başarısız'),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => orderService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Sipariş iptal edildi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'İptal başarısız'),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => orderService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Sipariş silindi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Silme başarısız'),
  });
}
