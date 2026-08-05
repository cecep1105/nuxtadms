# NUXTADMS -- Fondasi (Tahap 1)

Versi Nuxt 4 + Vue dari NEXTADMS. Ini FONDASI (auth + layout + tema +
2 modul inti), BUKAN porting lengkap -- sesuai rencana bertahap yang
disepakati. Proyek Nuxt ASLI (dibuat via nuxi init, bukan ditulis
manual), semua dependency versi terkini per Agustus 2026.

## Stack

- Nuxt 4.5.1 (struktur direktori app/ baru, bukan Nuxt 3)
- shadcn-vue (via module shadcn-nuxt) + Tailwind CSS v4
- nuxt-auth-utils -- sesi (sealed cookie httpOnly), padanan NextAuth
- @vueuse/core -- utilitas reaktif (dark mode, localStorage, dst)
- @lucide/vue -- ikon (bukan lucide-vue-next, itu sudah deprecated)
- TypeScript 5.9 (bukan TypeScript 7 yang otomatis ke-install -- lihat
  catatan di bawah)

## Cara jalankan

npm install
cp .env.example .env
(isi .env: DJANGO_INTERNAL_URL, NUXT_PUBLIC_API_BASE_URL,
NUXT_SESSION_PASSWORD -- wajib, generate dgn openssl rand -base64 32)
npm run dev

Buka http://localhost:3000 -- akan otomatis redirect ke /login (belum
ada sesi). Backend Django (ccpadms) harus sudah jalan dan bisa diakses
dari DJANGO_INTERNAL_URL untuk login benar-benar berhasil.

## Yang sudah selesai dan teruji

Auth (bagian paling krusial):
- server/api/auth/login.post.ts -- proxy ke Django /auth/login/
- server/api/auth/logout.post.ts -- blacklist refresh token dulu di
  Django, baru hapus sesi lokal
- server/plugins/session-refresh.ts -- replikasi persis logic
  lazy-refresh NextAuth, termasuk penanganan ROTATE_REFRESH_TOKENS=True
  Django (token baru wajib persisten ke cookie via
  replaceUserSession(), bukan cuma di memori -- kalau tidak, refresh
  kedua akan gagal karena refresh token lama sudah di-blacklist)
- app/middleware/auth.global.ts -- replikasi persis proteksi route
  Next.js (staff vs portal vs halaman print)
- shared/types/auth.d.ts -- augmentasi tipe sesi (taruh di shared/,
  bukan types/ -- baru ketahuan lewat typecheck bahwa tsconfig server
  Nuxt 4 tidak scan folder types/ di root, cuma shared/**/*.d.ts)

Tema dan layout:
- app/assets/css/tailwind.css -- porting persis sistem warna NEXTADMS
  (HSL variables, termasuk .sidebar-shell -- identitas navy sidebar
  yang tetap terlepas dari mode terang/gelap)
- app/components/layout/Sidebar.vue, Topbar.vue, ThemeToggle.vue
- app/layouts/default.vue

Komponen UI dasar (ditulis manual -- CLI shadcn-vue butuh akses ke
shadcn-vue.com yang tidak ada di allowlist domain sandbox saya):
Button, Input, Label, Card, Badge, Table (+ 5 sub-komponennya)

2 modul inti (bukti kerja end-to-end):
- app/pages/index.vue -- Dashboard home
- app/pages/users/index.vue -- Manajemen User (view-only dulu, list +
  cari, belum ada create/edit/delete/permission dialog, itu menyusul
  di tahap berikutnya)

## Diverifikasi (bukan cuma seharusnya jalan)

1. npx nuxt typecheck -- lolos bersih, exit code 0, di seluruh proyek
2. npm run build -- production build berhasil penuh (client + server
   bundle)
3. Server hasil build dijalankan sungguhan (node .output/server/index.mjs)
   dan dites dengan curl:
   - Halaman /login merender dengan benar (branding NUXTADMS, teks
     Masuk ke konsol muncul di HTML, status 200)
   - Akses / (Dashboard) tanpa login -- redirect 302 ke
     /login?callbackUrl=/ (middleware benar-benar jalan, bukan cuma
     lolos typecheck)
   - Akses /users tanpa login -- redirect 302 ke /login?callbackUrl=/users

## Catatan teknis penting (supaya tidak terulang)

1. TypeScript 7 vs vue-tsc: shadcn-nuxt otomatis install TypeScript
   versi terbaru (7.x) sbg dev dependency, tapi vue-tsc (dipakai nuxt
   typecheck) belum kompatibel dengan versi itu (error
   ERR_PACKAGE_PATH_NOT_EXPORTED). Sudah di-pin ke ~5.9.2 di
   package.json paket ini.

2. tailwindcss-animate tidak jalan di Tailwind v4: package itu ditulis
   untuk config JS Tailwind v3, tidak bisa di-@import langsung sbg CSS
   di v4. Sudah diganti tw-animate-css (port CSS-native untuk pola
   import Tailwind v4).

3. Lokasi augmentasi tipe (declare module #auth-utils): wajib di
   shared/**/*.d.ts, bukan types/*.d.ts di root -- tsconfig yang
   di-generate Nuxt 4 untuk konteks server tidak men-scan folder
   types/ di root sama sekali.

4. CLI shadcn-vue tidak bisa dipakai di sandbox saya -- perlu akses ke
   shadcn-vue.com. Komponen UI dasar ditulis manual mengikuti pola
   resminya (reka-ui primitives, cva untuk variant, struktur folder
   per-komponen dgn index.ts barrel export) -- kalau Anda punya akses
   network penuh, npx shadcn-vue@latest add <komponen> seharusnya
   tetap bisa dipakai normal untuk komponen tambahan.

## Yang belum dikerjakan (menyusul, sesuai rencana bertahap)

- Dialog create/edit/delete/permission untuk halaman Users
- Modul-modul besar lain: Active Device (list sudah ada di nav tapi
  halamannya belum dibuat), Mikrotik, Active Directory, Mail Server,
  Cloudflare, ID Card, Portal (~15+ fitur granular permission), dst --
  puluhan modul, porting satu per satu sesuai prioritas yang Anda
  tentukan
- Komponen shadcn-vue lain yang dibutuhkan modul berikutnya (Dialog,
  Select, DropdownMenu, Tooltip, dst -- baru dibuat sesuai kebutuhan)
