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
import { useSession } from "h3"

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


  // ⚠️ BUG SESUNGGUHNYA (baru ketahuan setelah investigasi mendalam ke
  // source code h3, BUKAN cuma nuxt-auth-utils): replaceUserSession()
  // internal-nya manggil session.clear() LALU session.update(data) --
  // TAPI clear() cuma menghapus event.context.sessions[name] dari
  // MEMORI request ini, TIDAK bisa "menghapus" cookie yang SUDAH
  // TERLANJUR ada di REQUEST MASUK (Cookie header itu immutable dalam
  // 1 request). Giliran update() jalan: dia cek
  // `event.context.sessions?.[name] || await getSession(...)` --
  // krn barusan DIHAPUS clear(), jatuh ke fallback getSession(), YANG
  // BACA ULANG COOKIE DARI REQUEST & UNSEAL DATA LAMA (lengkap dgn
  // field `error` yg mau dibuang)! update() lalu Object.assign() data
  // BARU ke atas data LAMA yg baru saja "dihidupkan lagi" itu -- field
  // `error` yg TIDAK ada di data baru TETAP nempel dari hasil unseal
  // ulang tsb. Ini KENAPA percobaan replaceUserSession() SEBELUMNYA
  // TETAP GAGAL walau secara nama terdengar "replace penuh".
  //
  // setUserSession() JUGA tidak bisa dipakai sbg pengganti -- dia
  // pakai defu(data, session.data), & defu SECARA SENGAJA skip value
  // null MAUPUN undefined saat merge (lihat node_modules/defu/dist/defu.mjs:
  // `if (value === null || value === void 0) continue`) -- SET
  // `error: null` atau `error: undefined` scr eksplisit di data baru
  // SAMA SEKALI TIDAK membantu, defu tetap jatuh ke nilai LAMA.
  //
  // FIX SESUNGGUHNYA: kosongkan session.data SECARA IN-PLACE (hapus
  // semua key-nya SATU PER SATU, TANPA memanggil .clear() yg
  // menghapus REFERENSI objeknya dari event.context.sessions), BARU
  // panggil .update(data) -- krn objek session-nya TIDAK PERNAH benar2
  // dihapus dari event.context.sessions, updateSession() TIDAK PERNAH
  // jatuh ke fallback getSession() yg baca ulang cookie lama itu.
  const session = await useSession(event, useRuntimeConfig().session as Parameters<typeof useSession>[1])
  for (const key of Object.keys(session.data)) delete (session.data as Record<string, unknown>)[key]
  await session.update({
    user: data.user as any,
    accessToken: data.access,
    refreshToken: data.refresh,
    accessTokenExpires: decodeJwtExpiry(data.access),
  })
  return { ok: true }
})
