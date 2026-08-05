/**
 * POST /api/auth/login -- SAMA PERSIS alur versi Next.js
 * (auth.ts::authorize()): forward username/password ke Django
 * /auth/login/, simpan access/refresh token + data user ke sesi
 * (nuxt-auth-utils, sealed cookie httpOnly).
 *
 * ⚠️ CATATAN DIAGNOSTIK: versi SEBELUMNYA nelan SEMUA jenis error jadi
 * satu pesan generik "Username atau password salah" -- termasuk kalau
 * Nuxt server GAGAL TERHUBUNG ke Django sama sekali (DJANGO_INTERNAL_URL
 * salah/Django belum jalan/masalah jaringan Docker), BUKAN cuma
 * kredensial yang salah. Ini bisa MENYESATKAN: orang yakin
 * username/password-nya benar tapi tetap dapat pesan "salah", padahal
 * akar masalahnya konektivitas, bukan kredensial. Sekarang dibedakan
 * EKSPLISIT + di-log server-side (muncul di terminal `npm run dev`)
 * supaya penyebab SEBENARNYA kelihatan.
 */
export default defineEventHandler(async (event) => {
  const { username, password } = await readBody<{ username: string; password: string }>(event)
  const config = useRuntimeConfig()
  const loginUrl = `${config.djangoInternalUrl}/auth/login/`

  let data: { user: Record<string, unknown>; access: string; refresh: string }
  try {
    data = await $fetch<{ user: Record<string, unknown>; access: string; refresh: string }>(loginUrl, {
      method: "POST",
      body: { username, password },
    })


  } catch (err: any) {
    // $fetch (ofetch) dari Nuxt: error PUNYA `response` kalau Django
    // SEMPAT merespons (mis. 401 kredensial salah) -- TIDAK punya
    // `response` kalau request GAGAL TOTAL sebelum sampai ke Django
    // (ECONNREFUSED, DNS gagal, timeout, dst).
    if (err?.response) {
      console.error(`[auth/login] Django menolak (${err.response.status}) di ${loginUrl}:`, err.data ?? err.response._data)
      throw createError({ statusCode: 401, statusMessage: "Username atau password salah." })
    }
    console.error(`[auth/login] GAGAL TERHUBUNG ke Django di ${loginUrl}:`, err?.message ?? err)
    throw createError({
      statusCode: 502,
      statusMessage: `Tidak bisa terhubung ke server Django di '${loginUrl}'. Cek DJANGO_INTERNAL_URL di .env & pastikan Django sedang jalan & terjangkau dari server Nuxt ini.`,
    })
  }

  await setUserSession(event, {
    user: data.user as any,
    accessToken: data.access,
    refreshToken: data.refresh,
    accessTokenExpires: decodeJwtExpiry(data.access),
  })
  return { ok: true }
})
