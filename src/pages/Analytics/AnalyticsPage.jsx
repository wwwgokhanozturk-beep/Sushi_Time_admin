import React, { useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField,
  CircularProgress, Alert, Divider, Chip, Stack,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useQuery } from '@tanstack/react-query';
import { alpha, useTheme } from '@mui/material/styles';
import { analyticsService } from '@/services/analyticsService';
import { formatPrice } from '@/utils/formatters';
import PageLayout from '@/components/layout/PageLayout';

// Default range: current month
function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Ranked, unlimited item list — shared by both the date-range card and the
// persisted monthly card below.
function RankedItemsList({ items, emptyLabel }) {
  if (!items?.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        {emptyLabel}
      </Typography>
    );
  }
  return items.map((item, idx) => (
    <Box
      key={item.menuItemId || item.name || idx}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        py: 1.5, borderBottom: idx < items.length - 1 ? '1px solid #F3F4F6' : 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography
          sx={{
            width: 28, height: 28, borderRadius: '50%',
            bgcolor: idx === 0 ? 'warning.main' : idx === 1 ? 'text.secondary' : 'action.hover',
            color: idx < 2 ? 'white' : 'text.primary',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 12, flexShrink: 0,
          }}
        >
          {idx + 1}
        </Typography>
        <Typography fontWeight={600}>{item.name}</Typography>
      </Box>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Chip
          label={`× ${item.totalQuantity}`}
          size="small"
          sx={{ fontWeight: 700, bgcolor: 'primary.50', color: 'primary.main' }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, textAlign: 'right' }}>
          {formatPrice(item.totalRevenue)}
        </Typography>
      </Stack>
    </Box>
  ));
}

function MetricCard({ icon, label, value, color = 'primary.main', sub }) {
  const theme = useTheme();
  // Resolve MUI theme path like "success.main" to an actual color value
  const resolvedColor = color.split('.').reduce((obj, key) => obj?.[key], theme.palette) || color;
  return (
    <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: alpha(resolvedColor, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(defaultRange());
  const [month, setMonth] = useState(currentMonth());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', range.from, range.to],
    queryFn: () =>
      analyticsService.getAnalytics(range.from, range.to).then((r) => r.data.data),
    enabled: !!(range.from && range.to),
    staleTime: 60_000,
  });

  const { data: availableMonths } = useQuery({
    queryKey: ['analytics', 'months'],
    queryFn: () => analyticsService.getAvailableMonths().then((r) => r.data.data.months),
    staleTime: 60_000,
  });

  const {
    data: monthlyData, isLoading: monthlyLoading, isError: monthlyIsError, error: monthlyError,
  } = useQuery({
    queryKey: ['analytics', 'monthly', month],
    queryFn: () => analyticsService.getMonthlyAnalytics(month).then((r) => r.data.data),
    enabled: !!month,
    staleTime: 60_000,
  });

  const handleDateChange = (field) => (e) => {
    setRange((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <PageLayout title="Analitik">
      {/* ── Date Range Picker ── */}
      <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Tarih Aralığı
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Başlangıç"
              type="date"
              size="small"
              value={range.from}
              onChange={handleDateChange('from')}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: range.to }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="Bitiş"
              type="date"
              size="small"
              value={range.to}
              onChange={handleDateChange('to')}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: range.from }}
              sx={{ minWidth: 180 }}
            />
            {isLoading && <CircularProgress size={22} />}
          </Stack>
        </CardContent>
      </Card>

      {/* ── Error ── */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.response?.data?.message || 'Analitik yüklenemedi'}
        </Alert>
      )}

      {/* ── Metric Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<TrendingUpIcon />}
            label="Toplam Gelir"
            value={data ? formatPrice(data.totalRevenue) : '—'}
            color="success.main"
            sub="İptal edilmeyen siparişler"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<ShoppingCartIcon />}
            label="Sipariş Sayısı"
            value={data ? data.orderCount.toLocaleString() : '—'}
            color="primary.main"
            sub="İptal edilmeyen siparişler"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<ReceiptLongIcon />}
            label="Ortalama Sepet"
            value={data ? formatPrice(data.avgCheck) : '—'}
            color="warning.main"
            sub="Gelir ÷ Sipariş"
          />
        </Grid>
      </Grid>

      {/* ── All items, ranked (for the chosen date range) ── */}
      <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EmojiEventsIcon color="warning" />
            <Typography variant="subtitle1" fontWeight={700}>
              En Çok Satan Ürünler
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <RankedItemsList items={data?.topItems} emptyLabel="Seçilen dönem için veri yok" />
          )}
        </CardContent>
      </Card>

      {/* ── Persisted monthly stats — survives even if old orders get deleted ── */}
      <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                Aylık İstatistikler
              </Typography>
            </Box>
            <TextField
              type="month"
              size="small"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {availableMonths?.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {availableMonths.map((m) => (
                <Chip
                  key={m}
                  label={monthLabel(m)}
                  size="small"
                  variant={m === month ? 'filled' : 'outlined'}
                  color={m === month ? 'primary' : 'default'}
                  onClick={() => setMonth(m)}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Stack>
          )}

          <Divider sx={{ mb: 2 }} />

          {monthlyIsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {monthlyError?.response?.data?.message || 'Aylık veriler yüklenemedi'}
            </Alert>
          )}

          {!monthlyIsError && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Toplam Gelir</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {monthlyData ? formatPrice(monthlyData.totalRevenue) : '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Sipariş Sayısı</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {monthlyData ? monthlyData.orderCount.toLocaleString() : '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Ortalama Sepet</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {monthlyData ? formatPrice(monthlyData.avgCheck) : '—'}
                  </Typography>
                </Grid>
              </Grid>

              {monthlyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <RankedItemsList items={monthlyData?.topItems} emptyLabel="Bu ay için veri yok" />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
