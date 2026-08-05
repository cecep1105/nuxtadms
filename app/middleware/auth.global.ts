/**
 * Middleware global (jalan di SEMUA navigasi, client & server SSR) --
 * SAMA PERSIS logic versi Next.js (src/middleware.ts), diadaptasi ke
 * useUserSession() nuxt-auth-utils. Bedanya dari Next.js: Nuxt tidak
 * punya "matcher" config di level framework, jadi pengecualian path
 * (mobile, print) dicek manual di dalam fungsi ini.
 */
const PORTAL_PREFIX = "/portal"
const IDCARD_PRINT_PREFIX = "/idcard-print"
// Path mobile (kalau nanti diporting) punya sistem auth SENDIRI
// (PIN + JWT tersimpan terpisah), TIDAK lewat sesi ini sama sekali.
const MOBILE_PREFIX = "/mobile"

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith(MOBILE_PREFIX)) return

  const { loggedIn, session, fetch: refreshSession } = useUserSession()

  // Pastikan sesi TERBARU sudah diambil (termasuk hasil hook 'fetch'
  // server -- refresh token otomatis kalau perlu) SEBELUM keputusan
  // redirect diambil, supaya tidak salah anggap "belum login" gara2
  // sesi lama yg belum sempat di-refresh.
  if (import.meta.client) {
    await refreshSession()
  }

  // Token BISA "ada" TAPI rusak (refresh token sudah invalid/expired,
  // ditandai error RefreshTokenError) -- treat sbg TIDAK logged in,
  // SAMA persis versi Next.js.
  const isLoggedIn = loggedIn.value && !session.value?.error
  const isLoginPage = to.path === "/login"
  const isStaff = !!(session.value?.user?.is_staff || session.value?.user?.is_superuser)
  const isPortalPath = to.path === PORTAL_PREFIX || to.path.startsWith(`${PORTAL_PREFIX}/`)
  const isIdCardPrintPath = to.path.startsWith(IDCARD_PRINT_PREFIX)

  // console.log(`[auth.global] middleware: isLoggedIn=${isLoggedIn}, isLoginPage=${isLoginPage}, isStaff=${isStaff}, isPortalPath=${isPortalPath}, isIdCardPrintPath=${isIdCardPrintPath}, to.path=${to.path}`)

  console.log(isLoggedIn)

  if (!isLoggedIn && !isLoginPage) {
    return navigateTo({ path: "/login", query: { callbackUrl: to.fullPath } })
  }

  if (isLoggedIn && isLoginPage) {
    return navigateTo(isStaff ? "/" : PORTAL_PREFIX)
  }

  if (isLoggedIn && !isStaff && !isPortalPath && !isIdCardPrintPath) {
    return navigateTo(PORTAL_PREFIX)
  }
})
