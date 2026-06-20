import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import { useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/services/menuService';
import toast from 'react-hot-toast';

/**
 * MenuOrderDialog — bir kategori içindeki ürünlerin sırasını sürükleyerek değiştirme.
 * props: open, onClose, items (kategori ürünleri), categoryLabel
 */
export default function MenuOrderDialog({ open, onClose, items, categoryLabel }) {
  const qc = useQueryClient();
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  useEffect(() => {
    if (open) setList(items || []);
  }, [open, items]);

  const handleDrop = () => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null); setOverIdx(null); return;
    }
    setList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
    setDragIdx(null); setOverIdx(null);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await menuService.reorder(list.map((it, i) => ({ id: it._id, sortOrder: i })));
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Sıralama kaydedildi');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Kaydetme hatası');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>
        Ürün Sıralaması{categoryLabel ? ` — ${categoryLabel}` : ''}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bu kategorideki ürünlerin müşteriye gösterilme sırasını ayarlamak için satırları sürükleyin.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 440, overflow: 'auto' }}>
          {list.map((item, idx) => {
            const isDragging = dragIdx === idx;
            const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
            return (
              <Box
                key={item._id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragEnter={() => setOverIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDrop}
                onDrop={handleDrop}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
                  borderRadius: 2, border: '1px solid',
                  borderColor: isOver ? 'primary.main' : 'divider',
                  bgcolor: isDragging ? 'action.selected' : 'background.paper',
                  opacity: isDragging ? 0.5 : 1, cursor: 'grab', userSelect: 'none',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
              >
                <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                <Typography variant="caption" sx={{
                  width: 22, height: 22, flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                  bgcolor: 'primary.main', color: '#fff', fontWeight: 700,
                }}>
                  {idx + 1}
                </Typography>
                {item.imageUrl && (
                  <Box component="img" src={item.imageUrl} alt=""
                    sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <Typography fontWeight={600} sx={{ flex: 1 }} noWrap>{item.name}</Typography>
                <Button size="small" sx={{ minWidth: 28, px: 0 }}
                  disabled={idx === 0} onClick={() => move(idx, -1)}>▲</Button>
                <Button size="small" sx={{ minWidth: 28, px: 0 }}
                  disabled={idx === list.length - 1} onClick={() => move(idx, 1)}>▼</Button>
              </Box>
            );
          })}
          {list.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Bu kategoride ürün yok
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>İptal</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || list.length === 0}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        >
          Sırayı Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
}
