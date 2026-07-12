import React, { useState } from 'react';
import {
  Box, Card, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, Tabs, Tab, TextField, InputAdornment,
  IconButton, Tooltip, CircularProgress, Typography, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import SearchIcon     from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon    from '@mui/icons-material/Refresh';
import PrintIcon      from '@mui/icons-material/Print';
import DownloadIcon   from '@mui/icons-material/Download';
import DeleteIcon     from '@mui/icons-material/Delete';
import RoomIcon       from '@mui/icons-material/Room';
import PageLayout     from '@/components/layout/PageLayout';
import OrderStatusBadge from './components/OrderStatusBadge';
import { useOrders, useDeleteOrder }  from '@/hooks/useOrders';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { useContactSettings } from '@/hooks/useSettings';
import { formatPrice } from '@/utils/formatters';
import { STATUS_LABELS } from '@/utils/constants';
import { buildMapsUrl } from '@/utils/maps';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'preparing', 'en_route', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const navigate   = useNavigate();
  const printReceipt = usePrintReceipt();
  const { data: contact } = useContactSettings();
  const [tab, setTab]       = useState(0);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]     = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [toDelete, setToDelete] = useState(null); // order pending delete confirmation
  const deleteOrder = useDeleteOrder();

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
    return true;
  });

  const hasFilter = !!(search || dateFrom || dateTo);
  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(0); };

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
                {['Sipariş No', 'Müşteri', 'Telefon', 'Ürünler', 'Toplam', 'Durum', 'Tarih', ''].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sipariş bulunamadı</TableCell></TableRow>
              ) : paginated.map((order) => (
                <TableRow key={order._id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/orders/${order._id}`)}>
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
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {dayjs(order.createdAt).format('MMM D, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Detayları gör">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order._id}`); }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
              ))}
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
