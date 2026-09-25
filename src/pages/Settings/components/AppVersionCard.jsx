import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  CircularProgress, Alert, Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import { settingsService } from '@/services/settingsService';

/**
 * Uygulama sürümü — drives the mobile app's update prompt (UpdateNotice):
 *   latest       — installed build older than this gets a closable "update" prompt
 *   minSupported — older than this gets a prompt that cannot be closed
 *   storeUrl     — where the "update" button leads, per platform
 *   notes        — optional text shown in the prompt instead of the default
 * Empty latest/minimum = no prompt at all. Rules mirror the server
 * (settings.controller updateAppVersion) so mistakes are caught before saving.
 */

const VERSION_RE = /^\d+(\.\d+){0,2}$/;
const URL_RE = /^https?:\/\//i;
const ANDROID_DEFAULT = 'https://play.google.com/store/apps/details?id=com.sushitime.app';

// Same comparison as the app and the server: "1.10" > "1.9", "1.2" == "1.2.0".
function compareVersions(a, b) {
  const parse = (v) => String(v ?? '').trim().split('.').map((p) => Number.parseInt(p, 10) || 0);
  const l = parse(a);
  const r = parse(b);
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    const d = (l[i] || 0) - (r[i] || 0);
    if (d) return d;
  }
  return 0;
}

const EMPTY = { latest: '', minSupported: '', android: '', ios: '', notes: '' };

export default function AppVersionCard() {
  const [form, setForm] = useState(EMPTY);
  const [savedMin, setSavedMin] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let active = true;
    settingsService.getAppVersion()
      .then((res) => {
        if (!active) return;
        const v = res.data?.data?.appVersion || {};
        setForm({
          latest: v.latest || '',
          minSupported: v.minSupported || '',
          android: v.storeUrl?.android || '',
          ios: v.storeUrl?.ios || '',
          notes: v.notes || '',
        });
        setSavedMin(v.minSupported || '');
      })
      .catch(() => setMsg({ type: 'error', msg: 'Sürüm ayarları yüklenemedi' }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setMsg(null);
  };

  const latest = form.latest.trim();
  const min = form.minSupported.trim();
  const errors = {
    latest: latest && !VERSION_RE.test(latest) ? 'Örnek biçim: 1.1.8' : '',
    minSupported:
      min && !VERSION_RE.test(min) ? 'Örnek biçim: 1.1.8'
        : min && !latest ? 'Minimum için önce son sürümü girin'
          : min && latest && compareVersions(min, latest) > 0 ? 'Minimum, son sürümden yüksek olamaz'
            : '',
    android: form.android.trim() && !URL_RE.test(form.android.trim()) ? 'https:// ile başlamalı' : '',
    ios: form.ios.trim() && !URL_RE.test(form.ios.trim()) ? 'https:// ile başlamalı' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = async (payload) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await settingsService.updateAppVersion(payload);
      const v = res.data?.data?.appVersion || payload;
      setSavedMin(v.minSupported || '');
      setMsg({ type: 'success', msg: 'Kaydedildi' });
    } catch (e) {
      setMsg({ type: 'error', msg: e.response?.data?.message || 'Kaydetme hatası' });
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (hasErrors) return;
    // Raising the minimum locks older installs out until they update —
    // one wrong digit shuts every customer out, so it is confirmed first.
    if (min && min !== savedMin && !window.confirm(
      `${min} sürümünden eski uygulamalar, güncellenene kadar KULLANILAMAZ. Devam edilsin mi?`,
    )) return;
    submit({
      latest,
      minSupported: min,
      storeUrl: { android: form.android.trim(), ios: form.ios.trim() },
      notes: form.notes.trim(),
    });
  };

  const turnOff = () => {
    if (!window.confirm('Güncelleme bildirimi kapatılsın mı? Mağaza bağlantıları ve metin korunur.')) return;
    setForm((prev) => ({ ...prev, latest: '', minSupported: '' }));
    submit({
      latest: '',
      minSupported: '',
      storeUrl: { android: form.android.trim(), ios: form.ios.trim() },
      notes: form.notes.trim(),
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SystemUpdateIcon fontSize="small" /> Uygulama sürümü
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mağazaya yeni sürüm çıktığında buraya yazın: eski sürümü kullanan müşteriler
            uygulamayı açınca güncelleme daveti görür. Boş bırakılırsa davet gösterilmez.
          </Typography>
        </Box>

        {msg && <Alert severity={msg.type}>{msg.msg}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Son sürüm" placeholder="1.1.8" fullWidth
              value={form.latest} onChange={set('latest')}
              error={!!errors.latest}
              helperText={errors.latest || 'Daha eskisi “Güncelle / Sonra” daveti görür'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Minimum sürüm (isteğe bağlı)" placeholder="1.1.6" fullWidth
              value={form.minSupported} onChange={set('minSupported')}
              error={!!errors.minSupported}
              helperText={errors.minSupported || 'Daha eskisi kapatılamayan davet görür'}
            />
          </Grid>
        </Grid>

        {min && !errors.minSupported && (
          <Alert severity="warning">
            {min} sürümünden eski uygulamalar güncellenmeden kullanılamaz. Yalnızca eski sürüm
            gerçekten çalışmıyorsa (örn. sunucuyla uyumsuz) kullanın.
            {!form.ios.trim() && ' App Store bağlantısı boş: iPhone kullanıcıları engellenmez, yalnızca davet görür.'}
          </Alert>
        )}

        <TextField
          label="Google Play bağlantısı" fullWidth
          placeholder={ANDROID_DEFAULT}
          value={form.android} onChange={set('android')}
          error={!!errors.android}
          helperText={errors.android || 'Boşsa uygulama Google Play sayfasını kendisi bulur'}
        />
        <TextField
          label="App Store bağlantısı" fullWidth
          placeholder="https://apps.apple.com/app/id…"
          value={form.ios} onChange={set('ios')}
          error={!!errors.ios}
          helperText={errors.ios || 'iPhone için gerekli — boşsa iPhone’da “Güncelle” düğmesi çalışmaz'}
        />
        <TextField
          label="Davet metni (isteğe bağlı)" fullWidth multiline minRows={2}
          value={form.notes} onChange={set('notes')}
          inputProps={{ maxLength: 500 }}
          helperText={`Boşsa standart metin gösterilir (dile göre çevrilmiş). Yazılan metin tüm dillerde aynen gösterilir. ${form.notes.length}/500`}
        />

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={save}
            disabled={saving || hasErrors}
          >
            Kaydet
          </Button>
          {(latest || min) && (
            <Button color="inherit" onClick={turnOff} disabled={saving}>
              Daveti kapat
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
