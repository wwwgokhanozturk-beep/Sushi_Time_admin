import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CampaignIcon from "@mui/icons-material/Campaign";
import ChatIcon from "@mui/icons-material/Chat";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate, useLocation } from "react-router-dom";
import { SIDEBAR_WIDTH } from "@/utils/constants";
import { useChatNotificationStore } from "@/store/chatNotificationStore";

const NAV_ITEMS = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { label: "Orders", icon: <ReceiptIcon />, path: "/orders" },
  { label: "Menu", icon: <RestaurantMenuIcon />, path: "/menu" },
  { label: "Promotions", icon: <LocalOfferIcon />, path: "/promotions" },
  { label: "Users", icon: <PeopleIcon />, path: "/users" },
  { label: "Analytics", icon: <BarChartIcon />, path: "/analytics" },
  { label: "Notifications", icon: <CampaignIcon />, path: "/notifications" },
  { label: "Chat", icon: <ChatIcon />, path: "/chat" },
  { label: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const chatUnread = useChatNotificationStore((s) =>
    s.threads.reduce((sum, t) => sum + (t.count || 0), 0)
  );

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <img src="/sushi.png" style={{ width: "150px", height: "150px" }} />
      </Box>
      <Typography
        variant="caption"
        sx={{
          px: 3,
          pb: 1,
          color: "text.secondary",
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        ADMIN PANEL
      </Typography>
      <Divider />

      {/* Nav links */}
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Tooltip key={item.path} title={item.label} placement="right">
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
                selected={active}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "& .MuiListItemIcon-root": { color: "white" },
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: active ? "white" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 500 }}
                />
                {item.path === "/chat" && chatUnread > 0 && (
                  <Box
                    sx={{
                      ml: "auto",
                      minWidth: 22,
                      height: 22,
                      px: 0.75,
                      borderRadius: 999,
                      bgcolor: active ? "#fff" : "error.main",
                      color: active ? "primary.main" : "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </Box>
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Version footer */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary">
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid #E5E7EB",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
