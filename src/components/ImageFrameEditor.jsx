import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Slider, Typography, Button, Stack } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const FRAME = 240;          // размер квадратной рамки-превью (px)
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

const VIDEO_RE = /\.(mp4|m4v|mov|webm|ogg|m3u8)(\?.*)?$/i;
const isVideo = (url) => typeof url === 'string' && VIDEO_RE.test(url);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * ImageFrameEditor — рамка как в меню у клиента. Админ зумит (слайдер)
 * и перетаскивает фото внутри рамки. Смещение хранится в % от размера рамки.
 *
 * props: imageUrl, scale, offsetX, offsetY, onChange({ scale, offsetX, offsetY })
 */
export default function ImageFrameEditor({ imageUrl, scale = 1, offsetX = 0, offsetY = 0, onChange }) {
  const dragRef = useRef(null); // { startX, startY, baseX, baseY }
  const [dragging, setDragging] = useState(false);
  // URL без расширения (напр. UploadThing ufs.sh/f/...) может быть видео.
  // Пробуем <img>; если не загрузился — переключаемся на <video>.
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => { setImgFailed(false); }, [imageUrl]);
  const showVideo = isVideo(imageUrl) || imgFailed;

  const mediaStyle = {
    width: '100%', height: '100%', objectFit: 'cover',
    transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
    transformOrigin: 'center',
    pointerEvents: 'none',
  };

  const emit = useCallback((patch) => {
    onChange?.({ scale, offsetX, offsetY, ...patch });
  }, [onChange, scale, offsetX, offsetY]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offsetX, baseY: offsetY };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dxPct = ((e.clientX - dragRef.current.startX) / FRAME) * 100;
    const dyPct = ((e.clientY - dragRef.current.startY) / FRAME) * 100;
    emit({
      offsetX: clamp(Math.round(dragRef.current.baseX + dxPct), -100, 100),
      offsetY: clamp(Math.round(dragRef.current.baseY + dyPct), -100, 100),
    });
  };

  const endDrag = () => { dragRef.current = null; setDragging(false); };

  if (!imageUrl) return null;

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        Çerçeveleme (müşteri menüde nasıl görür) — fotoğrafı sürükleyin ve ölçeği ayarlayın
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
        {/* Рамка-превью */}
        <Box
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          sx={{
            position: 'relative',
            width: FRAME, height: FRAME,
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px solid',
            borderColor: 'primary.main',
            bgcolor: '#000',
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {showVideo ? (
            <video
              src={imageUrl}
              autoPlay muted loop playsInline
              draggable={false}
              style={mediaStyle}
            />
          ) : (
            <img
              src={imageUrl}
              alt="preview"
              draggable={false}
              onError={() => setImgFailed(true)}
              style={mediaStyle}
            />
          )}
        </Box>

        {/* Управление */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ZoomInIcon fontSize="small" />
            <Typography variant="body2">Ölçek: {scale.toFixed(2)}×</Typography>
          </Box>
          <Slider
            value={scale}
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.05}
            onChange={(_, v) => emit({ scale: v })}
            sx={{ mt: 1 }}
          />
          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={() => onChange?.({ scale: 1, offsetX: 0, offsetY: 0 })}
            sx={{ mt: 1 }}
          >
            Sıfırla
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
