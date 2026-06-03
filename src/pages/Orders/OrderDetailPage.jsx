import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Divider, Button, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Chip, Stack, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon     from '@mui/icons-material/Print';
import CancelIcon    from '@mui/icons-material/Cancel';
import PageLayout    from '@/components/layout/PageLayout';
import OrderStatusBadge from './components/OrderStatusBadge';
import { useOrder, useUpdateOrderStatus, useCancelOrder } from '@/hooks/useOrders';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { formatPrice } from '@/utils/formatters';
import { ORDER_STATUSES } from '@/utils/constants';
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
      <PageLayout title="Order Details">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (isError || !order) {
    return (
      <PageLayout title="Order Details">
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">Order not found.</Typography>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
              Back to Orders
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
    order.buildingName && `Building: ${order.buildingName}`,
    order.floor && `Floor: ${order.floor}`,
    order.apartment && `Apt: ${order.apartment}`,
    order.doorCode && `Door code: ${order.doorCode}`,
  ].filter(Boolean).join(', ');

  const handleStatusChange = (e) => {
    updateStatus.mutate({ id: order._id, status: e.target.value });
  };

  const handleCancel = () => {
    if (window.confirm('Cancel this order? This cannot be undone.')) {
      cancelOrder.mutate(order._id);
    }
  };

  return (
    <PageLayout title="Order Details">
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Tooltip title="Back to orders">
          <IconButton onClick={() => navigate('/orders')}><ArrowBackIcon /></IconButton>
        </Tooltip>
        <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>#{shortId}</Typography>
        <OrderStatusBadge status={order.status} />
        {order.loyaltyDiscountApplied && (
          <Chip label="🎉 Loyalty discount" color="success" size="small" variant="outlined" />
        )}
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<PrintIcon />} variant="outlined" size="small" onClick={() => printReceipt(order)}>
          Print receipt
        </Button>
        {!isCancelled && !isDelivered && (
          <Button startIcon={<CancelIcon />} variant="outlined" color="error" size="small"
            onClick={handleCancel} disabled={cancelOrder.isPending}>
            Cancel order
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* ── Left: items + totals ── */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Items</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Subtotal</TableCell>
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
                <Row label="Items total" value={order.itemsTotal != null ? formatPrice(order.itemsTotal) : null} />
                {order.promoDiscount > 0 && (
                  <Row label={`Promo${order.promoCode ? ` (${order.promoCode})` : ''}`}
                    value={`− ${formatPrice(order.promoDiscount)}`} color="error.main" />
                )}
                {order.discountAmount > 0 && (
                  <Row label="Loyalty discount" value={`− ${formatPrice(order.discountAmount)}`} color="success.main" />
                )}
                {order.deliveryFee > 0 && <Row label="Delivery fee" value={formatPrice(order.deliveryFee)} />}
                {order.serviceFee > 0 && <Row label="Service fee" value={formatPrice(order.serviceFee)} />}
                {order.tip > 0 && <Row label="Tip" value={formatPrice(order.tip)} />}
                <Divider sx={{ my: 1 }} />
                <Row label="Total" value={formatPrice(order.totalPrice)} strong />
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Status</Typography>
                <FormControl fullWidth size="small" disabled={isCancelled}>
                  <InputLabel id="status-label">Order status</InputLabel>
                  <Select
                    labelId="status-label"
                    label="Order status"
                    value={order.status}
                    onChange={handleStatusChange}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {updateStatus.isPending && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">Updating…</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>


            {/* Customer */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Customer</Typography>
                <Row label="Name" value={order.customerName} />
                <Row label="Phone" value={order.phone} />
                <Row label="Address" value={address} />
                <Row label="Notes" value={order.notes} />
              </CardContent>
            </Card>

            {/* Payment & meta */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Payment</Typography>
                <Row label="Method" value={order.paymentMethod === 'card' ? 'Card (on delivery)' : 'Cash (on delivery)'} />
                <Row label="Payment status" value={order.paymentStatus} />
                <Divider sx={{ my: 1 }} />
                <Row label="Created" value={dayjs(order.createdAt).format('MMM D, YYYY HH:mm')} />
                <Row label="Updated" value={dayjs(order.updatedAt).format('MMM D, YYYY HH:mm')} />
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </PageLayout>
  );
}
