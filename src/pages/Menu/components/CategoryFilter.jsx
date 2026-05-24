import React from "react";
import { Box, Chip } from "@mui/material";
import { MENU_CATEGORIES } from "@/utils/constants";

export default function CategoryFilter({ selected, onChange }) {
  const categories = ["all", ...MENU_CATEGORIES];
  const formatLabel = (value) =>
    value === "all"
      ? "All"
      : value
          .split("_")
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join(" ");

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
      {categories.map((cat) => (
        <Chip
          key={cat}
          label={formatLabel(cat)}
          color={selected === cat ? "primary" : "default"}
          variant={selected === cat ? "filled" : "outlined"}
          onClick={() => onChange(cat)}
          sx={{ fontWeight: 600 }}
        />
      ))}
    </Box>
  );
}
