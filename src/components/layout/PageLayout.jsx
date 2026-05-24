import React, { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { SIDEBAR_WIDTH } from "@/utils/constants";

export default function PageLayout({ title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </Box>

      {/* Main content area */}
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <Toolbar /> {/* spacer under fixed AppBar */}
        <Box
          component="main"
          sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: "auto" }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
