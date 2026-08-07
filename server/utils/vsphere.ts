import https from "node:https"

/**
 * Client vCenter REST API (vSphere 7.0, gaya LAMA /rest/... -- BUKAN
 * /api/... yang lebih baru) -- port LANGSUNG dari vsphere-client.ts
 * versi Next.js, logic 1:1 sama.
 *
 * KENAPA PAKAI https NATIVE (bukan $fetch/fetch biasa): vCenter
 * appliance ON-PREM HAMPIR SELALU pakai sertifikat SELF-SIGNED --
 * fetch() bawaan TIDAK PUNYA cara simpel/stabil menerima sertifikat
 * self-signed per-request, sedangkan https.request() punya opsi
 * rejectUnauthorized bawaan yang stabil.
 *
 * SESI vCenter di-CACHE di memori MODULE-LEVEL (bukan re-login tiap
 * request) -- proses Nitro/Node ini jalan LAMA (bukan serverless
 * sekali pakai), cache sederhana begini cukup efektif. Re-login
 * otomatis kalau request gagal 401 (sesi kedaluwarsa) ATAU belum
 * pernah login.
 */

export class VsphereError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RawResponse {
  status: number
  body: unknown
}

function getConfig() {
  const config = useRuntimeConfig()
  return {
    host: config.vsphereHost,
    user: config.vsphereUser,
    password: config.vspherePassword,
    allowSelfSigned: config.vsphereAllowSelfSignedCert !== "false",
  }
}

function rawRequest(method: string, path: string, headers: Record<string, string>, body?: unknown): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const { host, allowSelfSigned } = getConfig()
    if (!host) {
      reject(new VsphereError(500, "NUXT_VSPHERE_HOST belum diisi di .env."))
      return
    }
    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined
    const req = https.request(
      {
        hostname: host,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
          ...headers,
        },
        rejectUnauthorized: !allowSelfSigned,
        timeout: 15000,
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => { data += chunk })
        res.on("end", () => {
          let parsed: unknown = null
          if (data) {
            try { parsed = JSON.parse(data) } catch { parsed = data }
          }
          resolve({ status: res.statusCode ?? 0, body: parsed })
        })
      }
    )
    req.on("timeout", () => req.destroy(new Error("Timeout menghubungi vCenter.")))
    req.on("error", (err) => reject(new VsphereError(502, `Gagal menghubungi vCenter: ${err.message}`)))
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

let cachedSessionId: string | null = null

async function login(): Promise<string> {
  const { user, password } = getConfig()
  if (!user || !password) {
    throw new VsphereError(500, "NUXT_VSPHERE_USER/NUXT_VSPHERE_PASSWORD belum diisi di .env.")
  }
  const auth = Buffer.from(`${user}:${password}`).toString("base64")
  const res = await rawRequest("POST", "/rest/com/vmware/cis/session", { Authorization: `Basic ${auth}` })
  if (res.status !== 200 || typeof (res.body as { value?: string })?.value !== "string") {
    throw new VsphereError(res.status || 502, `Login vCenter gagal (status ${res.status}): ${JSON.stringify(res.body)}`)
  }
  cachedSessionId = (res.body as { value: string }).value
  return cachedSessionId
}

/**
 * Request ke endpoint vCenter APA PUN (dgn path lengkap, mis.
 * "/rest/vcenter/host") -- otomatis login dulu kalau belum py sesi
 * ter-cache, & otomatis LOGIN ULANG + ulangi request SEKALI kalau
 * response awal 401 (sesi kedaluwarsa).
 */
export async function vsphereRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  if (!cachedSessionId) {
    await login()
  }

  let res = await rawRequest(method, path, { "vmware-api-session-id": cachedSessionId! }, body)

  if (res.status === 401) {
    await login()
    res = await rawRequest(method, path, { "vmware-api-session-id": cachedSessionId! }, body)
  }

  if (res.status >= 400) {
    throw new VsphereError(res.status, `vCenter API error (${res.status}) utk ${method} ${path}: ${JSON.stringify(res.body)}`)
  }

  return res.body as T
}
