import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['shadcn-nuxt', 'nuxt-auth-utils', '@vueuse/nuxt'],

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
    public: {
      apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
      mediaUrl: '',
      wsBaseUrl: '',
    },
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '790f61123f1e4592b346a02cd4499023',
    },





  },

  app: {
    head: {
      title: 'NUXTADMS — IT Infrastructure Management',
      meta: [
        { name: 'description', content: 'Konsol manajemen infrastruktur IT: Active Directory, jaringan, mail server, ID card, device fingerprint, dan mobile attendance.' },
      ],
    },
  },

  typescript: {
    strict: true,
  },
})
