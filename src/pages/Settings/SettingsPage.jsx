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
import PageLayout from '@/components/layout/PageLayout';
import { settingsService } from '@/services/settingsService';

export default function SettingsPage() {
  // ── Contact ──────────────────────────────────────────────────────────────
  const [contactType, setContactType] = useState('whatsapp');
  const [contactNumber, setContactNumber] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactMsg, setContactMsg] = useState(null);

  // ── Slideshow ────────────────────────────────────────────────────────────
  const [autoplay, setAutoplay] = useState(true);
  const [intervalSec, setIntervalSec] = useState(5);
  const [savingSlide, setSavingSlide] = useState(false);
  const [slideMsg, setSlideMsg] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([settingsService.getContact(), settingsService.getSlideshow()])
      .then(([cRes, sRes]) => {
        if (!active) return;
        const c = cRes.data?.data?.settings || {};
        setContactType(c.contactType || 'whatsapp');
        setContactNumber(c.contactNumber || '');
        const s = sRes.data?.data?.settings || {};
        setAutoplay(s.autoplay !== false);
        setIntervalSec(Number(s.intervalSec) > 0 ? Number(s.intervalSec) : 5);
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
      setContactMsg({ type: 'success', msg: 'Сохранено' });
    } catch (e) {
      setContactMsg({ type: 'error', msg: e.response?.data?.message || 'Ошибка сохранения' });
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
      setSlideMsg({ type: 'success', msg: 'Сохранено' });
    } catch (e) {
      setSlideMsg({ type: 'error', msg: e.response?.data?.message || 'Ошибка сохранения' });
    } finally {
      setSavingSlide(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Settings">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings">
      <Box sx={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Contact */}
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Контактный номер</Typography>
              <Typography variant="body2" color="text.secondary">
                Отображается на сайте и в приложении — на главной и в чате.
              </Typography>
            </Box>

            {contactMsg && <Alert severity={contactMsg.type}>{contactMsg.msg}</Alert>}

            <FormControl fullWidth>
              <InputLabel id="contact-type-label">Тип контакта</InputLabel>
              <Select
                labelId="contact-type-label"
                label="Тип контакта"
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
                    <PhoneIcon fontSize="small" /> Телефон
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Номер"
              placeholder="+90 555 000 0000"
              fullWidth
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              helperText="Укажите номер в международном формате, например +90 555 000 0000"
            />

            <Box>
              <Button
                variant="contained"
                startIcon={savingContact ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={saveContact}
                disabled={savingContact}
              >
                Сохранить
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Slideshow */}
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SlideshowIcon fontSize="small" /> Слайдшоу фото в меню
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Если у блюда несколько фото. Авто — фото листаются сами; выключите —
                клиент будет листать вручную (свайпом).
              </Typography>
            </Box>

            {slideMsg && <Alert severity={slideMsg.type}>{slideMsg.msg}</Alert>}

            <FormControlLabel
              control={<Switch checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />}
              label={autoplay ? 'Авто-перелистывание включено' : 'Авто выключено (ручной свайп)'}
            />

            <TextField
              label="Интервал смены"
              type="number"
              value={intervalSec}
              onChange={(e) => setIntervalSec(e.target.value)}
              disabled={!autoplay}
              inputProps={{ min: 1, max: 120 }}
              InputProps={{ endAdornment: <InputAdornment position="end">сек</InputAdornment> }}
              helperText="От 1 до 120 секунд"
              sx={{ maxWidth: 220 }}
            />

            <Box>
              <Button
                variant="contained"
                startIcon={savingSlide ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={saveSlideshow}
                disabled={savingSlide}
              >
                Сохранить
              </Button>
            </Box>
          </CardContent>
        </Card>

      </Box>
    </PageLayout>
  );
}
