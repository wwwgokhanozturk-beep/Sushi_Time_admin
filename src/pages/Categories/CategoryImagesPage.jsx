import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button, IconButton,
  CircularProgress, Alert, InputAdornment,
} from '@mui/material';
import SaveIcon    from '@mui/icons-material/Save';
import UploadIcon  from '@mui/icons-material/Upload';
import DeleteIcon  from '@mui/icons-material/Delete';
import PageLayout       from '@/components/layout/PageLayout';
import ImageFrameEditor from '@/components/ImageFrameEditor';
import { settingsService } from '@/services/settingsService';
import { menuService }     from '@/services/menuService';
import { MENU_CATEGORIES } from '@/utils/constants';
import toast from 'react-hot-toast';

const EMOJI = {
  sets: '🍱', rolls: '🍣', maki: '🍣', uramaki: '🍣', hosomaki: '🍙', temaki: '🌯',
  nigiri: '🍣', sashimi: '🐟', gunkan: '🍣', onigiri: '🍙',
  tempura: '🍤', appetizers: '🥢', salads: '🥗', soups: '🍲',
  wok: '🍜', noodles: '🍜', pizza: '🍕', fast_food: '🍔',
  desserts: '🍰', drinks: '🥤',
};
const emoji = (c) => EMOJI[c] || '🍽️';
const pretty = (c) => (c || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

const BLANK = { imageUrl: '', scale: 1, offsetX: 0, offsetY: 0 };

export default function CategoryImagesPage() {
  const [cats, setCats]   = useState([]);
  const [images, setImages] = useState({});   // { [cat]: { imageUrl, scale, offsetX, offsetY } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploadingCat, setUploadingCat] = useState(null);
  const fileCatRef = useRef(null);            // which category the hidden input targets
  const fileRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([menuService.categories(), settingsService.getCategoryImages()])
      .then(([cRes, iRes]) => {
        if (!active) return;
        const menuCats = cRes.data?.data?.categories || [];
        const list = (menuCats.length ? menuCats : MENU_CATEGORIES).map((c) => c.toLowerCase());
        setCats([...new Set(list)]);
        setImages(iRes.data?.data?.categoryImages || {});
      })
      .catch(() => toast.error('Kategoriler yüklenemedi'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const entry = (cat) => images[cat] || BLANK;

  const patch = (cat, p) =>
    setImages((prev) => ({ ...prev, [cat]: { ...BLANK, ...prev[cat], ...p } }));

  const removeImage = (cat) =>
    setImages((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });

  const pickFile = (cat) => {
    fileCatRef.current = cat;
    fileRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    const cat = fileCatRef.current;
    e.target.value = '';
    if (!file || !cat) return;
    setUploadingCat(cat);
    try {
      const { data } = await menuService.uploadImage(file);
      const url = data?.data?.url || data?.url;
      if (url) {
        patch(cat, { imageUrl: url });
        toast.success('Fotoğraf yüklendi');
      }
    } catch {
      toast.error('Fotoğraf yüklenemedi');
    } finally {
      setUploadingCat(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      // Keep only categories that actually have an image.
      const payload = {};
      for (const [cat, v] of Object.entries(images)) {
        if (v?.imageUrl?.trim()) payload[cat] = v;
      }
      const { data } = await settingsService.updateCategoryImages(payload);
      setImages(data?.data?.categoryImages || payload);
      toast.success('Kaydedildi');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Kaydetme hatası');
    } finally {
      setSaving(false);
    }
  };

  const filledCount = useMemo(
    () => Object.values(images).filter((v) => v?.imageUrl?.trim()).length,
    [images],
  );

  if (loading) {
    return (
      <PageLayout title="Kategori Fotoğrafları">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Kategori Fotoğrafları">
      {/* Hidden shared file input */}
      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onFile}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Müşteri menüsündeki kategori butonlarında görünen fotoğraflar. Fotoğraf
          eklemezseniz varsayılan simge gösterilir. Sürükleyerek konumlandırın, kaydırıcıyla yakınlaştırın.
        </Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={save}
          disabled={saving}
          sx={{ flexShrink: 0 }}
        >
          Kaydet ({filledCount})
        </Button>
      </Box>

      <Grid container spacing={2}>
        {cats.map((cat) => {
          const e = entry(cat);
          const hasImg = !!e.imageUrl;
          return (
            <Grid item xs={12} md={6} key={cat}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 22 }}>{emoji(cat)}</Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>{pretty(cat)}</Typography>
                    {hasImg && (
                      <IconButton size="small" color="error" onClick={() => removeImage(cat)} title="Fotoğrafı kaldır">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Fotoğraf URL'si"
                      value={e.imageUrl}
                      onChange={(ev) => patch(cat, { imageUrl: ev.target.value })}
                      placeholder="https://ornek.com/foto.jpg"
                      InputProps={{
                        endAdornment: e.imageUrl ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => patch(cat, { imageUrl: '' })}>
                              <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => pickFile(cat)}
                      disabled={uploadingCat === cat}
                      sx={{ flexShrink: 0, minWidth: 48, px: 1 }}
                      title="Dosyadan yükle"
                    >
                      {uploadingCat === cat ? <CircularProgress size={18} /> : <UploadIcon fontSize="small" />}
                    </Button>
                  </Box>

                  {hasImg ? (
                    <ImageFrameEditor
                      imageUrl={e.imageUrl}
                      scale={Number(e.scale) || 1}
                      offsetX={Number(e.offsetX) || 0}
                      offsetY={Number(e.offsetY) || 0}
                      onChange={({ scale, offsetX, offsetY }) => patch(cat, { scale, offsetX, offsetY })}
                    />
                  ) : (
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      Fotoğraf yok — menüde “{emoji(cat)}” varsayılan simgesi gösterilir.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={save}
          disabled={saving}
        >
          Kaydet
        </Button>
      </Box>
    </PageLayout>
  );
}
