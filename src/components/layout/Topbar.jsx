import React from 'react';
import {
  AppBar, Toolbar, IconButton, Typography,
  Avatar, Box, Tooltip, Menu, MenuItem as MuiMenuItem, Divider, Button,
} from '@mui/material';
import MenuIcon          from '@mui/icons-material/Menu';
import LogoutIcon        from '@mui/icons-material/Logout';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { useAuthStore }  from '@/store/authStore';
import { SIDEBAR_WIDTH } from '@/utils/constants';
import { useNavigate }   from 'react-router-dom';
import NotificationBell  from '@/components/ui/NotificationBell';
import ChatNotificationBell from '@/components/ui/ChatNotificationBell';
import { isAlerting, subscribeAlerting, stopAlert } from '@/utils/alertSound';

export default function Topbar({ onMenuClick, title = 'Dashboard' }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [alerting, setAlerting] = React.useState(isAlerting());

  React.useEffect(() => subscribeAlerting(setAlerting), []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
    {/* Плавающая кнопка: видна, пока звонит сигнал нового заказа */}
    {alerting && (
      <Button
        variant="contained"
        color="error"
        size="large"
        startIcon={<NotificationsOffIcon />}
        onClick={stopAlert}
        sx={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          borderRadius: 999,
          px: 3,
          py: 1.25,
          fontWeight: 800,
          boxShadow: '0 8px 24px rgba(232,24,27,0.45)',
        }}
      >
        Остановить звук
      </Button>
    )}
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml:    { md: `${SIDEBAR_WIDTH}px` },
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        {/* Hamburger — mobile only */}
        <IconButton edge="start" onClick={onMenuClick} sx={{ display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
          {title}
        </Typography>

        {/* Chat messages bell */}
        <ChatNotificationBell />

        {/* Notification bell with real-time updates */}
        <NotificationBell />

        {/* Avatar / user menu */}
        <Tooltip title="Account">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { mt: 1.5, minWidth: 180, borderRadius: 2 } }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>{user?.name ?? 'Admin'}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email ?? ''}</Typography>
          </Box>
          <Divider />
          <MuiMenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1 }}>
            <LogoutIcon fontSize="small" /> Logout
          </MuiMenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
    </>
  );
}
