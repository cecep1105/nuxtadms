/**
 * Proxy generik ke vCenter REST API -- path setelah /api/vsphere/
 * diteruskan APA ADANYA ke /rest/vcenter/<path> di vCenter. Autentikasi
 * & session caching ditangani vsphereRequest() (server/utils/vsphere.ts)
 * -- route ini TIDAK perlu tahu detail login/session sama sekali.
 *
 * Contoh: GET /api/vsphere/host -> GET https://<vcenter>/rest/vcenter/host
 *         POST /api/vsphere/vm/vm-1/power/reset -> POST .../vm/vm-1/power/reset
 *
 * SATU file menangani SEMUA method (GET/POST/PATCH/DELETE) -- SAMA
 * pola dgn versi Next.js yg 4 export function beda tapi logic sama,
 * di Nitro cukup 1 handler + cek event.method.
 */
export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, "path") ?? ""
  const vcenterPath = "/rest/vcenter/" + pathParam
  const query = getQuery(event)
  const search = Object.keys(query).length > 0 ? "?" + new URLSearchParams(query as Record<string, string>).toString() : ""

  let body: unknown
  if (["POST", "PATCH", "PUT"].includes(event.method)) {
    body = await readBody(event).catch(() => undefined)
  }

  try {
    return await vsphereRequest(event.method, vcenterPath + search, body)
  } catch (err) {
    const status = err instanceof VsphereError ? err.status : 502
    const message = err instanceof Error ? err.message : "Gagal menghubungi vCenter."
    throw createError({ statusCode: status, statusMessage: message, data: { error: message } })
  }
})
