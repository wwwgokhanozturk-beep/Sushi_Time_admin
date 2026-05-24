﻿// Small inline badge with color variants for status display

import React from 'react';
import { Chip } from '@mui/material';

export default function Badge({ label, color = 'default', ...props }) {
  return <Chip label={label} color={color} size="small" sx={{ fontWeight: 700, borderRadius: 1.5 }} {...props} />;
}
