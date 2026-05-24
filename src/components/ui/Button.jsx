import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';

export default function Button({ children, loading, ...props }) {
  return (
    <MuiButton disabled={loading} {...props}>
      {loading ? <CircularProgress size={20} color="inherit" /> : children}
    </MuiButton>
  );
}
