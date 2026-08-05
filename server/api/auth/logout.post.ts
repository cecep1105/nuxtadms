/**
 * POST /api/auth/logout -- panggil Django /auth/logout/ dulu (blacklist
 * refresh token server-side), baru hapus sesi Nuxt lokal. Sesi lokal
 * TETAP dihapus meski panggilan ke Django gagal (mis. token sudah
 * expired) -- pengguna tidak boleh "terjebak" tidak bisa logout.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const config = useRuntimeConfig()

  if (session.accessToken && session.refreshToken) {
    await $fetch(`${config.djangoInternalUrl}/auth/logout/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: { refresh: session.refreshToken },
    }).catch(() => null)
  }

  await clearUserSession(event)
  return { ok: true }
})
