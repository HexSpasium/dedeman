# Park Dedeman Browser

Yönetici tarafından izin verilmiş uygulamaları tek ekranda sunan resepsiyon çalışma alanı.

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` içine Supabase proje URL'si ve publishable key girin. Service role / secret key tarayıcıya kesinlikle koymayın.

## Proje bileşenleri
- React + Vite arayüzü
- Supabase Auth ile yönetici girişi
- `park_dedeman_sites` ile izinli site listesi
- `park_dedeman_admins` ile yönetici rolü
- `park_dedeman_audit_logs` ile işlem kayıtları

## Güvenlik notu
Bu depo şu aşamada web MVP'sidir. Web arayüzü tek başına güvenli allowlist tarayıcı değildir. Kesin alan adı kısıtlaması, adres çubuğunu gizleme ve çoklu web sekmeleri için sonraki aşamada Electron/Chromium masaüstü kabuğu ve Windows kiosk politikaları eklenmelidir.
