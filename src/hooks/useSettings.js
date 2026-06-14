import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';
import toast from 'react-hot-toast';

export function useCategoryOrder() {
  return useQuery({
    queryKey: ['settings', 'categoryOrder'],
    queryFn:  () => settingsService.getCategoryOrder().then((r) => r.data.data.categoryOrder),
  });
}

export function useUpdateCategoryOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryOrder) => settingsService.updateCategoryOrder(categoryOrder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'categoryOrder'] });
      toast.success('Category order saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });
}
