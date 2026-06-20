import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import { io } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { chatService } from '@/services/chatService';
import { useAuthStore } from '@/store/authStore';
import { useNotification } from '@/hooks/useNotification';
import { useChatNotificationStore } from '@/store/chatNotificationStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const getCustomerName = (thread) =>
  thread?.customer?.name || thread?.customer?.phone || thread?.customer?.email || 'Customer';

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const upsertMessage = (current, incoming) => {
  const list = current || [];
  const existingIndex = list.findIndex(
    (item) =>
      item._id === incoming._id ||
      (incoming.clientTempId && item.clientTempId === incoming.clientTempId)
  );

  if (existingIndex === -1) return [...list, incoming];

  const next = [...list];
  next[existingIndex] = { ...next[existingIndex], ...incoming };
  return next;
};

export default function ChatPage() {
  const token = useAuthStore((s) => s.token);
  const notify = useNotification();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const selectedThreadRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const markThreadRead = useChatNotificationStore((s) => s.markThreadRead);

  const [selectedThread, setSelectedThread] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const notifyRef = useRef(notify);
  const queryClientRef = useRef(queryClient);
  useEffect(() => { notifyRef.current = notify; }, [notify]);
  useEffect(() => { queryClientRef.current = queryClient; }, [queryClient]);

  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['chatThreads'],
    queryFn: () => chatService.getThreads({ limit: 100 }).then((res) => res.data.data),
  });

  const threads = threadsData?.threads || [];

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', selectedThread?._id],
    queryFn: () => chatService.getMessages(selectedThread._id).then((res) => res.data.data),
    enabled: Boolean(selectedThread?._id),
  });

  const messages = messagesData?.messages || [];

  useEffect(() => {
    selectedThreadRef.current = selectedThread;
    if (selectedThread?._id) {
      markThreadRead(selectedThread._id);
      // Сразу гасим серверный счётчик непрочитанных в кэше списка (без перезагрузки)
      queryClient.setQueryData(['chatThreads'], (old) => {
        if (!old?.threads) return old;
        return {
          ...old,
          threads: old.threads.map((t) =>
            t._id === selectedThread._id ? { ...t, unreadForAdmin: 0 } : t
          ),
        };
      });
    }
  }, [selectedThread, markThreadRead, queryClient]);

  // Auto-select thread when arriving from the chat notification bell
  useEffect(() => {
    const wantedId = searchParams.get('threadId');
    if (!wantedId || !threads.length) return;
    if (selectedThread?._id === wantedId) return;
    const match = threads.find((t) => t._id === wantedId);
    if (match) {
      setSelectedThread(match);
      // Clear the param so re-selecting another thread works normally
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, threads, selectedThread?._id, setSearchParams]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      // polling first guarantees the connection over HTTPS, then upgrades to websocket
      transports: ['polling', 'websocket'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('chat:message', ({ thread, message, clientTempId }) => {
      const qc = queryClientRef.current;
      // Если этот тред сейчас открыт — он считается прочитанным (бейдж не всплывает)
      const isOpen = selectedThreadRef.current?._id === thread._id;
      qc.setQueryData(['chatThreads'], (old) => {
        const current = old?.threads || [];
        const without = current.filter((item) => item._id !== thread._id);
        const merged = isOpen ? { ...thread, unreadForAdmin: 0 } : thread;
        return {
          ...(old || {}),
          threads: [merged, ...without],
        };
      });

      if (selectedThreadRef.current?._id === thread._id) {
        qc.setQueryData(['chatMessages', thread._id], (old) => {
          const current = old?.messages || [];
          return {
            ...(old || { thread }),
            thread,
            messages: upsertMessage(current, { ...message, clientTempId }),
          };
        });
        setSelectedThread(thread);
      } else if (message.sender === 'customer') {
        notifyRef.current.info(`${getCustomerName(thread)} yeni mesaj gönderdi`);
      }
    });

    socket.on('connect_error', (err) => {
      notifyRef.current.error(err.message || 'Sohbet bağlantısı başarısız');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedThread?._id]);

  const selectedCustomer = useMemo(() => getCustomerName(selectedThread), [selectedThread]);

  const handleSend = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedThread) return;

    setSending(true);
    setMessageText('');
    const clientTempId = `admin-${Date.now()}`;
    const optimisticMessage = {
      _id: clientTempId,
      clientTempId,
      sender: 'admin',
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    const optimisticThread = {
      ...selectedThread,
      lastMessage: text,
      lastMessageAt: optimisticMessage.createdAt,
    };

    queryClient.setQueryData(['chatMessages', selectedThread._id], (old) => ({
      ...(old || { thread: optimisticThread }),
      thread: optimisticThread,
      messages: upsertMessage(old?.messages, optimisticMessage),
    }));
    queryClient.setQueryData(['chatThreads'], (old) => {
      const current = old?.threads || [];
      const without = current.filter((item) => item._id !== selectedThread._id);
      return {
        ...(old || {}),
        threads: [optimisticThread, ...without],
      };
    });
    setSelectedThread(optimisticThread);

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit(
        'chat:admin_reply',
        {
          threadId: selectedThread._id,
          customerId: selectedThread.customer?._id || selectedThread.customer,
          text,
          clientTempId,
        },
        (ack) => {
          setSending(false);
          if (!ack?.success) {
            queryClient.invalidateQueries({ queryKey: ['chatThreads'] });
            queryClient.invalidateQueries({ queryKey: ['chatMessages', selectedThread._id] });
            setMessageText(text);
            notify.error(ack?.message || 'Mesaj gönderilemedi');
            return;
          }

          const payload = ack.data;
          if (payload?.thread && payload?.message) {
            queryClient.setQueryData(['chatThreads'], (old) => {
              const current = old?.threads || [];
              const without = current.filter((item) => item._id !== payload.thread._id);
              return {
                ...(old || {}),
                threads: [payload.thread, ...without],
              };
            });
            queryClient.setQueryData(['chatMessages', payload.thread._id], (old) => ({
              ...(old || { thread: payload.thread }),
              thread: payload.thread,
              messages: upsertMessage(old?.messages, {
                ...payload.message,
                clientTempId: payload.clientTempId,
              }),
            }));
            setSelectedThread(payload.thread);
          }
        }
      );
      return;
    }

    try {
      const res = await chatService.sendMessage(selectedThread._id, text);
      const payload = res.data?.data;
      if (payload?.thread && payload?.message) {
        queryClient.setQueryData(['chatThreads'], (old) => {
          const current = old?.threads || [];
          const without = current.filter((item) => item._id !== payload.thread._id);
          return {
            ...(old || {}),
            threads: [payload.thread, ...without],
          };
        });
        queryClient.setQueryData(['chatMessages', payload.thread._id], (old) => ({
          ...(old || { thread: payload.thread }),
          thread: payload.thread,
          messages: upsertMessage(old?.messages, {
            ...payload.message,
            clientTempId,
          }),
        }));
        setSelectedThread(payload.thread);
      }
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: ['chatThreads'] });
      queryClient.invalidateQueries({ queryKey: ['chatMessages', selectedThread._id] });
      setMessageText(text);
      notify.error(err.response?.data?.message || 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout title="Sohbet">
      <Paper
        sx={{
          height: 'calc(100vh - 112px)',
          minHeight: 560,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '330px 1fr' },
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderRight: { md: '1px solid #E5E7EB' }, overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={800}>
              Müşteri sohbetleri
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mobil müşterilerden canlı mesajlar
            </Typography>
          </Box>
          <Divider />
          {threadsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <List disablePadding>
              {threads.map((thread) => {
                const active = selectedThread?._id === thread._id;
                return (
                  <ListItemButton
                    key={thread._id}
                    selected={active}
                    onClick={() => setSelectedThread(thread)}
                    sx={{ alignItems: 'flex-start', py: 1.5 }}
                  >
                    <ListItemAvatar>
                      <Badge color="error" badgeContent={thread.unreadForAdmin || 0}>
                        <Avatar sx={{ bgcolor: active ? 'primary.main' : 'secondary.main' }}>
                          {getCustomerName(thread).slice(0, 1).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getCustomerName(thread)}
                      secondary={thread.lastMessage || 'No messages yet'}
                      primaryTypographyProps={{ fontWeight: 800, noWrap: true }}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                );
              })}
              {!threads.length && (
                <Box sx={{ px: 3, py: 5, textAlign: 'center' }}>
                  <ChatIcon color="disabled" sx={{ fontSize: 42, mb: 1 }} />
                  <Typography color="text.secondary">Henüz müşteri mesajı yok</Typography>
                </Box>
              )}
            </List>
          )}
        </Box>

        <Box sx={{ display: 'flex', minHeight: 0, flexDirection: 'column' }}>
          {selectedThread ? (
            <>
              <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB' }}>
                <Typography variant="h6" fontWeight={800}>
                  {selectedCustomer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedThread.customer?.phone || selectedThread.customer?.email || 'Mobil müşteri'}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#F8F8F8' }}>
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender === 'admin';
                    return (
                      <Box
                        key={message._id}
                        sx={{
                          display: 'flex',
                          justifyContent: mine ? 'flex-end' : 'flex-start',
                          mb: 1.25,
                          pr: mine ? 1 : 0,
                          pl: mine ? 0 : 1,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '72%',
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: mine ? 'primary.main' : 'background.paper',
                            color: mine ? 'primary.contrastText' : 'text.primary',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          }}
                        >
                          <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {message.text}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mt: 0.5, opacity: 0.72, textAlign: 'right' }}
                          >
                            {formatTime(message.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </Box>

              <Box component="form" onSubmit={handleSend} sx={{ p: 2, display: 'flex', gap: 1 }}>
                <TextField
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Yanıt yazın"
                  fullWidth
                  multiline
                  maxRows={4}
                  disabled={sending}
                />
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={sending || !messageText.trim()}
                  sx={{ alignSelf: 'flex-end', minHeight: 56 }}
                >
                  Gönder
                </Button>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                px: 3,
              }}
            >
              <Box>
                <ChatIcon color="disabled" sx={{ fontSize: 56, mb: 1 }} />
                <Typography variant="h6" fontWeight={800}>
                  Bir sohbet seçin
                </Typography>
                <Typography color="text.secondary">
                  Müşteri mesajları burada anlık olarak görünecek.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </PageLayout>
  );
}
