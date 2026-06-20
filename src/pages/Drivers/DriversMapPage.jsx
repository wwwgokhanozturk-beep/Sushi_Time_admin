import React from 'react';
import { Typography, Box } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import PageLayout from '@/components/layout/PageLayout';

export default function DriversMapPage() {
  return (
    <PageLayout title="Kurye Haritası">
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <MapIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>Canlı Kurye Haritası</Typography>
        <Typography color="text.secondary">
          Haritada gerçek zamanlı kurye takibi yakında.
        </Typography>
      </Box>
    </PageLayout>
  );
}
