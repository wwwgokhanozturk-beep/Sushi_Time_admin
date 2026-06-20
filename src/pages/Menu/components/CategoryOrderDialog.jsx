import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import { MENU_CATEGORIES } from '@/utils/constants';
import { useCategoryOrder, useUpdateCategoryOrder } from '@/hooks/useSettings';

const formatLabel = (value) =>
  value
    .split('_')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');

// Merge saved order with the full category list so newly-added categories
// (present in MENU_CATEGORIES but not yet ordered) appear at the end.
function mergeOrder(saved) {
  const known = new Set(MENU_CATEGORIES);
  const ordered = (saved || []).filter((c) => known.has(c));
  const rest = MENU_CATEGORIES.filter((c) => !ordered.includes(c));
  return [...ordered, ...rest];
}

export default function CategoryOrderDialog({ open, onClose }) {
  const { data: saved, isLoading } = useCategoryOrder();
  const updateMut = useUpdateCategoryOrder();

  const [list, setList] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  useEffect(() => {
    if (open) setList(mergeOrder(saved));
  }, [open, saved]);

  const handleDrop = () => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    setList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
    setDragIdx(null);
    setOverIdx(null);
  };

  const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    setList((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSave = () => {
    updateMut.mutate(list, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Kategori Sıralaması</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Müşterilere ve panelde gösterilecek sırayı belirlemek için satırları sürükleyin.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {list.map((cat, idx) => {
              const isDragging = dragIdx === idx;
              const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
              return (
                <Box
                  key={cat}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragEnter={() => setOverIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={handleDrop}
                  onDrop={handleDrop}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isOver ? 'primary.main' : 'divider',
                    bgcolor: isDragging ? 'action.selected' : 'background.paper',
                    opacity: isDragging ? 0.5 : 1,
                    cursor: 'grab',
                    userSelect: 'none',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  }}
                >
                  <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      width: 22, height: 22, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', bgcolor: 'primary.main', color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </Typography>
                  <Typography fontWeight={600} sx={{ flex: 1 }}>
                    {formatLabel(cat)}
                  </Typography>
                  <Button size="small" sx={{ minWidth: 28, px: 0 }}
                    disabled={idx === 0} onClick={() => move(idx, -1)}>▲</Button>
                  <Button size="small" sx={{ minWidth: 28, px: 0 }}
                    disabled={idx === list.length - 1} onClick={() => move(idx, 1)}>▼</Button>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>İptal</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={updateMut.isPending || isLoading}
          startIcon={updateMut.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        >
          Sırayı Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
}
