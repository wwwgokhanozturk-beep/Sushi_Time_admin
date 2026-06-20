import React from 'react';
import { Box, Typography } from '@mui/material';

export default function MapboxDriverMap({ drivers = [] }) {
  return (
    <Box sx={{ width: '100%', height: 400, bgcolor: '#F3F4F6', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">
        Mapbox driver map — requires VITE_MAPBOX_TOKEN in .env
      </Typography>
    </Box>
  );
}
