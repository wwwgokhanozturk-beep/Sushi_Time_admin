import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionService } from '@/services/promotionService';
import toast from 'react-hot-toast';

export function usePromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn:  () => promotionService.getAll().then((r) => r.data.data.promotions),
  });
}

export function usePromotion(id) {
  return useQuery({
    queryKey: ['promotions', id],
    queryFn:  () => promotionService.getById(id).then((r) => r.data.data.promotion),
    enabled:  !!id,
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => promotionService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Kampanya oluşturuldu'); },
    onError:   (err) => toast.error(err.response?.data?.message || 'Oluşturma başarısız'),
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => promotionService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Kampanya güncellendi'); },
    onError:   (err) => toast.error(err.response?.data?.message || 'Güncelleme başarısız'),
  });
}

// Persist a new display order. Optimistically reorders the cached list so the
// cards move instantly, then reconciles with the server response.
export function useReorderPromotions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => promotionService.reorder(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['promotions'] });
      const prev = qc.getQueryData(['promotions']);
      if (Array.isArray(prev)) {
        const byId = new Map(prev.map((p) => [p._id, p]));
        const next = ids.map((id) => byId.get(id)).filter(Boolean);
        qc.setQueryData(['promotions'], next);
      }
      return { prev };
    },
    onError: (err, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(['promotions'], ctx.prev);
      toast.error(err.response?.data?.message || 'Sıralama başarısız');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => promotionService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Kampanya silindi'); },
    onError:   (err) => toast.error(err.response?.data?.message || 'Silme başarısız'),
  });
}
