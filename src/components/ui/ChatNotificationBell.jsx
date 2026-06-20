import React, { useMemo, useState } from 'react';
import {
  IconButton, Badge, Popover, Box, Typography, List,
  ListItemButton, ListItemAvatar, Avatar, ListItemText, Divider, Button,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useSocket from '@/hooks/useSocket';
import { useChatNotificationStore } from '@/store/chatNotificationStore';
import { stopAlert, playOnce } from '@/utils/alertSound';

const getCustomerName = (customer) =>
  customer?.name || customer?.phone || customer?.email || 'Customer';

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString();
};

export default function ChatNotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { threads, add, markThreadRead, markAllRead, totalUnread } =
    useChatNotificationStore();

  const unreadCount = useChatNotificationStore((s) =>
    s.threads.reduce((sum, t) => sum + (t.count || 0), 0)
  );

  const handlers = useMemo(() => ({
    'chat:message': (payload) => {
      const message = payload?.message;
      const thread = payload?.thread;
      if (!message || !thread) return;
      // Only notify on customer messages — ignore our own admin echoes
      if (message.sender !== 'customer') return;
      // Skip if admin is already on the chat page viewing this thread
      // (ChatPage marks messages read on the server side)
      const onChat = window.location.pathname.startsWith('/chat');
      if (onChat) {
        // Admin is already in chat — a single soft cue is enough.
        playOnce('chat');
        return;
      }

      const customer = thread.customer || {};
      add({
        threadId: thread._id,
        customerId: customer._id || customer,
        customerName: getCustomerName(customer),
        customerPhone: customer.phone || '',
        lastMessage: message.text,
        lastMessageAt: message.createdAt || new Date().toISOString(),
      });

      // A single soft cue is enough for chat (no repeating ring).
      playOnce('chat');
      toast(`💬 ${getCustomerName(customer)}: ${message.text}`, {
        duration: 5000,
        icon: '💬',
        position: 'bottom-right',
        style: {
          borderRadius: 10,
          fontWeight: 500,
          fontSize: 14,
          maxWidth: 360,
        },
      });
    },
  }), [add]);

  useSocket(handlers);

  const handleOpen = (e) => { stopAlert(); setAnchorEl(e.currentTarget); };
  const handleClose = () => setAnchorEl(null);

  const handleMarkAllRead = () => { stopAlert(); markAllRead(); };

  const handleClick = (thread) => {
    stopAlert();
    markThreadRead(thread.threadId);
    navigate(`/chat?threadId=${thread.threadId}`);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleOpen} title="Chat notifications">
        <Badge badgeContent={unreadCount} color="error">
          <ChatBubbleOutlineIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 380, maxHeight: 480, borderRadius: 2 } }}
      >
        <Box sx={{
          px: 2, py: 1.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Typography variant="subtitle1" fontWeight={700}>Sohbet mesajları</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Tümünü okundu işaretle</Button>
          )}
        </Box>
        <Divider />

        {threads.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ChatBubbleOutlineIcon color="disabled" sx={{ fontSize: 36, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Yeni mesaj yok
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 0, maxHeight: 360, overflow: 'auto' }}>
            {threads.map((t) => (
              <ListItemButton
                key={t.threadId}
                onClick={() => handleClick(t)}
                sx={{
                  bgcolor: t.read ? 'transparent' : 'action.hover',
                  alignItems: 'flex-start',
                  py: 1.25,
                }}
              >
                <ListItemAvatar>
                  <Badge color="error" badgeContent={t.count || 0} overlap="circular">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38 }}>
                      {t.customerName.slice(0, 1).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{
                      display: 'flex', justifyContent: 'space-between', gap: 1,
                    }}>
                      <Typography variant="body2" fontWeight={t.read ? 500 : 700} noWrap>
                        {t.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {formatTime(t.lastMessageAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mt: 0.25,
                      }}
                    >
                      {t.lastMessage}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" onClick={() => { navigate('/chat'); handleClose(); }}>
            Tüm sohbetler
          </Button>
        </Box>
      </Popover>
    </>
  );
}
