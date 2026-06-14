import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  CircularProgress, Tabs, Tab, InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon      from '@mui/icons-material/Save';
import PageLayout    from '@/components/layout/PageLayout';
import { usePromotion, useCreatePromotion, useUpdatePromotion } from '@/hooks/usePromotions';
import { useParams, useNavigate } from 'react-router-dom';

const BADGES = ['', 'HOT', 'NEW', 'SALE', 'LIMITED'];

const EMPTY = {
  title: '', title_ru: '', title_tr: '',
  description: '', description_ru: '', description_tr: '',
  imageUrl: '',
  badge: '',
  discountPercent: '',
  promoCode: '',
  validFrom: '',
  validTo: '',
  isActive: true,
};

function toInputDate(iso) {
  if (!iso) return '';
  return iso.slice(0, 10); // yyyy-mm-dd
}

export default function PromotionFormPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isEdit    = Boolean(id) && id !== 'new';
  const { data: existing, isLoading: loadingItem } = usePromotion(isEdit ? id : null);
  const createMut = useCreatePromotion();
  const updateMut = useUpdatePromotion();

  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [langTab, setLangTab] = useState(0); // 0=EN, 1=RU, 2=TR

  useEffect(() => {
    if (existing) {
      setForm({
        title:    existing.title    || '',
        title_ru: existing.title_ru || '',
        title_tr: existing.title_tr || '',
        description:    existing.description    || '',
        description_ru: existing.description_ru || '',
        description_tr: existing.description_tr || '',
        imageUrl: existing.imageUrl || '',
        badge:    existing.badge    || '',
        discountPercent: existing.discountPercent != null ? String(existing.discountPercent) : '',
        promoCode: existing.promoCode || '',
        validFrom: toInputDate(existing.validFrom),
        validTo:   toInputDate(existing.validTo),
        isActive:  existing.isActive ?? true,
      });
    }
  }, [existing]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title (EN) is required';
    if (form.discountPercent !== '' && (isNaN(form.discountPercent) || Number(form.discountPercent) < 0 || Number(form.discountPercent) > 100))
      errs.discountPercent = 'Must be 0–100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title:    form.title.trim(),
      title_ru: form.title_ru.trim(),
      title_tr: form.title_tr.trim(),
      description:    form.description.trim(),
      description_ru: form.description_ru.trim(),
      description_tr: form.description_tr.trim(),
      imageUrl:  form.imageUrl.trim(),
      badge:     form.badge || null,
      discountPercent: form.discountPercent !== '' ? Number(form.discountPercent) : null,
      promoCode: form.promoCode.trim().toUpperCase(),
      validFrom: form.validFrom || null,
      validTo:   form.validTo   || null,
      isActive:  form.isActive,
    };

    if (isEdit) {
      updateMut.mutate({ id, data: payload }, { onSuccess: () => navigate('/promotions') });
    } else {
      createMut.mutate(payload, { onSuccess: () => navigate('/promotions') });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  if (isEdit && loadingItem) {
    return <PageLayout title="Loading…"><Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box></PageLayout>;
  }

  return (
    <PageLayout title={isEdit ? 'Edit Promotion' : 'New Promotion'}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/promotions')} sx={{ mb: 2 }}>
        Back to Promotions
      </Button>

      <Card sx={{ maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>

              {/* Titles — tabbed per language */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Title &amp; Description
                </Typography>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                  <Tabs value={langTab} onChange={(_, v) => setLangTab(v)}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 40 }}>
                    <Tab label="🇬🇧 English" sx={{ minHeight: 40 }} />
                    <Tab label="🇷🇺 Русский" sx={{ minHeight: 40 }} />
                    <Tab label="🇹🇷 Türkçe"  sx={{ minHeight: 40 }} />
                  </Tabs>

                  {langTab === 0 && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField fullWidth label="Title (EN)" value={form.title}
                        onChange={set('title')} error={!!errors.title} helperText={errors.title} required />
                      <TextField fullWidth label="Description (EN)" value={form.description}
                        onChange={set('description')} multiline minRows={2} maxRows={4} />
                    </Box>
                  )}
                  {langTab === 1 && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField fullWidth label="Заголовок (RU)" value={form.title_ru}
                        onChange={set('title_ru')} />
                      <TextField fullWidth label="Описание (RU)" value={form.description_ru}
                        onChange={set('description_ru')} multiline minRows={2} maxRows={4} />
                    </Box>
                  )}
                  {langTab === 2 && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField fullWidth label="Başlık (TR)" value={form.title_tr}
                        onChange={set('title_tr')} />
                      <TextField fullWidth label="Açıklama (TR)" value={form.description_tr}
                        onChange={set('description_tr')} multiline minRows={2} maxRows={4} />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Image URL */}
              <Grid item xs={12}>
                <TextField fullWidth label="Image URL" value={form.imageUrl}
                  onChange={set('imageUrl')} placeholder="https://example.com/promo.jpg" />
              </Grid>
              {form.imageUrl && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Preview</Typography>
                  <Box component="img" src={form.imageUrl} alt="preview"
                    sx={{ width: '100%', maxHeight: 180, borderRadius: 2, objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </Grid>
              )}

              {/* Badge + Discount */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Badge</InputLabel>
                  <Select value={form.badge} label="Badge" onChange={set('badge')}>
                    {BADGES.map((b) => (
                      <MenuItem key={b} value={b}>{b || '— None —'}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Discount %" value={form.discountPercent}
                  onChange={set('discountPercent')} type="number"
                  error={!!errors.discountPercent} helperText={errors.discountPercent}
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  placeholder="10" />
              </Grid>

              {/* Promo code */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Promo Code" value={form.promoCode}
                  onChange={set('promoCode')} placeholder="SUMMER20"
                  inputProps={{ style: { textTransform: 'uppercase' } }} />
              </Grid>

              {/* Active toggle */}
              <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={<Switch checked={form.isActive} onChange={set('isActive')} color="success" />}
                  label="Active"
                />
              </Grid>

              {/* Dates */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Valid From" value={form.validFrom}
                  onChange={set('validFrom')} type="date"
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Valid To" value={form.validTo}
                  onChange={set('validTo')} type="date"
                  InputLabelProps={{ shrink: true }} />
              </Grid>

              {/* Submit */}
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large" fullWidth
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  {isEdit ? 'Update Promotion' : 'Create Promotion'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
