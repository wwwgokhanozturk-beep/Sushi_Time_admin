# Termal Yazıcı Kurulum Kılavuzu — Sushi Time Admin

## Desteklenen Yazıcılar
- Xprinter XP-58 / XP-80
- EPSON TM-T20 / TM-T88
- BIXOLON SRP-350
- Herhangi bir 80mm USB/Bluetooth termal yazıcı

---

## 1. Windows — USB Yazıcı Kurulumu

### Adım 1: Sürücü Kurulumu
1. Yazıcıyı USB ile bilgisayara bağlayın
2. Windows otomatik olarak sürücüyü kurarsa — kurulum tamamdır
3. Kurulmazsa: üreticinin web sitesinden sürücü indirin
   - Xprinter: https://www.xprinter.net/download
   - EPSON: https://download.epson-biz.com
4. Sürücüyü kurun ve bilgisayarı yeniden başlatın

### Adım 2: Yazıcı Ayarları (Kritik!)
1. **Denetim Masası → Aygıtlar ve Yazıcılar** açın
2. Termal yazıcıya sağ tıklayın → **Yazıcı özellikleri**
3. **Gelişmiş** sekmesine gidin
4. **Baskı işlemcisi** → `RAW` seçin
5. **Kağıt boyutu** ayarını yapın:
   - Özellikler → Tercihler → Kağıt boyutu
   - **Genişlik: 80mm**, **Yükseklik: 297mm** (veya "Özel" / "Receipt")
6. Kenar boşlukları = **0mm** (tüm taraflar)
7. **Uygula** ve **Tamam**

### Adım 3: Varsayılan Yazıcı Olarak Ayarla
1. Termal yazıcıya sağ tıklayın
2. **Varsayılan yazıcı olarak ayarla** seçin
3. Tarayıcıda yazdırma dialogu açıldığında bu yazıcı otomatik seçilir

---

## 2. Tarayıcı Ayarları (Chrome / Edge — Önerilen)

### Yazdırma Dialogu Ayarları
Adminpanelde **Yazdır** butonuna tıkladığınızda:

1. **Yazıcı**: Termal yazıcınızı seçin
2. **Kağıt boyutu**: `80mm x Auto` veya özel boyut
3. **Kenar boşlukları**: `Yok` (None)
4. **Ölçek**: `%100` (Fit to page KAPALI)
5. **Arka plan grafikleri**: KAPALI
6. **Üstbilgi ve altbilgi**: KAPALI

### Chrome'da Varsayılan Yazıcı Hatırlatma
- Chrome `chrome://settings/printers` → termal yazıcıyı varsayılan yapın
- Böylece her seferinde seçmeniz gerekmez

---

## 3. Otomatik Yazdırma (Kiosk Modu)

Adminpaneli her seferinde yazıcı seçimi sormasın istiyorsanız:

### Chrome Kiosk Print Modu
```bash
# Windows'ta Chrome'u kiosk print moduyla başlatın:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing http://localhost:3000
```

Bu mod ile **Yazdır** butonuna basıldığında dialog açılmadan doğrudan yazıcıya gönderilir.

---

## 4. Bluetooth Yazıcı Kurulumu

1. Yazıcıyı açın, Bluetooth moduna alın
2. Windows → **Ayarlar → Bluetooth ve aygıtlar → Aygıt ekle**
3. Yazıcıyı eşleştirin (PIN genellikle `0000` veya `1234`)
4. Eşleştirme sonrası **Yazıcılar** bölümünde görünür
5. Yukarıdaki "Kağıt boyutu" adımlarını uygulayın

---

## 5. Ağ (Wi-Fi / LAN) Yazıcı Kurulumu

```
Yazıcı IP'si genellikle: 192.168.1.100 (veya yazıcı menüsünden görüntüleyin)
Port: 9100 (RAW print)
```

1. **Denetim Masası → Yazıcı ekle → Ağ yazıcısı**
2. IP adresini girin
3. Port: `9100`
4. Sürücü: **Generic / Text Only** veya üretici sürücüsü

---

## 6. Test Sayfası Yazdırma

Adminpanelde herhangi bir siparişe gidin → **Yazdır** butonuna tıklayın.

Sorun yaşarsanız kontrol listesi:
- [ ] Yazıcı açık mı?
- [ ] Kağıt var mı?
- [ ] USB/Bluetooth bağlantısı aktif mi?
- [ ] Windows'ta "varsayılan yazıcı" olarak ayarlı mı?
- [ ] Tarayıcıda kenar boşlukları "Yok" seçili mi?
- [ ] Kağıt boyutu 80mm olarak ayarlı mı?

---

## 7. Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Çek çok geniş basılıyor | Tarayıcıda kenar boşluğunu "Yok" yapın |
| Yazı kesiliyor | Ölçeği %100'e ayarlayın, "Sayfaya sığdır" KAPALI |
| Boş sayfa çıkıyor | Kağıt boyutunu 80mm'ye ayarlayın |
| Yazıcı görünmüyor | Sürücüyü yeniden yükleyin |
| QR kod basılmıyor | Tarayıcıda "Arka plan grafikleri" AÇIK yapın |

---

## 8. Teknik Detaylar

Çek bileşeni: `src/components/print/PrintReceipt.jsx`
Print CSS: `src/components/print/print.css`
Genişlik: 80mm, Font: Courier New (monospace)
KDV Hesaplama: Toplam fiyat KDV dahil, %20 oranıyla ayrıştırılır
QR içeriği: `{ id, no, tutar, tarih }` JSON formatında
