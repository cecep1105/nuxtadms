/**
 * Replikasi PERSIS default behavior next-auth SessionProvider
 * (refetchOnWindowFocus=true -- DEFAULT next-auth, TIDAK di-override
 * di providers.tsx Next.js proyek ini, dikonfirmasi langsung dari
 * source -- artinya versi Next.js MEMANG mengandalkan perilaku
 * default ini) -- nuxt-auth-utils TIDAK PUNYA equivalent bawaan.
 *
 * INI KEMUNGKINAN BESAR penyebab UTAMA laporan "session expired
 * lebih cepat/sering di Nuxt dibanding Next.js": SEBELUM plugin ini,
 * refresh token di Nuxt CUMA terjadi saat NAVIGASI ANTAR HALAMAN
 * (lihat middleware/auth.global.ts) -- user yang lama di 1 halaman
 * (isi form panjang, list & cari2 tanpa pindah halaman) TAPI SERING
 * pindah tab/aplikasi lain lalu balik lagi (pola pemakaian
 * SEHARI-HARI yang SANGAT umum) tokennya TIDAK PERNAH direfresh
 * SAMPAI dia navigasi ke halaman lain -- MATCH PERSIS gejala yang
 * dilaporkan. Next.js TIDAK kena ini krn next-auth OTOMATIS
 * cek/refresh sesi di background SETIAP KALI tab ini kembali
 * fokus/visible, TIDAK PERLU navigasi sama sekali.
 *
 * `visibilitychange` (BUKAN window `focus`/`blur` mentah) SENGAJA
 * dipilih -- lebih RELIABLE lintas browser utk deteksi "user balik ke
 * tab ini" (focus/blur mentah TERBUKTI TIDAK KONSISTEN di sejumlah
 * kombinasi OS/browser saat pindah ANTAR WINDOW, bukan cuma antar
 * tab).
 *
 * SEKALIAN ditambahkan padanan SessionErrorHandler (providers.tsx
 * Next.js) -- watcher AKTIF yang LANGSUNG redirect ke /login begitu
 * session.error jadi "RefreshTokenError" (refresh token itu SENDIRI
 * sudah invalid/expired, BUKAN cuma access token) -- TANPA ini, user
 * bisa "diam" di halaman yang sudah logically logged-out (API call
 * berikutnya baru gagal 401 satu per satu) SAMPAI navigasi berikutnya
 * baru ke-redirect oleh middleware. `firedRef`-equivalent (guard
 * boolean lokal) & skip-kalau-sudah-di-/login SAMA PERSIS alasan
 * dgn versi Next.js -- cegah signOut()/redirect berulang kalau
 * session.error "menyala" beberapa kali berturut-turut sblm cookie
 * benar2 ke-clear.
 */
export default defineNuxtPlugin(() => {
  const { session, fetch: refreshSession, clear } = useUserSession()
  const route = useRoute()

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      refreshSession()
    }
  }
  document.addEventListener("visibilitychange", handleVisibilityChange)

  let redirectFired = false
  watch(
    () => session.value?.error,
    async (error) => {
      if (error === "RefreshTokenError" && route.path !== "/login" && !redirectFired) {
        redirectFired = true
        await clear()
        window.location.href = "/login"
      }
    }
  )
})
