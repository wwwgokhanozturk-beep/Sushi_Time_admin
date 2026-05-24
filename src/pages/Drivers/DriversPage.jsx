import React, { useState } from 'react';
import {
  Typography, Box, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  CircularProgress, Alert, TextField, InputAdornment,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import BlockIcon         from '@mui/icons-material/Block';
import SearchIcon        from '@mui/icons-material/Search';
import PageLayout        from '@/components/layout/PageLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import toast from 'react-hot-toast';

function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn:  () => userService.getUsers({ role: 'driver', limit: 100 }).then((r) => r.data.data.users),
  });
}

function useToggleDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => userService.updateUser(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
}

export default function DriversPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const toggleMut = useToggleDriver();
  const [search, setSearch] = useState('');

  const filtered = (drivers || []).filter((d) => {
    const q = search.toLowerCase();
    return (
      !q ||
      d.name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.phone?.includes(q)
    );
  });

  return (
    <PageLayout title="Drivers">
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LocalShippingIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700}>Delivery Drivers</Typography>
        <Box sx={{ ml: 'auto' }}>
          <TextField
            size="small"
            placeholder="Search drivers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>Failed to load drivers.</Alert>
      )}

      {!isLoading && !isError && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        {search ? 'No drivers match your search.' : 'No drivers found. Assign the "driver" role to users via the backend.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((driver) => (
                      <TableRow key={driver._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalShippingIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={600}>{driver.name || '—'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{driver.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{driver.phone || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={driver.isActive !== false ? 'Active' : 'Inactive'}
                            color={driver.isActive !== false ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {driver.isActive !== false ? (
                            <Tooltip title="Deactivate driver">
                              <IconButton
                                size="small"
                                color="error"
                                disabled={toggleMut.isPending}
                                onClick={() => toggleMut.mutate({ id: driver._id, isActive: false })}
                              >
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Activate driver">
                              <IconButton
                                size="small"
                                color="success"
                                disabled={toggleMut.isPending}
                                onClick={() => toggleMut.mutate({ id: driver._id, isActive: true })}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        To add a driver, create or update a user and set their role to "driver" in the database.
      </Typography>
    </PageLayout>
  );
}
