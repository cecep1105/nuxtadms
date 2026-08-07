/**
 * Sinkronkan data `user` di sesi Nuxt SETELAH profil diupdate (PATCH
 * /me/ ke Django) -- padanan `updateSession()` NextAuth versi
 * Next.js. TANPA ini, Topbar (nama/avatar) akan tetap menampilkan data
 * LAMA sampai login ulang, walau di database Django sudah berubah.
 *
 * Body user yang dikirim dari client adalah HASIL response PATCH /me/
 * (serializer LENGKAP, semua field ada) -- aman di-set langsung sbg
 * pengganti user di sesi, TIDAK perlu merge parsial.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ user: Record<string, unknown> }>(event)
  if (!body?.user) {
    throw createError({ statusCode: 400, statusMessage: "Field 'user' wajib diisi." })
  }
  // Type setUserSession() menuntut BENTUK LENGKAP UserSession
  // (accessToken/refreshToken/dst) -- TAPI perilaku RUNTIME-nya (defu
  // merge, lihat catatan panjang di server/api/auth/login.post.ts)
  // MEMANG mendukung partial update, field yang tidak disebut TETAP
  // dari sesi lama. Assertion di sini MURNI utk lolos TypeScript,
  // BUKAN mengubah perilaku runtime.
  await setUserSession(event, { user: body.user } as unknown as Parameters<typeof setUserSession>[1])
  return { ok: true }
})
