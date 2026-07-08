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

// Contact number shown on the printed receipt (same source as the site's WhatsApp/phone button).
export function useContactSettings() {
  return useQuery({
    queryKey: ['settings', 'contact'],
    queryFn:  () => settingsService.getContact().then((r) => r.data.data.settings),
    staleTime: 5 * 60 * 1000,
  });
}
