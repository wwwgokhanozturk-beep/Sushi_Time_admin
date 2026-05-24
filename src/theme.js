import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#E8272A', dark: '#C41E20', contrastText: '#fff' },
    secondary: { main: '#1A1A2E', contrastText: '#fff' },
    accent:    { main: '#FFC947' },
    success:   { main: '#10B981' },
    warning:   { main: '#F59E0B' },
    error:     { main: '#EF4444' },
    background:{ default: '#F8F8F8', paper: '#FFFFFF' },
    text:      { primary: '#1A1A2E', secondary: '#6B7280' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)', backgroundColor: '#fff', color: '#1A1A2E' },
      },
    },
  },
});

export default theme;

