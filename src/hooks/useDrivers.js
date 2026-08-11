import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '@/services/driverService';
import toast from 'react-hot-toast';

/** All couriers with their last known position and open deliveries. */
export function useDrivers(params) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => driverService.getAll(params).then((r) => r.data.data.drivers),
    // The socket stream carries positions; this refetch only keeps the roster
    // and the open-order counts honest.
    refetchInterval: 60000,
  });
}

/** Assign a courier to an order — pass driverId: null to unassign. */
export function useAssignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, driverId }) => driverService.assignToOrder(orderId, driverId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(vars.driverId ? 'Kurye atandı' : 'Kurye ataması kaldırıldı');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Kurye atanamadı'),
  });
}
