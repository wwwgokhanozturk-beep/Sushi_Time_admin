import React from 'react';
import { Grid, Box, Typography, Card, CardContent, Divider } from '@mui/material';
import ShoppingBagIcon  from '@mui/icons-material/ShoppingBag';
import AttachMoneyIcon  from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import PageLayout       from '@/components/layout/PageLayout';
import StatCard         from './components/StatCard';
import RevenueChart     from './components/RevenueChart';
import OrderStatusBadge from '@/pages/Orders/components/OrderStatusBadge';
import { useOrders }    from '@/hooks/useOrders';
import { formatPrice }  from '@/utils/formatters';
import dayjs            from 'dayjs';

function buildWeeklyRevenue(orders) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day');
    const key = d.format('YYYY-MM-DD');
    const label = d.format('ddd');
    const revenue = orders
      .filter((o) => o.status !== 'cancelled' && dayjs(o.createdAt).format('YYYY-MM-DD') === key)
      .reduce((s, o) => s + (o.totalPrice || 0), 0);
    days.push({ day: label, revenue: parseFloat(revenue.toFixed(2)) });
  }
  return days;
}

export default function DashboardPage() {
  const { data: orders = [], isLoading } = useOrders();

  const totalRevenue   = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const pendingOrders  = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrders= orders.filter((o) => o.status === 'delivered').length;
  const recent         = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const weeklyData     = buildWeeklyRevenue(orders);

  return (
    <PageLayout title="Dashboard">
      {/* ── Stat cards ─────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { title: 'Total Orders',  value: isLoading ? '…' : orders.length,              icon: <ShoppingBagIcon />,    color: 'secondary', trend: 12 },
          { title: 'Revenue (all)', value: isLoading ? '…' : formatPrice(totalRevenue), icon: <AttachMoneyIcon />,  color: 'success',   trend: 8  },
          { title: 'Pending',       value: isLoading ? '…' : pendingOrders,               icon: <PendingActionsIcon />, color: 'warning',   trend: -3 },
          { title: 'Delivered',     value: isLoading ? '…' : deliveredOrders,             icon: <CheckCircleIcon />,    color: 'primary',   trend: 15 },
        ].map((s) => (
          <Grid item xs={12} sm={6} lg={3} key={s.title}>
            <StatCard {...s} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      {/* ── Chart + recent orders ──────────────────── */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <RevenueChart data={weeklyData} />
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Recent Orders</Typography>
              <Divider sx={{ mb: 1.5 }} />
              {isLoading ? (
                <Typography color="text.secondary">Loading…</Typography>
              ) : recent.length === 0 ? (
                <Typography color="text.secondary">No orders yet</Typography>
              ) : (
                recent.map((order) => (
                  <Box key={order._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #F3F4F6' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {order.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(order.createdAt).format('MMM D, HH:mm')} · {formatPrice(order.totalPrice)}
                      </Typography>
                    </Box>
                    <OrderStatusBadge status={order.status} />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageLayout>
  );
}
