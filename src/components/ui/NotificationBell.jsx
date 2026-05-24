import React, { useState, useMemo, useCallback } from 'react';
import {
  IconButton, Badge, Popover, Box, Typography, List,
  ListItemButton, ListItemText, Divider, Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { useNavigate } from 'react-router-dom';
import useSocket from '@/hooks/useSocket';
import toast from 'react-hot-toast';

/** Play a short "ding-ding" notification sound using the Web Audio API. */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Two ascending tones: 880 Hz → 1100 Hz
    playTone(880,  ctx.currentTime,        0.18);
    playTone(1100, ctx.currentTime + 0.20, 0.22);
  } catch {
    // Web Audio API may be unavailable — silently skip
  }
}

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, add, markAllRead } = useNotificationStore();

  // Listen for real-time order events
  const handlers = useMemo(() => ({
    'order:new': (data) => {
      add(
        `Новый заказ от ${data.customerName} — ${data.totalPrice} TRY`,
        'order',
        { orderId: data.orderId }
      );
      toast.success(`🍣 Новый заказ от ${data.customerName}!`, { duration: 5000 });
      playNotificationSound();
    },
  }), [add]);

  useSocket(handlers);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleClick = (n) => {
    useNotificationStore.getState().markAsRead(n.id);
    if (n.data?.orderId) {
      navigate(`/orders/${n.data.orderId}`);
    }
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, maxHeight: 440, borderRadius: 2 } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>Уведомления</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllRead}>Прочитать все</Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Нет уведомлений</Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 0, maxHeight: 350, overflow: 'auto' }}>
            {notifications.slice(0, 20).map((n) => (
              <ListItemButton
                key={n.id}
                onClick={() => handleClick(n)}
                sx={{ bgcolor: n.read ? 'transparent' : 'action.hover' }}
              >
                <ListItemText
                  primary={n.msg}
                  secondary={n.createdAt ? new Date(n.createdAt).toLocaleString('ru-RU') : ''}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: n.read ? 400 : 600 }}
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" onClick={() => { navigate('/notifications'); handleClose(); }}>
            Все уведомления
          </Button>
        </Box>
      </Popover>
    </>
  );
}
