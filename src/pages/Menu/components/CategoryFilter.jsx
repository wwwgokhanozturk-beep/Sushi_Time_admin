import React from "react";
import { Box, Chip } from "@mui/material";
import { MENU_CATEGORIES } from "@/utils/constants";
import { useCategoryOrder } from "@/hooks/useSettings";

// Order MENU_CATEGORIES by the admin-defined saved order; unknown/new
// categories fall to the end so nothing is ever hidden.
function orderCategories(saved) {
  const known = new Set(MENU_CATEGORIES);
  const ordered = (saved || []).filter((c) => known.has(c));
  const rest = MENU_CATEGORIES.filter((c) => !ordered.includes(c));
  return [...ordered, ...rest];
}

export default function CategoryFilter({ selected, onChange }) {
  const { data: savedOrder } = useCategoryOrder();
  const categories = ["all", ...orderCategories(savedOrder)];

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
