import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  CircularProgress, Alert, InputAdornment, Grid, Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PlaceIcon from '@mui/icons-material/Place';
import { settingsService } from '@/services/settingsService';

/**
 * Bölge bazlı minimum sipariş — admin sets a minimum order amount (₺) per
 * Alanya district. 0 = sınırsız (no minimum). The customer checkout enforces it.
 */
export default function DistrictMinimumsCard() {
  const [districts, setDistricts] = useState([]); // [{ name, minOrder }]
  const [values, setValues] = useState({});       // { [name]: string }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let active = true;
    settingsService.getDistrictMinimums()
      .then((res) => {
        if (!active) return;
        const list = res.data?.data?.districts || [];
        setDistricts(list);
        const v = {};
        list.forEach((d) => { v[d.name] = d.minOrder ? String(d.minOrder) : ''; });
        setValues(v);
      })
      .catch(() => setMsg({ type: 'error', msg: 'Bölgeler yüklenemedi' }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const setVal = (name) => (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setValues((prev) => ({ ...prev, [name]: raw }));
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const minimums = {};
      for (const d of districts) {
        const n = Number(values[d.name]) || 0;
        if (n > 0) minimums[d.name] = n;
      }
      const res = await settingsService.updateDistrictMinimums(minimums);
      const list = res.data?.data?.districts || districts;
      setDistricts(list);
      const v = {};
      list.forEach((d) => { v[d.name] = d.minOrder ? String(d.minOrder) : ''; });
      setValues(v);
      setMsg({ type: 'success', msg: 'Kaydedildi' });
    } catch (e) {
      setMsg({ type: 'error', msg: e.response?.data?.message || 'Kaydetme hatası' });
    } finally {
      setSaving(false);
    }
  };

  const activeCount = districts.filter((d) => Number(values[d.name]) > 0).length;

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlaceIcon fontSize="small" /> Bölge bazlı minimum sipariş
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Her Alanya bölgesi için minimum sipariş tutarı (₺). Boş veya 0 =
            sınırsız. Müşteri, adres bölgesini seçtiğinde tutar dolmadan sipariş veremez.
          </Typography>
        </Box>

        {msg && <Alert severity={msg.type}>{msg.msg}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={26} /></Box>
        ) : (
          <>
            <Grid container spacing={1.5}>
              {districts.map((d) => {
                const n = Number(values[d.name]) || 0;
                return (
                  <Grid item xs={12} sm={6} key={d.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ flex: 1, fontWeight: 600 }}>{d.name}</Typography>
                      <TextField
                        size="small"
                        value={values[d.name] ?? ''}
                        onChange={setVal(d.name)}
                        placeholder="0"
                        inputProps={{ inputMode: 'numeric', style: { textAlign: 'right', width: 70 } }}
                        InputProps={{ endAdornment: <InputAdornment position="end">₺</InputAdornment> }}
                      />
                      {n > 0
                        ? <Chip size="small" color="warning" label={`min ${n}₺`} sx={{ width: 84 }} />
                        : <Chip size="small" variant="outlined" label="Sınırsız" sx={{ width: 84 }} />}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={save}
                disabled={saving}
              >
                Kaydet
              </Button>
              <Typography variant="caption" color="text.secondary">
                {activeCount} bölgede minimum var
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
