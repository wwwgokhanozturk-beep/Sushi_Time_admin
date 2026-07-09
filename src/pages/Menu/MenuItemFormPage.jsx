import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button, IconButton,
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
import ImageFrameEditor from '@/components/ImageFrameEditor';
import toast from 'react-hot-toast';

const MAX_IMAGES = 3;

const EMPTY = {
  name: '', name_ru: '', name_tr: '', category: 'rolls', price: '',
  images: [], imageUrl: '', imageScale: 1, imageOffsetX: 0, imageOffsetY: 0,
  preparationTime: '15', calories: '0', isAvailable: true,
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

  // Загрузка файла — добавляет фото в массив (до MAX_IMAGES)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await menuService.uploadImage(file);
      const url = data?.data?.url || data?.url;
      if (url) {
        setForm((prev) => ({ ...prev, images: [...prev.images, url].slice(0, MAX_IMAGES) }));
        toast.success('Fotoğraf yüklendi');
      }
    } catch {
      toast.error('Fotoğraf yüklenemedi');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  // Добавить фото по URL (основной способ)
  const addUrl = () =>
    setForm((prev) => {
      const u = (prev.imageUrl || '').trim();
      if (!u || prev.images.length >= MAX_IMAGES) return prev;
      return { ...prev, images: [...prev.images, u].slice(0, MAX_IMAGES), imageUrl: '' };
    });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        name_ru: existing.name_ru || '',
        name_tr: existing.name_tr || '',
        description:    existing.description    || '',
        description_ru: existing.description_ru || '',
        description_tr: existing.description_tr || '',
        category: existing.category || 'rolls',
        price: String(existing.price ?? ''),
        images: existing.images?.length ? existing.images : (existing.imageUrl ? [existing.imageUrl] : []),
        imageUrl: existing.imageUrl || '',
        imageScale: existing.imageScale ?? 1,
        imageOffsetX: existing.imageOffsetX ?? 0,
        imageOffsetY: existing.imageOffsetY ?? 0,
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
    if (!form.name.trim())     errs.name     = 'Ad gerekli';
    if (!form.category)        errs.category  = 'Kategori gerekli';
    if (!form.price || isNaN(form.price) || Number(form.price) < 0)
      errs.price = 'Geçerli bir fiyat gerekli';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const splitCSV = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      name: form.name.trim(),
      name_ru: form.name_ru.trim(),
      name_tr: form.name_tr.trim(),
      description:    form.description.trim(),
      description_ru: form.description_ru.trim(),
      description_tr: form.description_tr.trim(),
      category: form.category,
      price: Number(form.price),
      images: form.images.filter(Boolean).slice(0, MAX_IMAGES),
      imageUrl: (form.images.filter(Boolean)[0] || '').trim(),
      imageScale: Number(form.imageScale) || 1,
      imageOffsetX: Number(form.imageOffsetX) || 0,
      imageOffsetY: Number(form.imageOffsetY) || 0,
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
    return <PageLayout title="Yükleniyor…"><Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box></PageLayout>;
  }

  return (
    <PageLayout title={isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün'}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/menu')} sx={{ mb: 2 }}>
        Menüye Dön
      </Button>

      <Card sx={{ maxWidth: 720, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              {/* Name */}
              <Grid item xs={12}>
                <TextField fullWidth label="Ürün Adı (EN)" value={form.name}
                  onChange={set('name')} error={!!errors.name} helperText={errors.name || 'RU / TR adları aşağıdaki dil sekmelerinde'} />
              </Grid>

              {/* Category + Price */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel>Kategori</InputLabel>
                  <Select value={form.category} label="Kategori" onChange={set('category')}>
                    {MENU_CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fiyat (₺)" value={form.price}
                  onChange={set('price')} error={!!errors.price} helperText={errors.price}
                  InputProps={{ startAdornment: <InputAdornment position="start">₺</InputAdornment> }}
                  type="number" inputProps={{ step: '0.01', min: '0', placeholder: 'Örn: 149.90' }} />
              </Grid>

              {/* Description + Ingredients — tabbed per language */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Açıklama ve Malzemeler
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
                      <TextField fullWidth label="Açıklama (EN)" value={form.description}
                        onChange={set('description')} multiline minRows={2} maxRows={4} />
                      <TextField fullWidth label="Malzemeler (EN) — virgülle ayrılmış" value={form.ingredients}
                        onChange={set('ingredients')} placeholder="rice, salmon, nori, wasabi" />
                    </Box>
                  )}
                  {/* RU */}
                  {langTab === 1 && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField fullWidth label="Ürün Adı (RU)" value={form.name_ru}
                        onChange={set('name_ru')} placeholder="Например: Филадельфия" />
                      <TextField fullWidth label="Açıklama (RU)" value={form.description_ru}
                        onChange={set('description_ru')} multiline minRows={2} maxRows={4} />
                      <TextField fullWidth label="Malzemeler (RU) — virgülle ayrılmış" value={form.ingredients_ru}
                        onChange={set('ingredients_ru')} placeholder="рис, лосось, нори, васаби" />
                    </Box>
                  )}
                  {/* TR */}
                  {langTab === 2 && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField fullWidth label="Ürün Adı (TR)" value={form.name_tr}
                        onChange={set('name_tr')} placeholder="Örn: Filadelfiya" />
                      <TextField fullWidth label="Açıklama (TR)" value={form.description_tr}
                        onChange={set('description_tr')} multiline minRows={2} maxRows={4} />
                      <TextField fullWidth label="Malzemeler (TR) — virgülle ayrılmış" value={form.ingredients_tr}
                        onChange={set('ingredients_tr')} placeholder="pirinç, somon, nori, wasabi" />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Fotoğraflar — en fazla MAX_IMAGES (menüde 5 sn'de bir geçer) */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Ürün fotoğrafları (en fazla {MAX_IMAGES}) — menüde 5 sn'de bir geçer
                </Typography>

                {/* URL ile ekleme — birincil yöntem */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fotoğraf URL'si"
                    value={form.imageUrl}
                    onChange={set('imageUrl')}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
                    placeholder="https://ornek.com/fotograf.jpg"
                    disabled={form.images.length >= MAX_IMAGES}
                    InputProps={{
                      endAdornment: form.imageUrl ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}>
                            <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={addUrl}
                    disabled={!form.imageUrl.trim() || form.images.length >= MAX_IMAGES}
                    sx={{ flexShrink: 0, minWidth: 96 }}
                  >
                    Ekle
                  </Button>
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={uploading || form.images.length >= MAX_IMAGES}
                    title="Dosyadan yükle"
                    sx={{ flexShrink: 0, minWidth: 48, px: 1 }}
                  >
                    {uploading ? <CircularProgress size={18} /> : <UploadIcon fontSize="small" />}
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileUpload}
                      ref={fileRef}
                    />
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  URL'yi yapıştırıp Enter'a basın ya da "Ekle"ye tıklayın. İsterseniz dosyadan da yükleyebilirsiniz.
                </Typography>

                {/* Eklenen fotoğraflar */}
                {form.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mt: 1.5 }}>
                    {form.images.map((url, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          position: 'relative', width: 84, height: 84, borderRadius: 2,
                          overflow: 'hidden', border: '1px solid #E5E7EB', flexShrink: 0,
                        }}
                      >
                        <img src={url} alt={`foto ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <Box sx={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10,
                            fontWeight: 700, textAlign: 'center', py: 0.25,
                          }}>
                            Ana
                          </Box>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => removeImage(idx)}
                          sx={{
                            position: 'absolute', top: 2, right: 2, width: 22, height: 22,
                            bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                            '&:hover': { bgcolor: 'error.main' },
                          }}
                        >
                          <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Foto editörü: çerçeve + yakınlaştırma + sürükleme (tüm fotoğraflara uygulanır) */}
                {form.images[0] ? (
                  <Box sx={{ mt: 2 }}>
                    <ImageFrameEditor
                      imageUrl={form.images[0]}
                      scale={Number(form.imageScale) || 1}
                      offsetX={Number(form.imageOffsetX) || 0}
                      offsetY={Number(form.imageOffsetY) || 0}
                      onChange={({ scale, offsetX, offsetY }) =>
                        setForm((prev) => ({ ...prev, imageScale: scale, imageOffsetX: offsetX, imageOffsetY: offsetY }))
                      }
                    />
                  </Box>
                ) : null}
              </Grid>

              {/* Prep time + Calories */}
              <Grid item xs={6} sm={4}>
                <TextField fullWidth label="Hazırlık Süresi (dk)" value={form.preparationTime}
                  onChange={set('preparationTime')} type="number" inputProps={{ min: '0' }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth label="Kalori" value={form.calories}
                  onChange={set('calories')} type="number" inputProps={{ min: '0' }} />
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={<Switch checked={form.isAvailable} onChange={set('isAvailable')} color="success" />}
                  label="Mevcut"
                />
              </Grid>

              {/* Stock */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stok"
                  value={form.stock}
                  onChange={set('stock')}
                  type="number"
                  inputProps={{ min: '0' }}
                  helperText={
                    form.stock === ''
                      ? 'Sınırsız stok için boş bırakın'
                      : Number(form.stock) === 0
                        ? '⚠️ Stok yok — ürün gizlenecek'
                        : `${form.stock} adet takip ediliyor`
                  }
                  FormHelperTextProps={{ sx: { color: Number(form.stock) === 0 && form.stock !== '' ? 'warning.main' : 'text.secondary' } }}
                />
              </Grid>

              {/* Preview */}
              {form.imageUrl && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Önizleme</Typography>
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
                  {isEdit ? 'Ürünü Güncelle' : 'Ürün Oluştur'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
