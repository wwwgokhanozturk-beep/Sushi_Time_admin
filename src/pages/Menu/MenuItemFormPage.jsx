import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  CircularProgress, Alert, Chip, InputAdornment, Tabs, Tab,
} from '@mui/material';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';
import SaveIcon       from '@mui/icons-material/Save';
import UploadIcon     from '@mui/icons-material/Upload';
import PageLayout     from '@/components/layout/PageLayout';
import { useMenuItem, useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useMenu';
import { useParams, useNavigate } from 'react-router-dom';
import { MENU_CATEGORIES } from '@/utils/constants';
import { menuService } from '@/services/menuService';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '', category: 'rolls', price: '',
  imageUrl: '', preparationTime: '15', calories: '0', isAvailable: true,
  stock: '',   // '' = unlimited (null); number = tracked quantity
  // per-language fields
  description:    '',
  description_ru: '',
  description_tr: '',
  ingredients:    '',
  ingredients_ru: '',
  ingredients_tr: '',
};

export default function MenuItemFormPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id) && id !== 'new';
  const { data: existing, isLoading: loadingItem } = useMenuItem(isEdit ? id : null);
  const createMut  = useCreateMenuItem();
  const updateMut  = useUpdateMenuItem();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [langTab, setLangTab] = useState(0); // 0=EN, 1=RU, 2=TR
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await menuService.uploadImage(file);
      const url = data?.data?.url || data?.url;
      if (url) {
        setForm((prev) => ({ ...prev, imageUrl: url }));
        toast.success('Image uploaded');
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        description:    existing.description    || '',
        description_ru: existing.description_ru || '',
        description_tr: existing.description_tr || '',
        category: existing.category || 'rolls',
        price: String(existing.price ?? ''),
        imageUrl: existing.imageUrl || '',
        ingredients:    (existing.ingredients    || []).join(', '),
        ingredients_ru: (existing.ingredients_ru || []).join(', '),
        ingredients_tr: (existing.ingredients_tr || []).join(', '),
        preparationTime: String(existing.preparationTime ?? '15'),
        calories: String(existing.calories ?? '0'),
        isAvailable: existing.isAvailable ?? true,
        stock: existing.stock !== undefined && existing.stock !== null ? String(existing.stock) : '',
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
    if (!form.name.trim())     errs.name     = 'Name is required';
    if (!form.category)        errs.category  = 'Category is required';
    if (!form.price || isNaN(form.price) || Number(form.price) < 0)
      errs.price = 'Valid price is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const splitCSV = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      name: form.name.trim(),
      description:    form.description.trim(),
      description_ru: form.description_ru.trim(),
      description_tr: form.description_tr.trim(),
      category: form.category,
      price: Number(form.price),
      imageUrl: form.imageUrl.trim(),
      ingredients:    splitCSV(form.ingredients),
      ingredients_ru: splitCSV(form.ingredients_ru),
      ingredients_tr: splitCSV(form.ingredients_tr),
      preparationTime: Number(form.preparationTime) || 15,
      calories: Number(form.calories) || 0,
      isAvailable: form.isAvailable,
      stock: form.stock === '' ? null : Number(form.stock),
    };

    if (isEdit) {
      updateMut.mutate({ id, data: payload }, { onSuccess: () => navigate('/menu') });
    } else {
      createMut.mutate(payload, { onSuccess: () => navigate('/menu') });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  if (isEdit && loadingItem) {
    return <PageLayout title="Loading…"><Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box></PageLayout>;
  }

  return (
    <PageLayout title={isEdit ? 'Edit Menu Item' : 'New Menu Item'}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/menu')} sx={{ mb: 2 }}>
        Back to Menu
      </Button>

      <Card sx={{ maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              {/* Name */}
              <Grid item xs={12}>
                <TextField fullWidth label="Item Name" value={form.name}
                  onChange={set('name')} error={!!errors.name} helperText={errors.name} />
              </Grid>

              {/* Category + Price */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select value={form.category} label="Category" onChange={set('category')}>
                    {MENU_CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Price (₺)" value={form.price}
                  onChange={set('price')} error={!!errors.price} helperText={errors.price}
                  InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }}
                  type="number" inputProps={{ step: '0.01', min: '0', placeholder: 'Например: 149.90' }} />
              </Grid>

              {/* Description + Ingredients — tabbed per language */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Description &amp; Ingredients
                </Typography>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                  <Tabs
                    value={langTab}
                    onChange={(_, v) => setLangTab(v)}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 40 }}
                  >
                    <Tab label="🇬🇧 English" sx={{ minHeight: 40 }} />
                    <Tab label="🇷🇺 Русский" sx={{ minHeight: 40 }} />
                    <Tab label="🇹🇷 Türkçe"  sx={{ minHeight: 40 }} />
                  </Tabs>

                  {/* EN */}
                  {langTab === 0 && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField fullWidth label="Description (EN)" value={form.description}
                        onChange={set('description')} multiline minRows={2} maxRows={4} />
                      <TextField fullWidth label="Ingredients (EN) — comma-separated" value={form.ingredients}
                        onChange={set('ingredients')} placeholder="rice, salmon, nori, wasabi" />
                    </Box>
                  )}
                  {/* RU */}
                  {langTab === 1 && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField fullWidth label="Описание (RU)" value={form.description_ru}
                        onChange={set('description_ru')} multiline minRows={2} maxRows={4} />
                      <TextField fullWidth label="Ингредиенты (RU) — через запятую" value={form.ingredients_ru}
                        onChange={set('ingredients_ru')} placeholder="рис, лосось, нори, васаби" />
                    </Box>
                  )}
                  {/* TR */}
                  {langTab === 2 && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField fullWidth label="Açıklama (TR)" value={form.description_tr}
                        onChange={set('description_tr')} multiline minRows={2} maxRows={4} />
                      <TextField fullWidth label="Malzemeler (TR) — virgülle ayrılmış" value={form.ingredients_tr}
                        onChange={set('ingredients_tr')} placeholder="pirinç, somon, nori, wasabi" />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Image URL + Upload */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField fullWidth label="Image URL" value={form.imageUrl}
                    onChange={set('imageUrl')} placeholder="https://example.com/image.jpg" />
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                    sx={{ minWidth: 120, height: 56, flexShrink: 0 }}
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileUpload}
                      ref={fileRef}
                    />
                  </Button>
                </Box>
              </Grid>

              {/* Prep time + Calories */}
              <Grid item xs={6} sm={4}>
                <TextField fullWidth label="Prep Time (min)" value={form.preparationTime}
                  onChange={set('preparationTime')} type="number" inputProps={{ min: '0' }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth label="Calories" value={form.calories}
                  onChange={set('calories')} type="number" inputProps={{ min: '0' }} />
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={<Switch checked={form.isAvailable} onChange={set('isAvailable')} color="success" />}
                  label="Available"
                />
              </Grid>

              {/* Stock */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock"
                  value={form.stock}
                  onChange={set('stock')}
                  type="number"
                  inputProps={{ min: '0' }}
                  helperText={
                    form.stock === ''
                      ? 'Leave empty for unlimited stock'
                      : Number(form.stock) === 0
                        ? '⚠️ Out of stock — item will be hidden'
                        : `${form.stock} unit(s) tracked`
                  }
                  FormHelperTextProps={{ sx: { color: Number(form.stock) === 0 && form.stock !== '' ? 'warning.main' : 'text.secondary' } }}
                />
              </Grid>

              {/* Preview */}
              {form.imageUrl && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Image Preview</Typography>
                  <Box component="img" src={form.imageUrl} alt="preview"
                    sx={{ maxHeight: 160, borderRadius: 2, objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </Grid>
              )}

              {/* Submit */}
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large" fullWidth
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  {isEdit ? 'Update Item' : 'Create Item'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
