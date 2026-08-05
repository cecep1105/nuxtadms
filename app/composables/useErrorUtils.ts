/**
 * Ekstrak pesan error yang bisa ditampilkan dari hasil panggilan API --
 * ada 3 kemungkinan sumber, urutannya penting (dicek dari yang paling
 * spesifik):
 * 0. NetworkError -- fetch() gagal total (server tidak terjangkau),
 *    belum sempat dapat respons HTTP sama sekali. Pesannya sudah
 *    informatif dari sana, tampilkan apa adanya -- ini bukan
 *    kesalahan input user.
 * 1. {"code": "...", "message": "..."} -- dari service_error_response()
 *    Django, dipakai semua aksi user management.
 * 2. {"detail": "..."} -- dari APIView/PermissionDenied bawaan DRF.
 * 3. {"field": ["pesan", ...]} -- dari ValidationError serializer biasa.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof NetworkError) return err.message

  if (!(err instanceof ApiError) || !err.body) return fallback
  const body = err.body as Record<string, unknown>

  if (typeof body.message === "string") return body.message
  if (typeof body.detail === "string") return body.detail

  const messages = Object.entries(body)
    .filter(([key]) => key !== "code")
    .map(([, v]) => v)
    .flat()
    .filter((v): v is string => typeof v === "string")
  return messages.length > 0 ? messages.join(" ") : fallback
}
