import React, { useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { QRCodeCanvas } from 'qrcode.react';
import PageLayout from '@/components/layout/PageLayout';

const DEFAULT_MENU_URL = 'https://sushitimetr.com/menu';

export default function QrCodePage() {
  const [url, setUrl] = useState(DEFAULT_MENU_URL);
  const [tableLabel, setTableLabel] = useState('');
  const canvasRef = useRef(null);

  const downloadPng = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `sushi-time-menu-qr${tableLabel ? `-${tableLabel}` : ''}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const printQr = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank', 'width=500,height=650');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Sushi Time — Menü QR</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; text-align: center; padding: 40px 20px; }
            h1 { font-size: 1.6em; margin-bottom: 4px; }
            .table-label { font-size: 1.1em; color: #555; margin-bottom: 24px; }
            img { width: 320px; height: 320px; }
            .hint { margin-top: 20px; font-size: 1em; color: #333; }
          </style>
        </head>
        <body>
          <h1>🍣 Sushi Time</h1>
          ${tableLabel ? `<div class="table-label">${tableLabel}</div>` : ''}
          <img src="${dataUrl}" />
          <div class="hint">Menüyü görüntülemek için QR kodu tarayın</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <PageLayout title="QR Kod">
      <Box sx={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Salon için menü QR kodu</Typography>
              <Typography variant="body2" color="text.secondary">
                Müşteriler bu kodu telefonlarıyla okutarak menüyü web'de açar. Masalara
                yapıştırmak için indirin veya doğrudan yazdırın.
              </Typography>
            </Box>

            <TextField
              label="Menü adresi (URL)"
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              helperText="Web sitesinin menü sayfası adresi"
            />

            <TextField
              label="Masa etiketi (opsiyonel)"
              placeholder="Örn. Masa 5"
              fullWidth
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
              helperText="Yazdırılan kağıtta QR kodun altında gösterilir"
            />

            {!url && <Alert severity="warning">Önce bir adres girin.</Alert>}

            {url && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Box ref={canvasRef} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                  <QRCodeCanvas value={url} size={220} level="M" includeMargin />
                </Box>
              </Box>
            )}

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={downloadPng}
                disabled={!url}
              >
                PNG indir
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={printQr}
                disabled={!url}
              >
                Yazdır
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </PageLayout>
  );
}
