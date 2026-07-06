import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Button, IconButton, Tooltip,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Switch,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon   from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PageLayout from '@/components/layout/PageLayout';
import { usePromotions, useDeletePromotion, useUpdatePromotion, useReorderPromotions } from '@/hooks/usePromotions';
import { useNavigate } from 'react-router-dom';

const BADGE_COLORS = {
  HOT:     'error',
  NEW:     'success',
  SALE:    'warning',
  LIMITED: 'secondary',
};

function promoStatus(promo) {
  if (!promo.isActive) return { label: 'Pasif', color: 'default' };
  const now = new Date();
  if (promo.validTo && new Date(promo.validTo) < now) return { label: 'Süresi doldu', color: 'error' };
  if (promo.validFrom && new Date(promo.validFrom) > now) return { label: 'Planlandı', color: 'info' };
  return { label: 'Aktif', color: 'success' };
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PromotionsPage() {
  const navigate = useNavigate();
  const { data: promos = [], isLoading } = usePromotions();
  const deleteMut = useDeletePromotion();
  const updateMut = useUpdatePromotion();
  const reorderMut = useReorderPromotions();
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = () => {
    if (deleteId) deleteMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const toggleActive = (promo) => {
    updateMut.mutate({ id: promo._id, data: { isActive: !promo.isActive } });
  };

  // Swap a card with its neighbour and persist the whole new order (1-2-3…).
  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= promos.length) return;
    const next = [...promos];
    [next[index], next[target]] = [next[target], next[index]];
    reorderMut.mutate(next.map((p) => p._id));
  };

  return (
    <PageLayout title="Kampanyalar">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/promotions/new')}>
          Kampanya Ekle
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : promos.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 6 }}>
          Henüz kampanya yok. İlkini oluşturun!
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {promos.map((promo, index) => {
            const status = promoStatus(promo);
            return (
              <Grid item xs={12} sm={6} md={4} key={promo._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {/* Display-order badge (1-2-3…) */}
                  <Box
                    sx={{
                      position: 'absolute', top: 12, left: 12, zIndex: 1,
                      width: 28, height: 28, borderRadius: '50%',
                      bgcolor: 'primary.main', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, boxShadow: 2,
                    }}
                  >
                    {index + 1}
                  </Box>

                  {/* Status chip */}
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1, fontWeight: 700 }}
                  />

                  {/* Image */}
                  <Box sx={{ height: 130, bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {promo.imageUrl ? (
                      <Box component="img" src={promo.imageUrl} alt={promo.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Typography fontSize={44}>🎉</Typography>
                    )}
                  </Box>

                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1 }}>
                        {promo.title}
                      </Typography>
                      {promo.badge && (
                        <Chip label={promo.badge} color={BADGE_COLORS[promo.badge] || 'default'} size="small" sx={{ fontWeight: 800 }} />
                      )}
                    </Box>

                    {promo.discountPercent != null && (
                      <Typography variant="body2" color="primary" fontWeight={700}>
                        −%{promo.discountPercent} indirim
                      </Typography>
                    )}

                    {promo.promoCode && (
                      <Typography variant="body2" color="text.secondary">
                        Kod: <strong>{promo.promoCode}</strong>
                      </Typography>
                    )}

                    {(promo.validFrom || promo.validTo) && (
                      <Typography variant="caption" color="text.secondary">
                        {fmtDate(promo.validFrom)} → {fmtDate(promo.validTo)}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 1 }}>
                      <Switch
                        checked={promo.isActive}
                        onChange={() => toggleActive(promo)}
                        color="success"
                        size="small"
                        disabled={updateMut.isPending}
                      />
                      <Box>
                        <Tooltip title="Yukarı taşı">
                          <span>
                            <IconButton size="small" onClick={() => move(index, -1)}
                              disabled={index === 0 || reorderMut.isPending}>
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Aşağı taşı">
                          <span>
                            <IconButton size="small" onClick={() => move(index, 1)}
                              disabled={index === promos.length - 1 || reorderMut.isPending}>
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Düzenle">
                          <IconButton size="small" onClick={() => navigate(`/promotions/${promo._id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton size="small" color="error" onClick={() => setDeleteId(promo._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Kampanyayı Sil</DialogTitle>
        <DialogContent>
          <Typography>Bu kampanyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>İptal</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteMut.isPending}>
            {deleteMut.isPending ? <CircularProgress size={20} /> : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
