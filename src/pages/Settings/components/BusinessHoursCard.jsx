import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Switch,
  FormControlLabel, CircularProgress, Alert, Chip, Divider, Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { settingsService } from '@/services/settingsService';

// Дни недели: индекс совпадает с Date.getDay() (0=Pazar). Показываем Pzt→Pzr.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = {
  1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe',
  5: 'Cuma', 6: 'Cumartesi', 0: 'Pazar',
};

const emptyWeek = () =>
  Array.from({ length: 7 }, () => ({ closed: false, open: '10:00', close: '23:00' }));

// 'YYYY-MM-DD' -> 'DD.MM.YYYY'
const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

export default function BusinessHoursCard() {
  const [enabled, setEnabled] = useState(false);
  const [week, setWeek] = useState(emptyWeek());
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let active = true;
    settingsService.getBusinessHours()
      .then((res) => {
        if (!active) return;
        const bh = res.data?.data?.businessHours || {};
        setEnabled(!!bh.enabled);
        setWeek(Array.isArray(bh.week) && bh.week.length === 7 ? bh.week : emptyWeek());
        setHolidays(Array.isArray(bh.holidays) ? bh.holidays : []);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const setDay = (idx, patch) =>
    setWeek((w) => w.map((d, i) => (i === idx ? { ...d, ...patch } : d)));

  const addHoliday = () => {
    if (!newHoliday) return;
    setHolidays((h) => (h.includes(newHoliday) ? h : [...h, newHoliday].sort()));
    setNewHoliday('');
  };

  const removeHoliday = (date) => setHolidays((h) => h.filter((d) => d !== date));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await settingsService.updateBusinessHours({ enabled, week, holidays });
      setMsg({ type: 'success', msg: 'Kaydedildi' });
    } catch (e) {
      setMsg({ type: 'error', msg: e.response?.data?.message || 'Kaydetme hatası' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon fontSize="small" /> Çalışma saatleri
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kapalı olduğunuz gün ve saatlerde site sipariş almaz; müşteriye uyarı gösterilir.
          </Typography>
        </Box>

        {msg && <Alert severity={msg.type}>{msg.msg}</Alert>}

        <FormControlLabel
          control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          label={enabled ? 'Çalışma saatleri aktif' : 'Kapalı (her zaman açık kabul edilir)'}
        />

        <Box sx={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {DAY_ORDER.map((idx) => {
            const day = week[idx];
            return (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography sx={{ width: 96, fontWeight: 600, fontSize: 14 }}>
                  {DAY_LABELS[idx]}
                </Typography>
                <FormControlLabel
                  sx={{ width: 110, m: 0 }}
                  control={
                    <Switch
                      size="small"
                      checked={!day.closed}
                      onChange={(e) => setDay(idx, { closed: !e.target.checked })}
                    />
                  }
                  label={<Typography variant="body2">{day.closed ? 'Kapalı' : 'Açık'}</Typography>}
                />
                <TextField
                  type="time" size="small" value={day.open}
                  onChange={(e) => setDay(idx, { open: e.target.value })}
                  disabled={day.closed}
                  sx={{ width: 130 }}
                />
                <Typography sx={{ color: 'text.secondary' }}>—</Typography>
                <TextField
                  type="time" size="small" value={day.close}
                  onChange={(e) => setDay(idx, { close: e.target.value })}
                  disabled={day.closed}
                  sx={{ width: 130 }}
                />
              </Box>
            );
          })}
        </Box>

        <Divider />

        <Box sx={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <EventBusyIcon fontSize="small" /> Tatil / izin günleri
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TextField
              type="date" size="small"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button startIcon={<AddIcon />} onClick={addHoliday} disabled={!newHoliday}>
              Ekle
            </Button>
          </Box>
          {holidays.length > 0 ? (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {holidays.map((date) => (
                <Chip key={date} label={fmtDate(date)} onDelete={() => removeHoliday(date)} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">Eklenmiş tatil günü yok.</Typography>
          )}
        </Box>

        <Box>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={save}
            disabled={saving}
          >
            Kaydet
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
