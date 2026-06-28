import React, { useEffect, useRef, useState } from 'react';

// Мини-копия промо-баннера из веб-клиента (web_client BannerCarousel).
// Показывает админу, как кампания выглядит на сайте — с тем же кадрированием
// (scale/offset), градиентом, бейджем, заголовком, описанием и чипом скидки.

const PRIMARY = '#E8181B';   // web_client --primary
const SECONDARY = '#FF6B35'; // web_client --secondary
const BADGE_COLORS = { HOT: '#EF4444', NEW: '#10B981', SALE: '#F59E0B', LIMITED: '#8B5CF6' };

const VIDEO_RE = /\.(mp4|m4v|mov|webm|ogg|m3u8)(\?.*)?$/i;
const isVideo = (url) => typeof url === 'string' && VIDEO_RE.test(url);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function PromoBannerPreview({
  imageUrl, scale = 1, offsetX = 0, offsetY = 0,
  badge, title, description, discountPercent,
  onChange,
}) {
  // URL без расширения (UploadThing) может быть видео — пробуем <img>,
  // при ошибке загрузки переключаемся на <video>.
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => { setImgFailed(false); }, [imageUrl]);
  const showVideo = isVideo(imageUrl) || imgFailed;

  // Перетаскивание прямо по баннеру меняет смещение (в % от размеров баннера).
  // Делит сдвиг на реальные ширину/высоту, т.к. баннер 3:1 (не квадрат).
  const frameRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, baseX, baseY, w, h }
  const [dragging, setDragging] = useState(false);
  const interactive = typeof onChange === 'function' && !!imageUrl;

  const onPointerDown = (e) => {
    if (!interactive) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offsetX, baseY: offsetY, w: rect.width, h: rect.height };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPct = ((e.clientX - d.startX) / d.w) * 100;
    const dyPct = ((e.clientY - d.startY) / d.h) * 100;
    onChange?.({
      offsetX: clamp(Math.round(d.baseX + dxPct), -100, 100),
      offsetY: clamp(Math.round(d.baseY + dyPct), -100, 100),
    });
  };

  const endDrag = () => { dragRef.current = null; setDragging(false); };

  const mediaStyle = {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
    transformOrigin: 'center',
    pointerEvents: 'none',
  };
  const badgeColor = badge ? BADGE_COLORS[badge] : null;
  const hasDiscount = discountPercent != null && discountPercent !== '';

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      style={{
        ...st.wrap,
        cursor: interactive ? (dragging ? 'grabbing' : 'grab') : 'default',
        touchAction: interactive ? 'none' : 'auto',
      }}
    >
      {imageUrl ? (
        showVideo ? (
          <video src={imageUrl} style={mediaStyle} autoPlay muted loop playsInline />
        ) : (
          <img src={imageUrl} alt="" style={mediaStyle} onError={() => setImgFailed(true)} />
        )
      ) : (
        <div style={st.placeholder}>🍣</div>
      )}

      <div style={st.overlay} />

      <div style={st.content}>
        {badge ? <span style={{ ...st.badge, background: badgeColor }}>{badge}</span> : null}
        {title ? <div style={st.title}>{title}</div> : null}
        {description ? <div style={st.desc}>{description}</div> : null}
        {hasDiscount ? <span style={st.chip}>−{discountPercent}%</span> : null}
      </div>
    </div>
  );
}

// Стили — мини-версия web_client BannerCarousel (пропорции 3:1, кегли ~0.56×).
const st = {
  wrap: {
    position: 'relative', width: '100%', aspectRatio: '3 / 1', minHeight: 140,
    borderRadius: 16, overflow: 'hidden', background: '#FDECEA',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    userSelect: 'none',
  },
  placeholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 56,
    background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
  },
  overlay: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 70%)',
  },
  content: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: '60%',
    padding: '0 6%', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: 6, pointerEvents: 'none',
  },
  badge: {
    alignSelf: 'flex-start', padding: '3px 9px', borderRadius: 999,
    color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: 1,
  },
  title: {
    color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1.1,
    letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  desc: {
    color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 500, lineHeight: 1.3,
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  chip: {
    alignSelf: 'flex-start', background: PRIMARY, color: '#fff',
    fontWeight: 900, fontSize: 13, padding: '4px 12px', borderRadius: 999, marginTop: 2,
  },
};
