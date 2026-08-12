import React from 'react';
import { Box, Card, CardContent, Typography, TextField, MenuItem } from '@mui/material';
import { useDrivers, useAssignDriver } from '@/hooks/useDrivers';

/**
 * Kurye atama kartı — sipariş detayının iki görünümünde de kullanılır:
 * listedeki açılır panel (OrdersPage) ve ayrı sipariş sayfası (OrderDetailPage).
 * Müşterinin canlı haritası bu atamaya bağlıdır.
 *
 * `variant="outlined"` listedeki panele, varsayılan gölgeli kart ayrı sayfaya uyar.
 */
export default function DriverAssignCard({ order, variant, disabled = false }) {
  const { data: drivers, isLoading } = useDrivers();
  const assignDriver = useAssignDriver();

  // Sipariş `driver` alanı doldurulmuş (ad + telefon) ya da null gelir.
  const assignedId = order?.driver?._id || order?.driver || '';
  const assigned =
    (order?.driver && order.driver.name ? order.driver : null) ||
    (drivers || []).find((d) => d._id === assignedId) ||
    null;

  const locked =
    disabled || ['delivered', 'cancelled'].includes(order?.status) || assignDriver.isPending;

  const body = (
    <>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Kurye</Typography>
      <TextField
        select
        fullWidth
        size="small"
        value={assignedId}
        // Без этого MUI считает пустое значение "нет выбора" и рисует пустое
        // поле вместо строки «— Atanmadı —».
        SelectProps={{ displayEmpty: true }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          assignDriver.mutate({ orderId: order._id, driverId: e.target.value || null });
        }}
        disabled={locked || isLoading}
        helperText={
          assignedId
            ? 'Kurye "Yolda" durumunda konumunu müşteriye canlı iletir.'
            : 'Sipariş yola çıkmadan önce bir kurye atayın.'
        }
      >
        <MenuItem value="">— Atanmadı —</MenuItem>
        {(drivers || []).map((driver) => (
          <MenuItem key={driver._id} value={driver._id}>
            {driver.name}
            {driver.activeOrderCount > 0 ? ` (${driver.activeOrderCount} aktif)` : ''}
          </MenuItem>
        ))}
      </TextField>
      {assigned?.phone && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">Telefon</Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{assigned.phone}</Typography>
        </Box>
      )}
    </>
  );

  // Listedeki panelde kartlar çerçeveli ve iç boşluğu elle veriliyor.
  if (variant === 'outlined') {
    return (
      <Card variant="outlined">
        <Box sx={{ p: 2 }}>{body}</Box>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
