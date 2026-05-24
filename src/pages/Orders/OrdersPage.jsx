import React, { useState } from 'react';
import {
  Box, Card, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, Tabs, Tab, TextField, InputAdornment,
  IconButton, Tooltip, CircularProgress, Typography, Chip, Button,
} from '@mui/material';
import SearchIcon     from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon    from '@mui/icons-material/Refresh';
import PrintIcon      from '@mui/icons-material/Print';
import DownloadIcon   from '@mui/icons-material/Download';
import PageLayout     from '@/components/layout/PageLayout';
import OrderStatusBadge from './components/OrderStatusBadge';
import { useOrders }  from '@/hooks/useOrders';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { formatPrice } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'preparing', 'en_route', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const navigate   = useNavigate();
  const printReceipt = usePrintReceipt();
  const [tab, setTab]       = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(0);
  const [rowsPerPage]       = useState(10);

  const statusFilter = STATUS_TABS[tab] === 'all' ? undefined : STATUS_TABS[tab];
  const { data: orders = [], isLoading, refetch, isFetching } = useOrders(
    statusFilter ? { status: statusFilter } : {}
  );

  const filtered = orders.filter((o) =>
    !search ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o._id?.includes(search) ||
    o.phone?.includes(search)
  );

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePrint = (e, order) => {
    e.stopPropagation();
    printReceipt(order);
  };

  const exportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Items', 'Total (TRY)', 'Status', 'Payment', 'Date'];
    const rows = filtered.map((o) => [
      `#${o._id?.slice(-6).toUpperCase()}`,
      o.customerName || '',
      o.phone || '',
      o.items?.length ?? 0,
      o.totalPrice ?? 0,
      o.status || '',
      o.paymentMethod || 'cash',
      dayjs(o.createdAt).format('YYYY-MM-DD HH:mm'),
    ]);
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout title="Orders">
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
            <Tab key={s} label={s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} />
          ))}
        </Tabs>

        {/* ── Search + refresh ── */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search by name, phone, ID…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ maxWidth: 320, flex: 1 }}
          />
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Export filtered orders to CSV">
            <span>
              <Button
                startIcon={<DownloadIcon />}
                onClick={exportCSV}
                disabled={filtered.length === 0}
                size="small"
                variant="outlined"
              >
                Export CSV
              </Button>
            </span>
          </Tooltip>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* ── Table ── */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                {['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Date', ''].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No orders found</TableCell></TableRow>
              ) : paginated.map((order) => (
                <TableRow key={order._id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/orders/${order._id}`)}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    #{order._id?.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{order.customerName}</TableCell>
                  <TableCell>{order.phone}</TableCell>
                  <TableCell>
                    <Chip label={`${order.items?.length ?? 0} items`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{formatPrice(order.totalPrice)}</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {dayjs(order.createdAt).format('MMM D, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View details">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order._id}`); }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Yazdır (Fiş)">
                        <IconButton size="small" onClick={(e) => handlePrint(e, order)}>
                          <PrintIcon fontSize="small" />
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
          rowsPerPageOptions={[10]}
        />
      </Card>

    </PageLayout>
  );
}
