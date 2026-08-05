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

  // Sama pola dgn NextAuth (auth.ts::API_BASE_URL) -- dibaca SERVER-SIDE
  // saja (bukan NUXT_PUBLIC_*), dipakai server/api/auth/* & proxy fetch
  // internal Docker Compose. `public.apiBaseUrl` yg BENAR-BENAR dipanggil
  // dari BROWSER (beda origin dari server-side call) -- SAMA pola dgn
  // NEXT_PUBLIC_API_BASE_URL di app Next.js.
  runtimeConfig: {
    djangoInternalUrl: process.env.DJANGO_INTERNAL_URL || 'http://127.0.0.1:8000/api/v1',
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
      mediaUrl: process.env.NUXT_PUBLIC_MEDIA_URL || '',
      wsBaseUrl: process.env.NUXT_PUBLIC_WS_BASE_URL || '',
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
