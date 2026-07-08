import React, { forwardRef } from 'react';
import dayjs from 'dayjs';

/**
 * PrintReceipt — рендерится ВНУТРИ #receipt-root из index.html.
 * Kağıt genişliği: 80 mm (Türkiye POS standardı), yükseklik içeriğe göre otomatik.
 * Bilgilendirme fişi — KDV ayrımı yapılmaz, tek kalem toplam gösterilir.
 */
const PrintReceipt = forwardRef(function PrintReceipt({ order, contactNumber }, ref) {
  if (!order) return null;

  const shortId   = order._id?.slice(-6).toUpperCase();
  const orderDate = dayjs(order.createdAt).format('DD.MM.YYYY');
  const orderTime = dayjs(order.createdAt).format('HH:mm');
  const total     = parseFloat(order.totalPrice) || 0;
  const money     = (n) => parseFloat(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const paymentLbl = order.paymentMethod === 'card' ? 'Kredi Kartı (kapıda)' : 'Nakit (kapıda)';

  const address = [
    order.address,
    order.buildingName && `Bina: ${order.buildingName}`,
    order.floor && `Kat: ${order.floor}`,
    order.apartment && `Daire: ${order.apartment}`,
    order.doorCode && `Kapı kodu: ${order.doorCode}`,
  ].filter(Boolean).join(', ');

  return (
    <div id="receipt-print-area" ref={ref} style={s.area}>

      {/* ── Logo ── */}
      {/* logo-receipt.png — logo.png ile aynı görsel, arka planındaki
          (saydamlık yerine pikselleşmiş) gri dama deseni temizlenmiş hâli. */}
      <img src="/logo-receipt.png" alt="Sushi Time" style={s.logo} />

      {/* ── Bilgi tablosu ── */}
      <div style={s.box}>
        <div style={s.row}>Sushi Time Contact Number : {contactNumber || '—'}</div>
        <div style={{ ...s.row, ...s.kv }}>
          <span>Müşteri:</span>
          <strong>{order.customerName || '—'}</strong>
        </div>
        <div style={{ ...s.row, ...s.kv }}>
          <span>Telefon:</span>
          <strong>{order.phone || '—'}</strong>
        </div>
        <div style={s.blackRow}>SİPARİŞ ADRESİ</div>
        <div style={s.row}>{address || '—'}</div>
        <div style={{ ...s.row, ...s.kv }}>
          <span>Ödeme:</span>
          <strong>{paymentLbl}</strong>
        </div>
        <div style={{ ...s.row, ...s.kv }}>
          <span>Sipariş No:</span>
          <strong>{shortId}</strong>
        </div>
        <div style={{ ...s.row, ...s.kv }}>
          <span>Sipariş Zamanı:</span>
          <strong>{orderDate} - {orderTime}</strong>
        </div>
      </div>

      {/* ── Ürünler tablosu ── */}
      <div style={{ ...s.box, marginTop: '2mm' }}>
        <div style={{ ...s.blackRow, ...s.itemRow, textAlign: 'left' }}>
          <span style={s.itemName}>ÜRÜN ADI</span>
          <span style={s.itemQty}>MİKTAR</span>
          <span style={s.itemPrice}>FİYAT</span>
        </div>
        {order.items?.map((item, i) => (
          <div key={i}
            style={{
              ...s.itemRow,
              borderBottom: i === order.items.length - 1 ? 'none' : '1px dashed #000',
            }}>
            <span style={s.itemName}>{item.name?.toUpperCase()}</span>
            <span style={s.itemQty}>x {item.quantity}</span>
            <span style={s.itemPrice}>{money(item.subtotal ?? item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* ── Genel toplam ── */}
      <div style={{ ...s.blackRow, ...s.totalRow }}>
        <span>GENEL TOPLAM :</span>
        <span>{money(total)} TL</span>
      </div>

      {/* ── Footer ── */}
      <div style={s.footer}>MALİ DEĞERİ YOKTUR. BİLGİ AMAÇLIDIR.</div>

    </div>
  );
});

export default PrintReceipt;

const s = {
  area: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 10.5,
    color: '#000',
    background: '#fff',
    width: '80mm',
    padding: '2mm',
    margin: 0,
    boxSizing: 'border-box',
    lineHeight: 1.3,
  },
  logo: {
    display: 'block',
    width: '66mm',
    margin: '0 auto 2mm',
  },
  box: {
    border: '1px solid #000',
    borderBottom: 'none',
  },
  row: {
    padding: '1mm 1.5mm',
    borderBottom: '1px solid #000',
    wordBreak: 'break-word',
  },
  kv: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '2mm',
  },
  blackRow: {
    background: '#000',
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '1mm 1.5mm',
    borderBottom: '1px solid #000',
    letterSpacing: 0.3,
  },
  itemRow: {
    display: 'flex',
    padding: '1mm 1.5mm',
    borderBottom: '1px solid #000',
  },
  itemName: {
    flex: 1,
    paddingRight: '1.5mm',
    wordBreak: 'break-word',
  },
  itemQty: {
    width: '14mm',
    textAlign: 'center',
    flexShrink: 0,
  },
  itemPrice: {
    width: '16mm',
    textAlign: 'right',
    flexShrink: 0,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    padding: '1.5mm',
    marginTop: '2mm',
    border: '1px solid #000',
  },
  footer: {
    textAlign: 'center',
    fontSize: 8.5,
    fontWeight: 'bold',
    marginTop: '2mm',
  },
};
