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
import { startAlert, stopAlert } from '@/utils/alertSound';

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, add, markAllRead } = useNotificationStore();

  // Listen for real-time order events
  const handlers = useMemo(() => ({
    'order:new': (data) => {
      add(
        `Yeni sipariş: ${data.customerName} — ${data.totalPrice} ₺`,
        'order',
        { orderId: data.orderId }
      );
      toast.success(`🍣 Yeni sipariş: ${data.customerName}!`, { duration: 5000 });
      // Ring repeatedly (~1 min) until the admin acknowledges the new order.
      startAlert('order');
    },
  }), [add]);

  useSocket(handlers);

  // Opening the bell counts as "seen" — silence the alert.
  const handleOpen = (e) => { stopAlert(); setAnchorEl(e.currentTarget); };
  const handleClose = () => setAnchorEl(null);

  const handleMarkAllRead = () => { stopAlert(); markAllRead(); };

  const handleClick = (n) => {
    stopAlert();
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
          <Typography variant="subtitle1" fontWeight={700}>Bildirimler</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Tümünü okundu işaretle</Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Bildirim yok</Typography>
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
                  secondary={n.createdAt ? new Date(n.createdAt).toLocaleString('tr-TR') : ''}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: n.read ? 400 : 600 }}
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" onClick={() => { navigate('/notifications'); handleClose(); }}>
            Tüm bildirimler
          </Button>
        </Box>
      </Popover>
    </>
  );
}
