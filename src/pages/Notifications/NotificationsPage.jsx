import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, Alert, Tabs, Tab, Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageLayout from '@/components/layout/PageLayout';
import { notificationService } from '@/services/notificationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@/hooks/useNotification';

// Her telefon duyuruyu uygulamanın dilinde alır. Dilini henüz bildirmeyen
// telefonlar (eski sürüm) üç metni tek mesajda alır — sunucu ile aynı biçim
// (notification.service sendPushByLanguage).
const LANGS = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];
const TITLE_MAX = 100;
const BODY_MAX = 500;
const EMPTY = { tr: { title: '', body: '' }, ru: { title: '', body: '' }, en: { title: '', body: '' } };

const isFilled = (m) => m.title.trim() && m.body.trim();

export default function NotificationsPage() {
  const [messages, setMessages] = useState(EMPTY);
  const [langTab, setLangTab] = useState(0);
  const notify = useNotification();
  const queryClient = useQueryClient();

  const lang = LANGS[langTab].code;
  const current = messages[lang];
  const allFilled = LANGS.every((l) => isFilled(messages[l.code]));

  // Fetch broadcast history
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getHistory({ limit: 50 }).then((r) => r.data.data),
  });

  // How many devices will get each language
  const { data: audience } = useQuery({
    queryKey: ['notifications', 'audience'],
    queryFn: () => notificationService.getAudience().then((r) => r.data.data.audience),
  });

  const broadcastMutation = useMutation({
    mutationFn: () => notificationService.broadcastByLanguage(
      Object.fromEntries(LANGS.map(({ code }) => [code, {
        title: messages[code].title.trim(),
        body: messages[code].body.trim(),
      }])),
    ),
    onSuccess: (res) => {
      const count = res.data?.data?.notification?.recipientCount ?? 0;
      notify.success(`Bildirim ${count} cihaza gönderildi`);
      setMessages(EMPTY);
      setLangTab(0);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Gönderim hatası');
    },
  });

  const setField = (field) => (e) => {
    const value = e.target.value;
    setMessages((prev) => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!allFilled) return;
    const total = audience ? Object.values(audience).reduce((a, b) => a + b, 0) : null;
    if (!window.confirm(`Duyuru ${total ?? 'tüm'} cihaza gönderilsin mi? Geri alınamaz.`)) return;
    broadcastMutation.mutate();
  };

  // Eski sürümlerin göreceği birleşik mesaj
  const combinedPreview = LANGS
    .map((l) => `${l.flag} ${messages[l.code].title.trim() || '…'} — ${messages[l.code].body.trim() || '…'}`)
    .join('\n\n');

  return (
    <PageLayout title="Bildirim Gönderimi">
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Broadcast form */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Tüm kullanıcılara duyuru gönder
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Her dil için ayrı metin yazın: her telefon duyuruyu uygulamada seçili dilde alır.
            Push bildirimi yalnızca bildirimleri açık olan mobil uygulama kullanıcılarına gider.
          </Alert>

          {audience && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {LANGS.map((l) => (
                <Chip key={l.code} size="small" label={`${l.flag} ${l.label}: ${audience[l.code] ?? 0}`} />
              ))}
              <Tooltip title="Uygulamanın dilini henüz bildirmeyen eski sürümler — üç metni tek mesajda alır">
                <Chip size="small" variant="outlined" label={`Dili bilinmeyen: ${audience.unknown ?? 0}`} />
              </Tooltip>
            </Box>
          )}

          <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tabs value={langTab} onChange={(_, v) => setLangTab(v)} sx={{ minHeight: 40 }}>
              {LANGS.map((l) => (
                <Tab
                  key={l.code}
                  sx={{ minHeight: 40 }}
                  iconPosition="end"
                  icon={isFilled(messages[l.code]) ? <CheckCircleIcon color="success" fontSize="small" /> : undefined}
                  label={`${l.flag} ${l.label}`}
                />
              ))}
            </Tabs>

            <TextField
              label={`Başlık (${LANGS[langTab].label})`}
              value={current.title}
              onChange={setField('title')}
              fullWidth
              inputProps={{ maxLength: TITLE_MAX }}
            />
            <TextField
              label={`Mesaj metni (${LANGS[langTab].label})`}
              value={current.body}
              onChange={setField('body')}
              fullWidth
              multiline
              rows={3}
              inputProps={{ maxLength: BODY_MAX }}
              helperText={`${current.body.length}/${BODY_MAX}`}
            />

            {(audience?.unknown ?? 0) > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Dili bilinmeyen {audience.unknown} cihaz bu mesajı alır:
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, whiteSpace: 'pre-line', fontSize: 13 }}>
                  <b>Sushi Time</b>{'\n'}{combinedPreview}
                </Paper>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
              {!allFilled && (
                <Typography variant="body2" color="text.secondary">
                  Göndermek için üç dilin de başlığını ve metnini doldurun
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={broadcastMutation.isPending || !allFilled}
              >
                {broadcastMutation.isPending ? 'Gönderiliyor…' : 'Gönder'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* History table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Gönderim geçmişi
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Başlık</TableCell>
                    <TableCell>Metin</TableCell>
                    <TableCell>Tür</TableCell>
                    <TableCell align="right">Alıcılar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.notifications?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">Gönderilmiş bildirim yok</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.notifications?.map((n) => (
                    <TableRow key={n._id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(n.createdAt).toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        {n.title}
                        {n.translations && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            🇷🇺 {n.translations.ru?.title} · 🇬🇧 {n.translations.en?.title}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.body}
                      </TableCell>
                      <TableCell>
                        <Chip label={n.type} size="small" color={n.type === 'broadcast' ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        {n.recipients ? (
                          <Tooltip title={`🇹🇷 ${n.recipients.tr ?? 0} · 🇷🇺 ${n.recipients.ru ?? 0} · 🇬🇧 ${n.recipients.en ?? 0} · ? ${n.recipients.unknown ?? 0}`}>
                            <span>{n.recipientCount}</span>
                          </Tooltip>
                        ) : n.recipientCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </PageLayout>
  );
}
