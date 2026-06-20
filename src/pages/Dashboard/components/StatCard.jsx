import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function StatCard({ title, value, subtitle, icon, color = 'primary', loading = false, trend }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} height={44} />
            ) : (
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
            {trend != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                {trend >= 0 ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
                <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                  %{Math.abs(trend)} geçen haftaya göre
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{
            bgcolor: `${color}.main`, color: 'white',
            borderRadius: 3, p: 1.5, display: 'flex',
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
