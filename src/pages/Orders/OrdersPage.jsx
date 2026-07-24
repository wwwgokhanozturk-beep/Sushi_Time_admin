import React, { useState, useEffect } from 'react';
import {
  Box, Card, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, Tabs, Tab, TextField, InputAdornment,
  IconButton, Tooltip, CircularProgress, Typography, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Collapse, Grid, Divider, Stack,
} from '@mui/material';
import SearchIcon     from '@mui/icons-material/Search';
import RefreshIcon    from '@mui/icons-material/Refresh';
import PrintIcon      from '@mui/icons-material/Print';
import DownloadIcon   from '@mui/icons-material/Download';
import DeleteIcon     from '@mui/icons-material/Delete';
import RoomIcon       from '@mui/icons-material/Room';
import CancelIcon     from '@mui/icons-material/Cancel';
import TimerIcon      from '@mui/icons-material/Timer';
import StarsIcon      from '@mui/icons-material/Stars';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon   from '@mui/icons-material/KeyboardArrowUp';
import PageLayout     from '@/components/layout/PageLayout';
import OrderStatusBadge from './components/OrderStatusBadge';
import { useQuery } from '@tanstack/react-query';
import { useOrders, useDeleteOrder, useUpdateOrderStatus, useCancelOrder }  from '@/hooks/useOrders';
import { orderService } from '@/services/orderService';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { useContactSettings, useOrderTimerSetting } from '@/hooks/useSettings';
import { formatPrice } from '@/utils/formatters';
import { ORDER_STATUSES, STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { buildMapsUrl, isGpsPin } from '@/utils/maps';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'preparing', 'en_route', 'delivered', 'cancelled'];

// Live mm:ss countdown from order.createdAt + the admin-configured timer
// duration — same clock the customer sees on their tracking page, so staff
// can tell at a glance which orders are running late without opening them.
function OrderCountdown({ order, minutes }) {
  const [remainingMs, setRemainingMs] = useState(null);
  const isFinished = order.status === 'delivered' || order.status === 'cancelled';
  // Ön sipariş: sayaç, sipariş zamanından değil seçilen saatten geriye sayar.
  const baseTime = order.scheduledFor ? new Date(order.scheduledFor).getTime() : new Date(order.createdAt).getTime();
  const endTime = order.scheduledFor ? baseTime : baseTime + minutes * 60000;

  useEffect(() => {
    if (isFinished || !minutes) return;
    const tick = () => setRemainingMs(Math.max(0, endTime - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endTime, minutes, isFinished]);

  if (isFinished || remainingMs == null) {
    return <Typography variant="caption" color="text.secondary">—</Typography>;
  }

  const overdue = remainingMs === 0;
  const large = remainingMs >= 3600000;
  const label = overdue
    ? 'Süre doldu'
    : large
    ? `${String(Math.floor(remainingMs / 3600000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 3600000) / 60000)).padStart(2, '0')}`
    : `${String(Math.floor(remainingMs / 60000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}`;

  return (
    <Chip
      icon={<TimerIcon fontSize="small" />}
      label={label}
      size="small"
      color={overdue ? 'error' : 'default'}
      variant={overdue ? 'filled' : 'outlined'}
      sx={{ fontFamily: 'monospace', fontWeight: 700 }}
    />
  );
}

function DetailRow({ label, value, strong, color }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 500, color: color || 'text.primary', textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

// Inline expanded panel shown below a clicked order row — same info as the
// old standalone detail page, without navigating away from the list.
function OrderExpandedDetails({ order, contact, printReceipt }) {
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder  = useCancelOrder();
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  const address = [
    order.address,
    order.buildingName && `Bina: ${order.buildingName}`,
    order.floor && `Kat: ${order.floor}`,
    order.apartment && `Daire: ${order.apartment}`,
    order.doorCode && `Kapı kodu: ${order.doorCode}`,
  ].filter(Boolean).join(', ');

  const mapsUrl = buildMapsUrl(order);

  const handleCancel = () => {
    if (window.confirm('Bu siparişi iptal et? Bu işlem geri alınamaz.')) {
      cancelOrder.mutate(order._id);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#F9FAFB' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        {order.loyaltyDiscountApplied && (
          <Chip label="🎉 Sadakat indirimi" color="success" size="small" variant="outlined" />
        )}
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<PrintIcon />} variant="outlined" size="small"
          onClick={(e) => { e.stopPropagation(); printReceipt(order, contact?.contactNumber); }}>
          Fiş yazdır
        </Button>
        {!isCancelled && !isDelivered && (
          <Button startIcon={<CancelIcon />} variant="outlined" color="error" size="small"
            onClick={(e) => { e.stopPropagation(); handleCancel(); }} disabled={cancelOrder.isPending}>
            Siparişi iptal et
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <Box sx={{ p: 2 }}>
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
                <DetailRow label="Ürünler toplamı" value={order.itemsTotal != null ? formatPrice(order.itemsTotal) : null} />
                {order.promoDiscount > 0 && (
                  <DetailRow label={`Promosyon${order.promoCode ? ` (${order.promoCode})` : ''}`}
                    value={`− ${formatPrice(order.promoDiscount)}`} color="error.main" />
                )}
                {order.discountAmount > 0 && (
                  <DetailRow label="Sadakat indirimi" value={`− ${formatPrice(order.discountAmount)}`} color="success.main" />
                )}
                {order.deliveryFee > 0 && <DetailRow label="Teslimat ücreti" value={formatPrice(order.deliveryFee)} />}
                {order.serviceFee > 0 && <DetailRow label="Hizmet bedeli" value={formatPrice(order.serviceFee)} />}
                {order.tip > 0 && <DetailRow label="Bahşiş" value={formatPrice(order.tip)} />}
                <Divider sx={{ my: 1 }} />
                <DetailRow label="Toplam" value={formatPrice(order.totalPrice)} strong />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <Box sx={{ p: 2 }}>
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
                        onClick={(e) => { e.stopPropagation(); !active && updateStatus.mutate({ id: order._id, status: s }); }}
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
              </Box>
            </Card>

            <Card variant="outlined">
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Müşteri</Typography>
                {order.scheduledFor && (
                  <DetailRow
                    label="Ön Sipariş Zamanı"
                    value={dayjs(order.scheduledFor).format('D MMM YYYY, HH:mm')}
                    strong
                    color="info.main"
                  />
                )}
                <DetailRow label="Ad" value={order.customerName} />
                <DetailRow label="Telefon" value={order.phone} />
                <DetailRow label="Bölge" value={order.district} />
                <DetailRow label="Adres" value={address} />
                {mapsUrl && (
                  <Button
                    component="a"
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    fullWidth
                    variant="outlined"
                    startIcon={<RoomIcon />}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ mt: 1, justifyContent: 'flex-start' }}
                  >
                    {isGpsPin(order) ? 'Haritada aç · GPS konumu' : 'Haritada aç'}
                  </Button>
                )}
                <DetailRow label="Notlar" value={order.notes} />
              </Box>
            </Card>

            <Card variant="outlined">
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Ödeme</Typography>
                <DetailRow label="Yöntem" value={order.paymentMethod === 'card' ? 'Kart (kapıda)' : 'Nakit (kapıda)'} />
                <DetailRow label="Ödeme durumu" value={order.paymentStatus} />
                <Divider sx={{ my: 1 }} />
                <DetailRow label="Oluşturuldu" value={dayjs(order.createdAt).format('D MMM YYYY HH:mm')} />
                <DetailRow label="Güncellendi" value={dayjs(order.updatedAt).format('D MMM YYYY HH:mm')} />
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function OrdersPage() {
  const printReceipt = usePrintReceipt();
  const { data: contact } = useContactSettings();
  const { data: orderTimer } = useOrderTimerSetting();
  const timerMinutes = orderTimer?.minutes || 40;
  const [tab, setTab]       = useState(0);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]     = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [toDelete, setToDelete] = useState(null); // order pending delete confirmation
  const [expandedId, setExpandedId] = useState(null); // order whose details are shown inline
  const [loyalOnly, setLoyalOnly] = useState(false); // show only customers with 4+ orders
  const deleteOrder = useDeleteOrder();

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteOrder.mutate(toDelete._id, { onSettled: () => setToDelete(null) });
  };

  const statusFilter = STATUS_TABS[tab] === 'all' ? undefined : STATUS_TABS[tab];
  // limit is generous so name/date filtering (client-side, below) works across
  // the whole recent history, not just the current page's worth of rows.
  const { data: orders = [], isLoading, refetch, isFetching } = useOrders({
    limit: 1000,
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  // Independent of the status tab — needed so "4+ orders" reflects a
  // customer's whole order history, not just orders in the current tab.
  // Plain useQuery (not useOrders) so we don't double up its socket/toast
  // side effects by mounting the hook a second time on this page.
  const { data: allOrders = [] } = useQuery({
    queryKey: ['orders', { limit: 1000, forLoyaltyCount: true }],
    queryFn: () => orderService.getAll({ limit: 1000 }).then((r) => r.data.data.orders),
  });

  // Orders per phone number across the whole loaded history (not just the
  // currently filtered rows) — used to spot customers with 4+ orders.
  const orderCountByPhone = React.useMemo(() => {
    const counts = new Map();
    for (const o of allOrders) {
      if (!o.phone) continue;
      counts.set(o.phone, (counts.get(o.phone) || 0) + 1);
    }
    return counts;
  }, [allOrders]);

  const filtered = orders.filter((o) => {
    // Text (name / phone / ID)
    const matchesSearch = !search ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o._id?.includes(search) ||
      o.phone?.includes(search);
    if (!matchesSearch) return false;
    // Date range (inclusive, by order date)
    if (dateFrom || dateTo) {
      const d = dayjs(o.createdAt);
      if (dateFrom && d.isBefore(dayjs(dateFrom).startOf('day'))) return false;
      if (dateTo && d.isAfter(dayjs(dateTo).endOf('day'))) return false;
    }
    if (loyalOnly && (orderCountByPhone.get(o.phone) || 0) < 4) return false;
    return true;
  });

  const hasFilter = !!(search || dateFrom || dateTo || loyalOnly);
  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setLoyalOnly(false); setPage(0); };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePrint = (e, order) => {
    e.stopPropagation();
    printReceipt(order, contact?.contactNumber);
  };

  // Export the filtered rows to a neatly-formatted .xlsx. When the filter
  // yields nothing (or no filter is set), export everything currently loaded.
  const exportExcel = () => {
    const data = filtered.length ? filtered : orders;
    const rows = data.map((o) => ({
      'Sipari\u015F No':  `#${o._id?.slice(-6).toUpperCase()}`,
      'M\u00FC\u015Fteri':     o.customerName || '',
      'Telefon':     o.phone || '',
      '\u00DCr\u00FCn Say\u0131s\u0131': o.items?.length ?? 0,
      'Toplam (\u20BA)':  Number(o.totalPrice ?? 0),
      'Durum':       STATUS_LABELS[o.status] || o.status || '',
      '\u00D6deme':       o.paymentMethod === 'card' ? 'Kart' : 'Nakit',
      'Adres':       o.address || '',
      'Tarih':       dayjs(o.createdAt).format('DD.MM.YYYY HH:mm'),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths so everything lines up cleanly.
    ws['!cols'] = [
      { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 11 }, { wch: 12 },
      { wch: 15 }, { wch: 8 },  { wch: 36 }, { wch: 18 },
    ];
    // Freeze the header row.
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sipari\u015Fler');
    XLSX.writeFile(wb, `siparisler-${dayjs().format('YYYY-MM-DD_HHmm')}.xlsx`);
  };

  return (
    <PageLayout title="Siparişler">
      <Card>
        {/* ── Filter tabs ── */}
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setPage(0); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid #E5E7EB', px: 2, pt: 1 }}
        >
          {STATUS_TABS.map((s) => (
            <Tab key={s} label={s === 'all' ? 'Tümü' : (STATUS_LABELS[s] || s)} />
          ))}
        </Tabs>

        {/* ── Filters (name / date range) + export ── */}
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small" placeholder="İsim, telefon, ID ile ara…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 220, flex: '1 1 220px' }}
          />
          <TextField
            size="small" type="date" label="Başlangıç" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: dateTo || undefined }}
            sx={{ width: 165 }}
          />
          <TextField
            size="small" type="date" label="Bitiş" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: dateFrom || undefined }}
            sx={{ width: 165 }}
          />
          <Tooltip title="4 veya daha fazla sipariş veren müşterileri göster">
            <Button
              size="small"
              variant={loyalOnly ? 'contained' : 'outlined'}
              color="warning"
              startIcon={<StarsIcon fontSize="small" />}
              onClick={() => { setLoyalOnly((v) => !v); setPage(0); }}
            >
              Sadık Müşteriler (4+)
            </Button>
          </Tooltip>

          {hasFilter && (
            <Button size="small" color="inherit" onClick={clearFilters}>
              Temizle
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Yenile">
            <span>
              <IconButton onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={hasFilter ? 'Filtrelenen siparişleri Excel’e aktar' : 'Tüm siparişleri Excel’e aktar'}>
            <span>
              <Button
                startIcon={<DownloadIcon />}
                onClick={exportExcel}
                disabled={orders.length === 0}
                size="small"
                variant="outlined"
              >
                Excel'e Aktar
              </Button>
            </span>
          </Tooltip>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} sipariş
          </Typography>
        </Box>

        {/* ── Table ── */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                {['', 'Sipariş No', 'Müşteri', 'Telefon', 'Ürünler', 'Toplam', 'Durum', 'Süre', 'Tarih', ''].map((h, i) => (
                  <TableCell key={i} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sipariş bulunamadı</TableCell></TableRow>
              ) : paginated.map((order) => {
                const isExpanded = expandedId === order._id;
                return (
                <React.Fragment key={order._id}>
                <TableRow hover sx={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(order._id)}>
                  <TableCell sx={{ width: 32 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(order._id); }}>
                      {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    #{order._id?.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{order.customerName}</TableCell>
                  <TableCell>{order.phone}</TableCell>
                  <TableCell>
                    <Chip label={`${order.items?.length ?? 0} ürün`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{formatPrice(order.totalPrice)}</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell>
                    <OrderCountdown order={order} minutes={timerMinutes} />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {dayjs(order.createdAt).format('MMM D, HH:mm')}
                    {order.scheduledFor && (
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={`Ön: ${dayjs(order.scheduledFor).format('D MMM, HH:mm')}`}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontSize: 11, height: 20 }}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Yazdır (Fiş)">
                        <IconButton size="small" onClick={(e) => handlePrint(e, order)}>
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={buildMapsUrl(order) ? 'Haritada aç' : 'Adres yok'}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={!buildMapsUrl(order)}
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = buildMapsUrl(order);
                              if (url) window.open(url, '_blank', 'noopener');
                            }}
                          >
                            <RoomIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Siparişi sil">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => { e.stopPropagation(); setToDelete(order); }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={10} sx={{ p: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <OrderExpandedDetails order={order} contact={contact} printReceipt={printReceipt} />
                    </Collapse>
                  </TableCell>
                </TableRow>
                </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100, 200]}
        />
      </Card>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Siparişi sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            #{toDelete?._id?.slice(-6).toUpperCase()} numaralı sipariş kalıcı olarak
            silinecek. Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Vazgeç</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteOrder.isPending}
          >
            {deleteOrder.isPending ? 'Siliniyor…' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>

    </PageLayout>
  );
}
