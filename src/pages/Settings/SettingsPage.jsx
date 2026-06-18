import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import PageLayout from '@/components/layout/PageLayout';
import { settingsService } from '@/services/settingsService';

export default function SettingsPage() {
  const [contactType, setContactType] = useState('whatsapp');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, msg }

  useEffect(() => {
    let active = true;
    settingsService.getContact()
      .then((res) => {
        if (!active) return;
        const s = res.data?.data?.settings || {};
        setContactType(s.contactType || 'whatsapp');
        setContactNumber(s.contactNumber || '');
      })
      .catch(() => active && setFeedback({ type: 'error', msg: 'Не удалось загрузить настройки' }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await settingsService.updateContact({ contactType, contactNumber });
      setFeedback({ type: 'success', msg: 'Сохранено' });
    } catch (e) {
      setFeedback({ type: 'error', msg: e.response?.data?.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="Settings">
      <Box sx={{ maxWidth: 560 }}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Контактный номер</Typography>
              <Typography variant="body2" color="text.secondary">
                Отображается на сайте и в приложении — на главной и в чате.
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
              <>
                {feedback && <Alert severity={feedback.type}>{feedback.msg}</Alert>}

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
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    Сохранить
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageLayout>
  );
}
