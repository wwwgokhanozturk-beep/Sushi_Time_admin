import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/services/menuService';
import toast from 'react-hot-toast';

export function useMenuItems(params = {}) {
  // Admin panel filters client-side, so fetch every item in one shot
  // (the backend default page size is 20, which hides items past the first page).
  const queryParams = { limit: 1000, ...params };
  return useQuery({
    queryKey: ['menu', queryParams],
    queryFn:  () => menuService.getAll(queryParams).then((r) => r.data.data.items),
  });
}

export function useMenuItem(id) {
  return useQuery({
    queryKey: ['menu', id],
    queryFn:  () => menuService.getById(id).then((r) => r.data.data.item),
    enabled: !!id,
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => menuService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu'] }); toast.success('Ürün oluşturuldu'); },
    onError:   (err) => toast.error(err.response?.data?.message || 'Oluşturma başarısız'),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => menuService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu'] }); toast.success('Ürün güncellendi'); },
    onError:   (err) => toast.error(err.response?.data?.message || 'Güncelleme başarısız'),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => menuService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu'] }); toast.success('Ürün silindi'); },
    onError:   (err) => toast.error(err.response?.data?.message || 'Silme başarısız'),
  });
}
