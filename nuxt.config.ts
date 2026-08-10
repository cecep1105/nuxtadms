import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['shadcn-nuxt', 'nuxt-auth-utils', '@vueuse/nuxt'],

  // ⚠️ BUG KRITIS YANG SUDAH DIPERBAIKI: Nuxt SECARA DEFAULT
  // memprefiks nama auto-import komponen dengan nama folder INDUKnya
  // kalau nama folder itu TIDAK cocok dgn nama file (konvensi resminya
  // -- lihat docs.nuxt.com/guide/directory-structure/components#component-names).
  // app/components/layout/Sidebar.vue jadi <LayoutSidebar>,
  // app/components/shared/PageHeader.vue jadi <SharedPageHeader>, DST
  // -- SEMUA komponen di layout/ & shared/ (Sidebar, Topbar, NavLink,
  // NavItemRenderer, ThemeToggle, PageHeader, DeleteConfirmButton,
  // ComingSoon) KE-PREFIKS begini, TAPI SELURUH kode saya menulisnya
  // TANPA prefiks (<Sidebar>, <PageHeader>, dst, mengikuti pola nama
  // versi Next.js). Vue TIDAK melempar error keras utk custom element
  // yg tidak dikenal -- di SSR production build, elemen semacam itu
  // SENYAP tidak merender apa pun (bukan sekadar warning) -- makanya
  // BARU ketahuan lewat pemeriksaan HTML mentah manual (h1/aside/header
  // count = 0), BUKAN dari error di terminal/log mana pun.
  //
  // FIX: matikan path-prefix KHUSUS utk 2 folder ini (folder ui/ TIDAK
  // kena masalah ini krn shadcn-nuxt module py logic registrasi
  // sendiri, sudah TANPA prefix dari awal).
  // ⚠️ BUG KRITIS #2 YANG SUDAH DIPERBAIKI: Nuxt HANYA scan
  // app/components/** utk auto-import SECARA DEFAULT -- TIDAK spt
  // Next.js yang scan _components/ manapun lokasinya via konvensi
  // App Router. Pola app/pages/xxx/_components/*.vue (dipakai di
  // SELURUH modul Users & Active Device, meniru struktur Next.js)
  // SAMA SEKALI TIDAK ter-auto-import tanpa baris `pattern` di bawah
  // -- gejalanya SAMA PERSIS dgn bug #1 di atas (elemen custom tidak
  // dikenal, SSR render senyap jadi komentar kosong, TANPA error apa
  // pun di log) -- baru ketahuan lewat pemeriksaan HTML manual JUGA,
  // tombol "Tambah Device"/"Tambah User" (DeviceFormDialog/
  // UserFormDialog, keduanya di _components/) hilang total dari HTML.
  components: [
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/shared', pathPrefix: false },
    { path: '~/pages', pattern: '**/_components/*.vue', pathPrefix: false },
    '~/components',
  ],

  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',

  },

  // Sama pola dgn NextAuth (auth.ts::API_BASE_URL) -- djangoInternalUrl
  // dipakai server/api/auth/* & session-refresh.ts, TIDAK terekspos ke
  // browser. `public.apiBaseUrl` yg BENAR-BENAR dipanggil dari BROWSER
  // (beda origin dari server-side call) -- SAMA pola dgn
  // NEXT_PUBLIC_API_BASE_URL di app Next.js.
  //
  // ⚠️ WAJIB override lewat env var BERPREFIX NUXT_ (NUXT_DJANGO_INTERNAL_URL,
  // BUKAN cuma DJANGO_INTERNAL_URL) -- ini aturan Nuxt runtimeConfig, BUKAN
  // pilihan bebas. Nilai default di bawah HANYA dipakai kalau env var itu
  // TIDAK diisi sama sekali (lihat .env.example).
  runtimeConfig: {
    djangoInternalUrl: 'http://127.0.0.1:8000/api/v1',
    // Kredensial vCenter -- SERVER-ONLY (private, bukan di bawah
    // `public`), dipakai server/utils/vsphere.ts. Override via
    // NUXT_VSPHERE_HOST / NUXT_VSPHERE_USER / NUXT_VSPHERE_PASSWORD /
    // NUXT_VSPHERE_ALLOW_SELF_SIGNED_CERT.
    vsphereHost: '',
    vsphereUser: '',
    vspherePassword: '',
    vsphereAllowSelfSignedCert: 'true',
    // ⚠️ BUG YANG SUDAH DIPERBAIKI: nuxt-auth-utils TIDAK set `secure`
    // eksplisit di config cookie sesi bawaannya -- jatuh ke default
    // library dasarnya (h3/cookie-es), yaitu TRUE. Cookie dgn flag
    // Secure HANYA dikirim browser lewat HTTPS -- kalau app diakses
    // via HTTP biasa (umum utk dev lokal & BANYAK deployment internal
    // di balik reverse proxy tanpa TLS), browser DIAM-DIAM MENOLAK
    // menyimpan/mengirim cookie ini. Gejalanya PERSIS spt yg
    // dilaporkan: login API sukses (cookie DIKIRIM server), TAPI
    // browser tidak pernah benar2 MENYIMPANNYA -- request berikutnya
    // TIDAK bawa cookie sesi sama sekali, isLoggedIn SELALU false.
    // curl TIDAK mereproduksi bug ini krn curl tidak menegakkan aturan
    // Secure cookie spt browser sungguhan.
    //
    // ⚠️ CATATAN PENTING soal LOKASI config ini: nuxt-auth-utils BACA
    // dari `runtimeConfig.session` (BUKAN top-level `session` di
    // defineNuxtConfig() -- percobaan PERTAMA saya taruh di situ,
    // config-nya SAMA SEKALI TIDAK terbaca modul, Secure tetap true
    // walau nilai yg di-set false, krn Nuxt TIDAK PERNAH mem-forward
    // top-level `session` ke `runtimeConfig.session` secara otomatis).
    //
    // Default di bawah: false (aman utk HTTP lokal/internal). Kalau
    // deployment PRODUKSI Anda benar2 di belakang HTTPS (nginx dgn
    // TLS, dst), SET env var NUXT_SESSION_COOKIE_SECURE=true supaya
    // cookie sesi ikut terlindungi flag Secure sesuai praktik
    // keamanan yang benar.
    session: {
      cookie: {
        secure: process.env.NUXT_SESSION_COOKIE_SECURE === 'true',
      },
    },
    public: {
      apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
      mediaUrl: '',
      wsBaseUrl: '',
      // Override via NUXT_PUBLIC_GOOGLE_MAPS_API_KEY -- dipakai
      // PoolLocationMapDrawer.vue (fitur gambar polygon geofence di
      // peta). Aktifkan "Maps JavaScript API" di Google Cloud Console.
      googleMapsApiKey: '',
      // Fallback PALING AKHIR (dipakai kalau admin belum set default via
      // Django Admin NetmgmtRouterDefault DAN user belum pilih router
      // lain lewat dropdown RouterSelector) -- MENJAGA KOMPATIBILITAS
      // dgn setup lama sebelum fitur dropdown ini ada.
      mikrotikDhcpRouterIp: '10.100.202.254',
      mikrotikFwfilterRouterIp: '10.100.202.254',
      // IP router netwatch BEDA dari dhcp/fwfilter (.1 vs .254) --
      // KEMUNGKINAN BESAR memang 2 router fisik BERBEDA (bukan salah
      // ketik), makanya config-nya SENGAJA dipisah per-halaman.
      mikrotikNetwatchRouterIp: '10.100.202.1',
    },
  },

  app: {
    head: {
      title: 'NUXTADMS — IT Infrastructure Management',
      meta: [
        { name: 'description', content: 'Konsol manajemen infrastruktur IT: Active Directory, jaringan, mail server, ID card, device fingerprint, dan mobile attendance.' },
      ],
      script: [
        {
          // ⚠️ FIX FOUC dark mode (halaman kedip light->dark sesaat tiap
          // refresh manual saat posisi dark -- Next.js/next-themes TIDAK
          // begini krn next-themes OTOMATIS inject script blocking spt ini,
          // VueUse useDark() TIDAK melakukan itu sendiri) --
          // ThemeToggle.vue pakai useDark() VueUse APA ADANYA (tanpa
          // opsi), yang BERARTI baca localStorage & apply class 'dark' ke
          // <html> BARU terjadi saat Vue hydrate di CLIENT (localStorage
          // tidak ada saat SSR) -- HTML awal SELALU terkirim tanpa class
          // 'dark' dulu (browser sempat paint LIGHT), baru SETELAH
          // hydration jalan, class 'dark' ditambahkan -- itu KEDIPnya.
          //
          // Script INI jalan SEBAGAI SCRIPT BLOCKING PALING AWAL di <head>
          // (SEBELUM CSS/apapun dirender), baca localStorage & apply class
          // 'dark' SECARA SINKRON SEBELUM browser sempat paint apa pun --
          // TIDAK ADA lagi jeda utk mata manusia lihat kedipnya. Key
          // ('vueuse-color-scheme') & logic (auto -> ikut
          // prefers-color-scheme) PERSIS SAMA dgn default useColorMode()
          // milik VueUse (dipakai internal oleh useDark()) -- WAJIB selalu
          // disinkronkan kalau opsi useDark() di ThemeToggle.vue nanti
          // diubah dari default.
          innerHTML: `(function(){try{var s=localStorage.getItem('vueuse-color-scheme')||'auto';var d=s==='dark'||(s==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})();`,
          tagPriority: 'critical',
        },
      ],
    },
  },

  typescript: {
    strict: true,
    // Registrasi tipe global google.maps.* (paket @types/google.maps) --
    // dipakai PoolLocationMapDrawer.vue. Tanpa ini, tsconfig auto-generate
    // Nuxt TIDAK otomatis include paket @types/* pihak ketiga di luar yg
    // Nuxt sendiri butuhkan.
    tsConfig: {
      compilerOptions: {
        types: ['google.maps'],
      },
    },
  },
  
})
