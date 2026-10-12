import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import AppleIcon    from '@mui/icons-material/Apple';
import AndroidIcon  from '@mui/icons-material/Android';
import LanguageIcon from '@mui/icons-material/Language';
import { PLATFORM_LABELS } from '@/utils/constants';

// Where the order was placed: iOS app, Android app or the website. Orders
// from before the server recorded it have no platform and show nothing.
const ICONS  = { ios: AppleIcon, android: AndroidIcon, web: LanguageIcon };
const COLORS = { ios: '#111827', android: '#16A34A', web: '#2563EB' };

// Compact form for the orders table (no room for another column): the logo
// alone, the name on hover. Unknown platforms keep the same 16px slot so the
// order numbers stay aligned.
export function OrderPlatformIcon({ platform }) {
  const Icon = ICONS[platform];
  if (!Icon) return <Box component="span" sx={{ width: 16, flexShrink: 0 }} />;
  return (
    <Tooltip title={PLATFORM_LABELS[platform]}>
      <Icon sx={{ fontSize: 16, color: COLORS[platform], flexShrink: 0 }} />
    </Tooltip>
  );
}

export default function OrderPlatformChip({ platform }) {
  const Icon = ICONS[platform];
  if (!Icon) return null;
  return (
    <Chip
      icon={<Icon fontSize="small" />}
      label={PLATFORM_LABELS[platform]}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600, borderRadius: 1.5, '& .MuiChip-icon': { color: COLORS[platform] } }}
    />
  );
}
