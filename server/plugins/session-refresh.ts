/**
 * Hook 'fetch' nuxt-auth-utils -- dipanggil TIAP KALI sesi diambil,
 * SAMA PERSIS peran callback jwt() di versi Next.js (auth.ts).
 *
 * PENTING soal ROTATE_REFRESH_TOKENS: Django (config/settings.py::
 * SIMPLE_JWT) pakai ROTATE_REFRESH_TOKENS=True -- refresh token LAMA
 * otomatis di-blacklist stlh dipakai sekali, refresh token BARU wajib
 * disimpan ulang. Kalau hook ini cuma mengubah `session` di memori
 * (tanpa replaceUserSession()), token baru itu tidak pernah benar2
 * tersimpan ke cookie -- request berikutnya akan coba refresh pakai
 * refresh token lama yang sudah di-blacklist, gagal terus walau
 * usernya sebenarnya masih valid. replaceUserSession() wajib dipanggil
 * supaya token baru benar2 persisten ke sealed cookie.
 */
export default defineNitroPlugin(() => {
  sessionHooks.hook("fetch", async (session, event) => {
    if (!session.accessToken || !session.refreshToken) return

    // Access token MASIH berlaku (jeda 60 detik sblm expiry beneran) --
    // SAMA persis ambang batas versi Next.js.
    if (Date.now() < session.accessTokenExpires - 60_000) return

    const config = useRuntimeConfig()
    try {
      const refreshed = await $fetch<{ access: string; refresh?: string }>(
        `${config.djangoInternalUrl}/auth/refresh/`,
        { method: "POST", body: { refresh: session.refreshToken } }
      )
      const newAccessToken = refreshed.access
      const newRefreshToken = refreshed.refresh ?? session.refreshToken

      session.accessToken = newAccessToken
      session.refreshToken = newRefreshToken
      session.accessTokenExpires = decodeJwtExpiry(newAccessToken)
      delete session.error

      await replaceUserSession(event, session)
    } catch {
      session.error = "RefreshTokenError"
      await replaceUserSession(event, session)
    }
  })
})
