import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Divider, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Chip, Stack, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon     from '@mui/icons-material/Print';
import CancelIcon    from '@mui/icons-material/Cancel';
import PageLayout    from '@/components/layout/PageLayout';
import OrderStatusBadge from './components/OrderStatusBadge';
import { useOrder, useUpdateOrderStatus, useCancelOrder } from '@/hooks/useOrders';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { formatPrice } from '@/utils/formatters';
import { ORDER_STATUSES, STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import dayjs from 'dayjs';

function Row({ label, value, strong, color }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 500, color: color || 'text.primary' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printReceipt = usePrintReceipt();

  const { data: order, isLoading, isError } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder  = useCancelOrder();

  if (isLoading) {
    return (
      <PageLayout title="Sipariş Detayı">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (isError || !order) {
    return (
      <PageLayout title="Sipariş Detayı">
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">Sipariş bulunamadı.</Typography>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
              Siparişlere Dön
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const shortId = order._id?.slice(-6).toUpperCase();
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  const address = [
    order.address,
    order.buildingName && `Bina: ${order.buildingName}`,
    order.floor && `Kat: ${order.floor}`,
    order.apartment && `Daire: ${order.apartment}`,
    order.doorCode && `Kapı kodu: ${order.doorCode}`,
  ].filter(Boolean).join(', ');

  const handleCancel = () => {
    if (window.confirm('Bu siparişi iptal et? Bu işlem geri alınamaz.')) {
      cancelOrder.mutate(order._id);
    }
  };

  return (
    <PageLayout title="Sipariş Detayı">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Tooltip title="Siparişlere dön">
          <IconButton onClick={() => navigate('/orders')}><ArrowBackIcon /></IconButton>
        </Tooltip>
        <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>#{shortId}</Typography>
        <OrderStatusBadge status={order.status} />
        {order.loyaltyDiscountApplied && (
          <Chip label="🎉 Sadakat indirimi" color="success" size="small" variant="outlined" />
        )}
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<PrintIcon />} variant="outlined" size="small" onClick={() => printReceipt(order)}>
          Fiş yazdır
        </Button>
        {!isCancelled && !isDelivered && (
          <Button startIcon={<CancelIcon />} variant="outlined" color="error" size="small"
            onClick={handleCancel} disabled={cancelOrder.isPending}>
            Siparişi iptal et
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* ── Left: items + totals ── */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Ürünler</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Ürün</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Adet</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Fiyat</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Ara toplam</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="center">{item.quantity}×</TableCell>
                      <TableCell align="right">{formatPrice(item.price)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatPrice(item.subtotal ?? item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ maxWidth: 320, ml: 'auto' }}>
                <Row label="Ürünler toplamı" value={order.itemsTotal != null ? formatPrice(order.itemsTotal) : null} />
                {order.promoDiscount > 0 && (
                  <Row label={`Promosyon${order.promoCode ? ` (${order.promoCode})` : ''}`}
                    value={`− ${formatPrice(order.promoDiscount)}`} color="error.main" />
                )}
                {order.discountAmount > 0 && (
                  <Row label="Sadakat indirimi" value={`− ${formatPrice(order.discountAmount)}`} color="success.main" />
                )}
                {order.deliveryFee > 0 && <Row label="Teslimat ücreti" value={formatPrice(order.deliveryFee)} />}
                {order.serviceFee > 0 && <Row label="Hizmet bedeli" value={formatPrice(order.serviceFee)} />}
                {order.tip > 0 && <Row label="Bahşiş" value={formatPrice(order.tip)} />}
                <Divider sx={{ my: 1 }} />
                <Row label="Toplam" value={formatPrice(order.totalPrice)} strong />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: status, customer, payment ── */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Status control */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Durum</Typography>
                <Stack spacing={1}>
                  {ORDER_STATUSES.map((s) => {
                    const active = order.status === s;
                    return (
                      <Button
                        key={s}
                        fullWidth
                        size="small"
                        disableElevation
                        variant={active ? 'contained' : 'outlined'}
                        color={STATUS_COLORS[s] || 'primary'}
                        onClick={() => !active && updateStatus.mutate({ id: order._id, status: s })}
                        disabled={isCancelled || updateStatus.isPending}
                        sx={{ justifyContent: 'flex-start', fontWeight: active ? 700 : 500 }}
                      >
                        {STATUS_LABELS[s] || s}
                      </Button>
                    );
                  })}
                </Stack>
                {updateStatus.isPending && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">Güncelleniyor…</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>


            {/* Customer */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Müşteri</Typography>
                <Row label="Ad" value={order.customerName} />
                <Row label="Telefon" value={order.phone} />
                <Row label="Adres" value={address} />
                <Row label="Notlar" value={order.notes} />
              </CardContent>
            </Card>

            {/* Payment & meta */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Ödeme</Typography>
                <Row label="Yöntem" value={order.paymentMethod === 'card' ? 'Kart (kapıda)' : 'Nakit (kapıda)'} />
                <Row label="Ödeme durumu" value={order.paymentStatus} />
                <Divider sx={{ my: 1 }} />
                <Row label="Oluşturuldu" value={dayjs(order.createdAt).format('D MMM YYYY HH:mm')} />
                <Row label="Güncellendi" value={dayjs(order.updatedAt).format('D MMM YYYY HH:mm')} />
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </PageLayout>
  );
}
