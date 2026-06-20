import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReorderIcon from "@mui/icons-material/Reorder";
import PageLayout from "@/components/layout/PageLayout";
import CategoryFilter from "./components/CategoryFilter";
import CategoryOrderDialog from "./components/CategoryOrderDialog";
import MenuOrderDialog from "./components/MenuOrderDialog";
import SortIcon from "@mui/icons-material/SwapVert";
import { useMenuItems, useDeleteMenuItem } from "@/hooks/useMenu";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/utils/formatters";

const normalizeCategory = (value) =>
  value
    ?.toString()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .trim();

const formatCategoryLabel = (value) =>
  value
    ?.toString()
    .split(/[_\s-]+/)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

export default function MenuPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [itemOrderOpen, setItemOrderOpen] = useState(false);
  const deleteMut = useDeleteMenuItem();

  const { data: items = [], isLoading } = useMenuItems();

  // Seçili kategorinin ürünleri (arama hariç) — sıralama için
  const categoryItems =
    category === "all"
      ? []
      : items.filter((i) => normalizeCategory(i.category) === normalizeCategory(category));

  const filtered = items.filter((item) => {
    const matchCat =
      category === "all" ||
      normalizeCategory(item.category) === normalizeCategory(category);
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  return (
    <PageLayout title="Menü Yönetimi">
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Menüde ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 300 }}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          {category !== "all" && (
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={() => setItemOrderOpen(true)}
            >
              Ürün Sıralaması
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<ReorderIcon />}
            onClick={() => setOrderOpen(true)}
          >
            Kategori Sıralaması
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/menu/new")}
          >
            Ürün Ekle
          </Button>
        </Box>
      </Box>

      {/* Category chips */}
      <CategoryFilter selected={category} onChange={setCategory} />

      {/* Drag-and-drop category order dialog */}
      <CategoryOrderDialog open={orderOpen} onClose={() => setOrderOpen(false)} />

      {/* Drag-and-drop item order dialog (within a category) */}
      <MenuOrderDialog
        open={itemOrderOpen}
        onClose={() => setItemOrderOpen(false)}
        items={categoryItems}
        categoryLabel={category !== "all" ? formatCategoryLabel(category) : ""}
      />

      {/* Items grid */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", mt: 6 }}>
          Ürün bulunamadı
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Availability badge */}
                <Chip
                  label={item.isAvailable ? "Mevcut" : "Tükendi"}
                  color={item.isAvailable ? "success" : "error"}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 1,
                    fontWeight: 700,
                  }}
                />

                {/* Image */}
                <Box
                  sx={{
                    height: 140,
                    bgcolor: "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {item.imageUrl ? (
                    <Box
                      component="img"
                      src={item.imageUrl}
                      alt={item.name}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Typography fontSize={48}>🍣</Typography>
                  )}
                </Box>

                <CardContent
                  sx={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {item.name}
                  </Typography>
                  <Chip
                    label={formatCategoryLabel(item.category)}
                    size="small"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", mt: 0.5, mb: 1 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      flex: 1,
                      mb: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description || "Açıklama yok"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6" fontWeight={800} color="primary">
                      {formatPrice(item.price)}
                    </Typography>
                    <Box>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/menu/${item._id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(item._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Ürünü Sil</DialogTitle>
        <DialogContent>
          <Typography>
            Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>İptal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteMut.isPending}
          >
            {deleteMut.isPending ? <CircularProgress size={20} /> : "Sil"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
