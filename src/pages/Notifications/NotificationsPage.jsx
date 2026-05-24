import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PageLayout from '@/components/layout/PageLayout';
import { notificationService } from '@/services/notificationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@/hooks/useNotification';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const notify = useNotification();
  const queryClient = useQueryClient();

  // Fetch broadcast history
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getHistory({ limit: 50 }).then((r) => r.data.data),
  });

  const broadcastMutation = useMutation({
    mutationFn: () => notificationService.broadcast(title, body),
    onSuccess: (res) => {
      const count = res.data?.data?.notification?.recipientCount ?? 0;
      notify.success(`Рассылка отправлена ${count} пользователям`);
      setTitle('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Ошибка отправки');
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    broadcastMutation.mutate();
  };

  return (
    <PageLayout title="Рассылка уведомлений">
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Broadcast form */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Отправить новость всем пользователям
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Push-уведомление получат все пользователи мобильного приложения, у которых включены уведомления.
          </Alert>
          <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="Текст сообщения"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              fullWidth
              multiline
              rows={3}
              inputProps={{ maxLength: 500 }}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<SendIcon />}
              disabled={broadcastMutation.isPending || !title.trim() || !body.trim()}
              sx={{ alignSelf: 'flex-end' }}
            >
              {broadcastMutation.isPending ? 'Отправка…' : 'Отправить'}
            </Button>
          </Box>
        </Paper>

        {/* History table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            История рассылок
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell>Заголовок</TableCell>
                    <TableCell>Текст</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell align="right">Получатели</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.notifications?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">Нет отправленных рассылок</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.notifications?.map((n) => (
                    <TableRow key={n._id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(n.createdAt).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell>{n.title}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.body}
                      </TableCell>
                      <TableCell>
                        <Chip label={n.type} size="small" color={n.type === 'broadcast' ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell align="right">{n.recipientCount}</TableCell>
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
