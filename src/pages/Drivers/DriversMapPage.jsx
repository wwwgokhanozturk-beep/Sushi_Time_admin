import React from 'react';
import { Typography, Box } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import PageLayout from '@/components/layout/PageLayout';

export default function DriversMapPage() {
  return (
    <PageLayout title="Drivers Map">
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <MapIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>Live Driver Map</Typography>
        <Typography color="text.secondary">
          Real-time driver tracking on map coming soon.
        </Typography>
      </Box>
    </PageLayout>
  );
}
