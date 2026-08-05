/**
 * POST /api/auth/login -- SAMA PERSIS alur versi Next.js
 * (auth.ts::authorize()): forward username/password ke Django
 * /auth/login/, simpan access/refresh token + data user ke sesi
 * (nuxt-auth-utils, sealed cookie httpOnly).
 */
export default defineEventHandler(async (event) => {
  const { username, password } = await readBody<{ username: string; password: string }>(event)
  const config = useRuntimeConfig()

  const data = await $fetch<{ user: Record<string, unknown>; access: string; refresh: string }>(
    `${config.djangoInternalUrl}/auth/login/`,
    {
      method: "POST",
      body: { username, password },
    }
  ).catch(() => null)

  if (!data) {
    throw createError({ statusCode: 401, statusMessage: "Username atau password salah." })
  }

  await setUserSession(event, {
    user: data.user as any,
    accessToken: data.access,
    refreshToken: data.refresh,
    accessTokenExpires: decodeJwtExpiry(data.access),
  })

  return { ok: true }
})
