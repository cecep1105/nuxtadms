/**
 * Composable utk fetch ke API Django dari CLIENT (form submit, dialog
 * aksi, dst) -- SAMA PERSIS peran api-client.ts versi Next.js, cuma
 * useSession() React diganti useUserSession() nuxt-auth-utils.
 */
export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown) {
    super(`API error ${status}`)
    this.status = status
    this.body = body
  }
}

/**
 * Request GAGAL TOTAL sebelum sempat dapat respons HTTP apa pun -- CORS
 * ditolak browser, server API tidak terjangkau/mati, DNS gagal, dst.
 * SENGAJA dipisah dari ApiError (server MERESPONS, cuma responsnya
 * error) -- keduanya butuh langkah diagnosis yang beda.
 */
export class NetworkError extends Error {
  url: string
  constructor(url: string, cause: unknown) {
    super(
      `Tidak bisa terhubung ke API di '${url}'. Kemungkinan penyebab: (1) server Django/nginx belum ` +
        `jalan atau path proxy nginx salah, (2) kalau NUXT_PUBLIC_API_BASE_URL di-override manual ke ` +
        `origin BERBEDA, origin frontend ini mungkin TIDAK ada di CORS_ALLOWED_ORIGINS Django -- cek ` +
        `tab Network/Console browser utk pesan spesifik.`
    )
    this.url = url
    this.cause = cause
  }
}

export function useApiClient() {
  const { session } = useUserSession()
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBaseUrl || "/api/v1"

  async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const url = path.startsWith("http") ? path : `${apiBaseUrl}${path}`
    const accessToken = session.value?.accessToken

    let res: Response
    try {
      res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...options.headers,
        },
      })
    } catch (cause) {
      throw new NetworkError(url, cause)
    }

    if (!res.ok) {
      let body: unknown = null
      try {
        body = await res.json()
      } catch {
        /* bukan JSON */
      }
      throw new ApiError(res.status, body)
    }

    if (res.status === 204) return undefined as T
    return res.json()
  }

  return { request, session }
}
