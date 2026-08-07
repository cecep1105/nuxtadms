/**
 * Factory KONEKSI WEBSOCKET generik -- dipakai bikin 2 koneksi TERPISAH
 * (bukan 1 koneksi di-share): /ws/netmgmt (mail queue/netwatch/AD locked
 * users) & /ws/iclock (status device fingerprint real-time) -- SAMA
 * alasan dgn versi Next.js: client yang cuma buka halaman netmgmt TIDAK
 * perlu ikut ke-subscribe traffic iClock yang jauh lebih ramai (banyak
 * device fisik), begitu juga sebaliknya.
 *
 * URL WebSocket WAJIB dihitung dinamis dari window.location (BUKAN path
 * relatif spt fetch()) -- koneksi WebSocket butuh URL LENGKAP
 * (ws://host atau wss://host). Skema ws:/wss: otomatis ikut skema
 * halaman (http:/https:) -- browser TOLAK mixed-content (https + ws
 * polos), jadi harus selalu sepasang.
 */
export interface WsMessage {
  section: string
  message: Record<string, unknown>
}
export type WsConnectionStatus = "connecting" | "connected" | "disconnected"
type Listener = (msg: WsMessage) => void

function getWsBaseUrl(overrideUrl: string): string {
  if (overrideUrl) return overrideUrl
  if (typeof window === "undefined") return "" // SSR -- tidak relevan, WebSocket cuma jalan di browser
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${scheme}//${window.location.host}`
}

export function createWsConnection(endpointPath: string) {
  const status = ref<WsConnectionStatus>("connecting")
  const listeners = new Set<Listener>()

  const { session } = useUserSession()
  const config = useRuntimeConfig()

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let closedByCleanup = false

  function connect() {
    const token = session.value?.accessToken
    if (!token) return
    status.value = "connecting"
    ws = new WebSocket(`${getWsBaseUrl(config.public.wsBaseUrl)}${endpointPath}?token=${token}`)

    ws.onopen = () => { status.value = "connected" }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage
        listeners.forEach((listener) => listener(data))
      } catch {
        // pesan bukan JSON valid -- abaikan, jangan crash listener
      }
    }

    ws.onclose = () => {
      status.value = "disconnected"
      if (!closedByCleanup) reconnectTimer = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      // onclose TETAP terpanggil setelah onerror -- reconnect cukup di onclose.
    }
  }

  // Tunggu accessToken TERSEDIA dulu (session baru resolve async saat
  // app start) -- connect segera setelah ada, DAN reconnect otomatis
  // kalau token berganti (mis. setelah refresh token rotation).
  watch(
    () => session.value?.accessToken,
    (token) => {
      if (token && (!ws || ws.readyState === WebSocket.CLOSED)) connect()
    },
    { immediate: true }
  )

  function subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function cleanup() {
    closedByCleanup = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
  }

  return { status, subscribe, cleanup }
}
