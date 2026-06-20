import React, { useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Stack, ToggleButtonGroup,
  ToggleButton, Pagination, Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarsIcon from '@mui/icons-material/Stars';
import PeopleIcon from '@mui/icons-material/People';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { userService } from '@/services/userService';
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
  const [loyalFilter, setLoyalFilter] = useState('all'); // 'all' | 'loyal'

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
    ...(loyalFilter === 'loyal' ? { loyal: 'true' } : {}),
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

  const handleLoyalFilter = (_, val) => {
    if (val !== null) {
      setLoyalFilter(val);
      setPage(1);
    }
  };

  return (
    <PageLayout title="Kullanıcılar">
      {/* ── Filters bar ── */}
      <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
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

            <ToggleButtonGroup
              value={loyalFilter}
              exclusive
              onChange={handleLoyalFilter}
              size="small"
              sx={{ '& .MuiToggleButton-root': { px: 2, fontWeight: 600, fontSize: 13 } }}
            >
              <ToggleButton value="all">
                <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                Tüm Kullanıcılar
              </ToggleButton>
              <ToggleButton value="loyal">
                <StarsIcon fontSize="small" sx={{ mr: 0.5 }} />
                Sadık Müşteriler
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {loyalFilter === 'loyal' && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalOfferIcon fontSize="small" color="success" />
              <Typography variant="caption" color="success.main" fontWeight={600}>
                3'ten fazla tamamlanmış siparişi olan müşteriler gösteriliyor
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Stats row ── */}
      {data && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Toplam: <strong>{pagination?.total ?? 0}</strong> kullanıcı
            {loyalFilter === 'loyal' && ' (sadakat durumlu)'}
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
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      {loyalFilter === 'loyal'
                        ? 'Henüz sadık kullanıcı yok (4+ sipariş gerekli)'
                        : 'Kullanıcı bulunamadı'}
                    </Typography>
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
    </PageLayout>
  );
}
