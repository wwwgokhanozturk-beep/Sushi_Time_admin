import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button, IconButton,
  CircularProgress, Alert, InputAdornment, Divider,
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

const BLANK_IMG = { imageUrl: '', scale: 1, offsetX: 0, offsetY: 0 };
const BLANK_NAME = { en: '', ru: '', tr: '' };

export default function CategoryImagesPage() {
  const [cats, setCats]     = useState([]);
  const [images, setImages] = useState({}); // { [cat]: { imageUrl, scale, offsetX, offsetY } }
  const [names, setNames]   = useState({}); // { [cat]: { en, ru, tr } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploadingCat, setUploadingCat] = useState(null);
  const fileCatRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      menuService.categories(),
      settingsService.getCategoryImages(),
      settingsService.getCategoryNames(),
    ])
      .then(([cRes, iRes, nRes]) => {
        if (!active) return;
        const menuCats = cRes.data?.data?.categories || [];
        const list = (menuCats.length ? menuCats : MENU_CATEGORIES).map((c) => c.toLowerCase());
        setCats([...new Set(list)]);
        setImages(iRes.data?.data?.categoryImages || {});
        setNames(nRes.data?.data?.categoryNames || {});
      })
      .catch(() => toast.error('Kategoriler yüklenemedi'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const imgOf  = (cat) => images[cat] || BLANK_IMG;
  const nameOf = (cat) => names[cat] || BLANK_NAME;

  const patchImg = (cat, p) =>
    setImages((prev) => ({ ...prev, [cat]: { ...BLANK_IMG, ...prev[cat], ...p } }));

  const patchName = (cat, lang, val) =>
    setNames((prev) => ({ ...prev, [cat]: { ...BLANK_NAME, ...prev[cat], [lang]: val } }));

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
        patchImg(cat, { imageUrl: url });
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
      const imgPayload = {};
      for (const [cat, v] of Object.entries(images)) {
        if (v?.imageUrl?.trim()) imgPayload[cat] = v;
      }
      const namePayload = {};
      for (const [cat, v] of Object.entries(names)) {
        const entry = {};
        for (const lang of ['en', 'ru', 'tr']) {
          if (v?.[lang]?.trim()) entry[lang] = v[lang].trim();
        }
        if (Object.keys(entry).length) namePayload[cat] = entry;
      }
      const [iRes, nRes] = await Promise.all([
        settingsService.updateCategoryImages(imgPayload),
        settingsService.updateCategoryNames(namePayload),
      ]);
      setImages(iRes.data?.data?.categoryImages || imgPayload);
      setNames(nRes.data?.data?.categoryNames || namePayload);
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
      <PageLayout title="Kategoriler">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Kategoriler">
      {/* Hidden shared file input */}
      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onFile}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
          Kategori adını 3 dilde girin ve müşteri menüsündeki kategori butonunda görünen
          fotoğrafı ekleyin. Ad boşsa varsayılan çeviri, fotoğraf boşsa varsayılan simge kullanılır.
        </Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={save}
          disabled={saving}
          sx={{ flexShrink: 0 }}
        >
          Kaydet
        </Button>
      </Box>

      <Grid container spacing={2}>
        {cats.map((cat) => {
          const img = imgOf(cat);
          const nm  = nameOf(cat);
          const hasImg = !!img.imageUrl;
          return (
            <Grid item xs={12} md={6} key={cat}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 22 }}>{emoji(cat)}</Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ flex: 1, fontFamily: 'monospace' }}>
                      {pretty(cat)}
                    </Typography>
                    {hasImg && (
                      <IconButton size="small" color="error" onClick={() => removeImage(cat)} title="Fotoğrafı kaldır">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {/* İsim — 3 dil */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TextField size="small" label="Ad (EN)" value={nm.en}
                      onChange={(e) => patchName(cat, 'en', e.target.value)} sx={{ flex: '1 1 30%', minWidth: 120 }} />
                    <TextField size="small" label="Ad (RU)" value={nm.ru}
                      onChange={(e) => patchName(cat, 'ru', e.target.value)} sx={{ flex: '1 1 30%', minWidth: 120 }} />
                    <TextField size="small" label="Ad (TR)" value={nm.tr}
                      onChange={(e) => patchName(cat, 'tr', e.target.value)} sx={{ flex: '1 1 30%', minWidth: 120 }} />
                  </Box>

                  <Divider />

                  {/* Fotoğraf */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Fotoğraf URL'si"
                      value={img.imageUrl}
                      onChange={(ev) => patchImg(cat, { imageUrl: ev.target.value })}
                      placeholder="https://ornek.com/foto.jpg"
                      InputProps={{
                        endAdornment: img.imageUrl ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => patchImg(cat, { imageUrl: '' })}>
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
                      imageUrl={img.imageUrl}
                      scale={Number(img.scale) || 1}
                      offsetX={Number(img.offsetX) || 0}
                      offsetY={Number(img.offsetY) || 0}
                      onChange={({ scale, offsetX, offsetY }) => patchImg(cat, { scale, offsetX, offsetY })}
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

      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={save}
          disabled={saving}
        >
          Kaydet
        </Button>
        <Typography variant="caption" color="text.secondary">
          {filledCount} kategoride fotoğraf var
        </Typography>
      </Box>
    </PageLayout>
  );
}
