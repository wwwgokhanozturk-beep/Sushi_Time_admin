﻿// Recharts line/bar chart for daily/weekly revenue

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const SAMPLE_DATA = [
  { day: 'Mon', revenue: 1200 }, { day: 'Tue', revenue: 1900 },
  { day: 'Wed', revenue: 1500 }, { day: 'Thu', revenue: 2400 },
  { day: 'Fri', revenue: 3100 }, { day: 'Sat', revenue: 3800 },
  { day: 'Sun', revenue: 2700 },
];

export default function RevenueChart({ data = SAMPLE_DATA }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Weekly Revenue</Typography>
          <Typography variant="h6" fontWeight={800} color="primary">
            ₺{data.reduce((s, d) => s + d.revenue, 0).toLocaleString('tr-TR')}
          </Typography>
        </Box>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#E8272A" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#E8272A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₺${v}`} />
            <Tooltip formatter={(v) => [`₺${v}`, 'Revenue']} />
            <Area
              type="monotone" dataKey="revenue"
              stroke="#E8272A" strokeWidth={2.5}
              fill="url(#revGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
