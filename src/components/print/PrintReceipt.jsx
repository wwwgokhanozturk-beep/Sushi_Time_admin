import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import dayjs from 'dayjs';
import { formatPrice } from '@/utils/formatters';

/**
 * PrintReceipt — рендерится ВНУТРИ #receipt-root из index.html.
 * Ширина бумаги: 80 мм (Türkiye POS standardı).
 * КДВ: %10 (yeme-içme hizmetleri, 2023'ten itibaren geçerli).
 */
const PrintReceipt = forwardRef(function PrintReceipt({ order }, ref) {
  if (!order) return null;

  const shortId   = order._id?.slice(-6).toUpperCase();
  const orderDate = dayjs(order.createdAt).format('DD.MM.YYYY HH:mm');
  const total     = parseFloat(order.totalPrice) || 0;
  // Türkiye yeme-içme KDV oranı: %10
  const kdvRate   = 0.10;
  const araTotal  = parseFloat((total / (1 + kdvRate)).toFixed(2));
  const kdv       = parseFloat((total - araTotal).toFixed(2));
  const qrData    = JSON.stringify({ id: order._id, no: shortId, tutar: total, tarih: orderDate });

  return (
    <div id="receipt-print-area" ref={ref} style={s.area}>

      {/* ── Başlık ── */}
      <div style={s.center}>
        <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 2 }}>🍣 Sushi Time</div>
        <div style={{ fontSize: 10 }}>Restoran Yönetim Sistemi</div>
      </div>

      <div style={s.dashed} />

      {/* ── QR Kod ── */}
      <div style={s.center}>
        <QRCodeSVG value={qrData} size={90} bgColor="#fff" fgColor="#000" />
      </div>

      <div style={s.dashed} />

      {/* ── Sipariş No & Tarih ── */}
      <div style={s.row}>
        <span>Sipariş No</span>
        <strong style={{ fontSize: 13 }}>#{shortId}</strong>
      </div>
      <div style={s.row}>
        <span>Tarih</span>
        <span>{orderDate}</span>
      </div>

      <div style={s.dashed} />

      {/* ── Müşteri ── */}
      <div style={s.sectionTitle}>MÜŞTERİ BİLGİLERİ</div>
      <div style={s.row}>
        <span style={s.label}>Ad Soyad</span>
        <span style={s.val}>{order.customerName || '—'}</span>
      </div>
      <div style={s.row}>
        <span style={s.label}>Telefon</span>
        <span style={s.val}>{order.phone || '—'}</span>
      </div>
      {order.address && (
        <div style={{ fontSize: 10, marginTop: 3, wordBreak: 'break-word' }}>
          <span style={s.label}>Adres: </span>{order.address}
        </div>
      )}
      {order.notes && (
        <div style={{ fontSize: 10, marginTop: 2, wordBreak: 'break-word' }}>
          <span style={s.label}>Not: </span>{order.notes}
        </div>
      )}

      <div style={s.dashed} />

      {/* ── Ürünler ── */}
      <div style={s.sectionTitle}>ÜRÜNLER</div>
      <div style={{ display: 'flex', fontWeight: 'bold', fontSize: 10, borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 3 }}>
        <span style={{ width: 28 }}>Adet</span>
        <span style={{ flex: 1 }}>Ürün</span>
        <span style={{ width: 60, textAlign: 'right' }}>Tutar</span>
      </div>
      {order.items?.map((item, i) => (
        <div key={i} style={{ display: 'flex', fontSize: 11, marginBottom: 2 }}>
          <span style={{ width: 28, textAlign: 'center' }}>{item.quantity}×</span>
          <span style={{ flex: 1, paddingRight: 4 }}>{item.name}</span>
          <span style={{ width: 60, textAlign: 'right' }}>
            {formatPrice(item.subtotal ?? item.price * item.quantity)}
          </span>
        </div>
      ))}

      <div style={s.dashed} />

      {/* ── Ara Toplam & KDV ── */}
      <div style={s.row}>
        <span style={s.label}>Ara Toplam (KDV Hariç)</span>
        <span style={s.val}>{formatPrice(araTotal)}</span>
      </div>
      <div style={s.row}>
        <span style={s.label}>KDV (%10)</span>
        <span style={s.val}>{formatPrice(kdv)}</span>
      </div>

      <div style={s.double} />

      {/* ── ÖDENECEK TUTAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
        <strong style={{ fontSize: 12 }}>ÖDENECEK TUTAR</strong>
        <strong style={{ fontSize: 15 }}>{formatPrice(total)}</strong>
      </div>

      <div style={s.double} />

      {/* ── Ödeme & Durum ── */}
      <div style={s.row}>
        <span style={s.label}>Ödeme</span>
        <span style={s.val}>
          {order.paymentMethod === 'card' ? 'Kredi Kartı' : 'Kapıda Nakit'}
        </span>
      </div>
      <div style={s.row}>
        <span style={s.label}>Durum</span>
        <span style={s.val}>{order.status?.toUpperCase() || '—'}</span>
      </div>

      <div style={s.dashed} />

      {/* ── Footer ── */}
      <div style={{ ...s.center, fontSize: 10, marginTop: 6 }}>
        <div>{orderDate}</div>
        <div style={{ fontWeight: 'bold', marginTop: 4 }}>Siparişiniz için teşekkür ederiz!</div>
        <div style={{ marginTop: 2 }}>sushitime.com</div>
        <div style={{ marginTop: 6, letterSpacing: 4 }}>* * *</div>
      </div>

    </div>
  );
});

export default PrintReceipt;

const s = {
  area: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 11,
    color: '#000',
    background: '#fff',
    width: '72mm',          // 80mm − 4mm отступ с каждой стороны
    padding: '4mm',
    margin: 0,
    boxSizing: 'border-box',
    lineHeight: 1.45,
  },
  center: {
    textAlign: 'center',
    margin: '5px 0',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 0.8,
    margin: '3px 0 4px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: 11,
    marginBottom: 3,
  },
  label: {
    color: '#444',
  },
  val: {
    textAlign: 'right',
    maxWidth: '55%',
  },
  dashed: {
    borderTop: '1px dashed #000',
    margin: '5px 0',
  },
  double: {
    borderTop: '3px double #000',
    margin: '5px 0',
  },
};
