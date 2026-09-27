import React, { useState } from 'react';
import { Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chatService';
import { useNotification } from '@/hooks/useNotification';

// wa.me wants the full international number, digits only. Customers type
// Turkish numbers every which way: 0532…, 532…, +90 532…, 0090 532….
export function whatsappUrl(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = `9${digits}`;
  else if (digits.length === 10 && digits.startsWith('5')) digits = `90${digits}`;
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

/**
 * "Write to this customer" from an order.
 * Registered customer → opens (or starts) their private chat thread: only
 * they see it, in the app/site chat, and they get a push about each message.
 * Guest order → there is no chat for guests, so WhatsApp on the order's phone.
 */
export default function OrderChatButton({ order, variant = 'icon' }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useNotification();
  const [opening, setOpening] = useState(false);

  const customerId = order?.user?._id || (typeof order?.user === 'string' ? order.user : null);
  const waUrl = customerId ? null : whatsappUrl(order?.phone);

  const openChat = async (e) => {
    e.stopPropagation();
    setOpening(true);
    try {
      const res = await chatService.startWithCustomer(customerId);
      const thread = res.data?.data?.thread;
      // A brand-new thread isn't in the cached list yet — refetch it.
      await queryClient.invalidateQueries({ queryKey: ['chatThreads'] });
      navigate(`/chat?threadId=${thread._id}`);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Sohbet açılamadı');
      setOpening(false);
    }
  };

  const openWhatsApp = (e) => {
    e.stopPropagation();
    window.open(waUrl, '_blank', 'noopener');
  };

  const title = customerId
    ? 'Müşteriyle sohbet — mesajı yalnızca bu müşteri görür'
    : waUrl
      ? 'Misafir sipariş: uygulamada sohbet yok — WhatsApp’tan yazın'
      : 'Misafir sipariş ve geçerli telefon yok — yazılamıyor';
  const onClick = customerId ? openChat : openWhatsApp;
  const disabled = opening || (!customerId && !waUrl);
  const icon = opening
    ? <CircularProgress size={16} />
    : customerId ? <ChatIcon fontSize="small" /> : <WhatsAppIcon fontSize="small" />;

  if (variant === 'button') {
    return (
      <Tooltip title={title}>
        <span>
          <Button
            size="small"
            variant="outlined"
            color={customerId ? 'primary' : 'success'}
            startIcon={icon}
            onClick={onClick}
            disabled={disabled}
          >
            {customerId ? 'Sohbet' : 'WhatsApp'}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={customerId ? undefined : { color: '#25D366' }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}
