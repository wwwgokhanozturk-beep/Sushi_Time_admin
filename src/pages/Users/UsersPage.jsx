import React, { useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert,
  Pagination, Avatar, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarsIcon from '@mui/icons-material/Stars';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import PageLayout from '@/components/layout/PageLayout';

const PAGE_SIZE = 15;

function OrderCountBadge({ count }) {
  let color = 'default';
  if (count >= 4) color = 'success';
  else if (count >= 2) color = 'primary';
  return (
    <Chip
      label={`${count} orders`}
      size="small"
      color={color}
      variant={count >= 4 ? 'filled' : 'outlined'}
      sx={{ fontWeight: 700, fontSize: 12 }}
    />
  );
}

function userInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase() || '?';
}

const ROLE_COLOR = { admin: 'error', driver: 'warning', customer: 'default' };

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // debounce search: only fire query after user stops typing
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearch(searchInput);
      setPage(1);
    }
  };

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminUsers', queryParams],
    queryFn: () =>
      userService.getAdminUsers(queryParams).then((r) => r.data.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?._id);
  const [toDelete, setToDelete] = useState(null); // user pending delete confirmation

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Kullanıcı silindi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Silme başarısız'),
    onSettled: () => setToDelete(null),
  });

  const confirmDelete = () => {
    if (toDelete) deleteMutation.mutate(toDelete._id);
  };

  return (
    <PageLayout title="Kullanıcılar">
      {/* ── Filters bar ── */}
      <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, mb: 3 }}>
        <CardContent>
          <TextField
            placeholder="İsim, e-posta veya telefon ile ara… (Enter'a basın)"
            size="small"
            value={searchInput}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* ── Stats row ── */}
      {data && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Toplam: <strong>{pagination?.total ?? 0}</strong> kullanıcı
          </Typography>
        </Box>
      )}

      {/* ── Error ── */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.response?.data?.message || 'Kullanıcılar yüklenemedi'}
        </Alert>
      )}

      {/* ── Table ── */}
      <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 700 }}>Kullanıcı</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Telefon</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Siparişler</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sadakat</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kayıt</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">Kullanıcı bulunamadı</Typography>
                  </TableCell>
                </TableRow>
              )}

              {users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 36, height: 36,
                          bgcolor: user.role === 'admin' ? 'error.main' : user.role === 'driver' ? 'warning.main' : 'primary.main',
                          fontSize: 14, fontWeight: 700,
                        }}
                      >
                        {userInitials(user.name)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600} variant="body2">{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      variant="outlined"
                      color={ROLE_COLOR[user.role] || 'default'}
                      sx={{ fontWeight: 600, fontSize: 11, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <OrderCountBadge count={user.ordersCount || 0} />
                  </TableCell>
                  <TableCell>
                    {user.ordersCount >= 4 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarsIcon fontSize="small" color="warning" />
                        <Typography variant="caption" fontWeight={700} color="warning.main">
                          Sadık
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        {user.ordersCount > 0
                          ? `Sadakate ${4 - user.ordersCount} sipariş kaldı`
                          : user.role === 'customer' ? 'Henüz sipariş yok' : '—'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(user.createdAt).toLocaleDateString('en-GB')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={currentUserId === user._id ? 'Kendinizi silemezsiniz' : 'Kullanıcıyı sil'}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={currentUserId === user._id}
                          onClick={() => setToDelete(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Pagination ── */}
        {pagination && pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #F3F4F6' }}>
            <Pagination
              count={pagination.pages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Card>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Kullanıcıyı sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{toDelete?.name}</strong> ({toDelete?.email}) kalıcı olarak
            silinecek. Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Vazgeç</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Siliniyor…' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
