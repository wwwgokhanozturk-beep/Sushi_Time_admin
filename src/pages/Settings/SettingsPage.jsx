import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert,
  Switch, FormControlLabel, InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import TimerIcon from '@mui/icons-material/Timer';
import PageLayout from '@/components/layout/PageLayout';
import { settingsService } from '@/services/settingsService';
import BusinessHoursCard from './components/BusinessHoursCard';
import DistrictMinimumsCard from './components/DistrictMinimumsCard';

export default function SettingsPage() {
  // ── İletişim ─────────────────────────────────────────────────────────────
  const [contactType, setContactType] = useState('whatsapp');
  const [contactNumber, setContactNumber] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactMsg, setContactMsg] = useState(null);

  // ── Slayt gösterisi ──────────────────────────────────────────────────────
  const [autoplay, setAutoplay] = useState(true);
  const [intervalSec, setIntervalSec] = useState(5);
  const [savingSlide, setSavingSlide] = useState(false);
  const [slideMsg, setSlideMsg] = useState(null);

  // ── Sipariş zamanlayıcısı ────────────────────────────────────────────────
  const [orderTimerMin, setOrderTimerMin] = useState(40);
  const [savingTimer, setSavingTimer] = useState(false);
  const [timerMsg, setTimerMsg] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      settingsService.getContact(),
      settingsService.getSlideshow(),
      settingsService.getOrderTimer(),
    ])
      .then(([cRes, sRes, tRes]) => {
        if (!active) return;
        const c = cRes.data?.data?.settings || {};
        setContactType(c.contactType || 'whatsapp');
        setContactNumber(c.contactNumber || '');
        const s = sRes.data?.data?.settings || {};
        setAutoplay(s.autoplay !== false);
        setIntervalSec(Number(s.intervalSec) > 0 ? Number(s.intervalSec) : 5);
        const t = tRes.data?.data?.orderTimer || {};
        setOrderTimerMin(Number(t.minutes) > 0 ? Number(t.minutes) : 40);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const saveContact = async () => {
    setSavingContact(true);
    setContactMsg(null);
    try {
      await settingsService.updateContact({ contactType, contactNumber });
      setContactMsg({ type: 'success', msg: 'Kaydedildi' });
    } catch (e) {
      setContactMsg({ type: 'error', msg: e.response?.data?.message || 'Kaydetme hatası' });
    } finally {
      setSavingContact(false);
    }
  };

  const saveSlideshow = async () => {
    setSavingSlide(true);
    setSlideMsg(null);
    try {
      const sec = Math.min(120, Math.max(1, Math.round(Number(intervalSec) || 5)));
      await settingsService.updateSlideshow({ autoplay, intervalSec: sec });
      setIntervalSec(sec);
      setSlideMsg({ type: 'success', msg: 'Kaydedildi' });
    } catch (e) {
      setSlideMsg({ type: 'error', msg: e.response?.data?.message || 'Kaydetme hatası' });
    } finally {
      setSavingSlide(false);
    }
  };

  const saveOrderTimer = async () => {
    setSavingTimer(true);
    setTimerMsg(null);
    try {
      const min = Math.min(240, Math.max(1, Math.round(Number(orderTimerMin) || 40)));
      await settingsService.updateOrderTimer(min);
      setOrderTimerMin(min);
      setTimerMsg({ type: 'success', msg: 'Kaydedildi' });
    } catch (e) {
      setTimerMsg({ type: 'error', msg: e.response?.data?.message || 'Kaydetme hatası' });
    } finally {
      setSavingTimer(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Ayarlar">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Ayarlar">
      <Box sx={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Çalışma saatleri */}
        <BusinessHoursCard />

        {/* Bölge bazlı minimum sipariş */}
        <DistrictMinimumsCard />

        {/* İletişim */}
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>İletişim numarası</Typography>
              <Typography variant="body2" color="text.secondary">
                Web sitesinde ve uygulamada gösterilir — ana sayfada ve sohbette.
              </Typography>
            </Box>

            {contactMsg && <Alert severity={contactMsg.type}>{contactMsg.msg}</Alert>}

            <FormControl fullWidth>
              <InputLabel id="contact-type-label">İletişim türü</InputLabel>
              <Select
                labelId="contact-type-label"
                label="İletişim türü"
                value={contactType}
                onChange={(e) => setContactType(e.target.value)}
              >
                <MenuItem value="whatsapp">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} /> WhatsApp
                  </Box>
                </MenuItem>
                <MenuItem value="phone">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" /> Telefon
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Numara"
              placeholder="+90 555 000 0000"
              fullWidth
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              helperText="Numarayı uluslararası formatta girin, örn. +90 555 000 0000"
            />

            <Box>
              <Button
                variant="contained"
                startIcon={savingContact ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={saveContact}
                disabled={savingContact}
              >
                Kaydet
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Sipariş zamanlayıcısı */}
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon fontSize="small" /> Sipariş zamanlayıcısı
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sipariş verildikten sonra takip sayfasında başlayan geri sayımın süresi.
              </Typography>
            </Box>

            {timerMsg && <Alert severity={timerMsg.type}>{timerMsg.msg}</Alert>}

            <TextField
              label="Süre"
              type="number"
              value={orderTimerMin}
              onChange={(e) => setOrderTimerMin(e.target.value)}
              inputProps={{ min: 1, max: 240 }}
              InputProps={{ endAdornment: <InputAdornment position="end">dk</InputAdornment> }}
              helperText="1 ila 240 dakika"
              sx={{ maxWidth: 220 }}
            />

            <Box>
              <Button
                variant="contained"
                startIcon={savingTimer ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={saveOrderTimer}
                disabled={savingTimer}
              >
                Kaydet
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Slayt gösterisi */}
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SlideshowIcon fontSize="small" /> Menüde fotoğraf slaytı
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bir üründe birden fazla fotoğraf varsa. Otomatik — fotoğraflar kendiliğinden
                geçer; kapatırsanız müşteri elle (kaydırarak) geçer.
              </Typography>
            </Box>

            {slideMsg && <Alert severity={slideMsg.type}>{slideMsg.msg}</Alert>}

            <FormControlLabel
              control={<Switch checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />}
              label={autoplay ? 'Otomatik geçiş açık' : 'Otomatik kapalı (elle kaydırma)'}
            />

            <TextField
              label="Geçiş aralığı"
              type="number"
              value={intervalSec}
              onChange={(e) => setIntervalSec(e.target.value)}
              disabled={!autoplay}
              inputProps={{ min: 1, max: 120 }}
              InputProps={{ endAdornment: <InputAdornment position="end">sn</InputAdornment> }}
              helperText="1 ila 120 saniye"
              sx={{ maxWidth: 220 }}
            />

            <Box>
              <Button
                variant="contained"
                startIcon={savingSlide ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={saveSlideshow}
                disabled={savingSlide}
              >
                Kaydet
              </Button>
            </Box>
          </CardContent>
        </Card>

      </Box>
    </PageLayout>
  );
}
