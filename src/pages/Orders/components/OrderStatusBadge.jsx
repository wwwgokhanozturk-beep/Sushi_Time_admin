import React from 'react';
import { Chip } from '@mui/material';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';

export default function OrderStatusBadge({ status }) {
  return (
    <Chip
      label={STATUS_LABELS[status] ?? status}
      color={STATUS_COLORS[status] ?? 'default'}
      size="small"
      sx={{ fontWeight: 700, borderRadius: 1.5 }}
    />
  );
}
