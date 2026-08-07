import type { WsMessage, WsConnectionStatus } from "./createWsConnection"

/**
 * ⚠️ SAMA BUG & FIX dgn useNetmgmtWsMessage.ts (lihat catatan lengkap
 * di sana) -- $iclockWs juga cuma tersedia CLIENT-SIDE (plugin
 * iclock-ws.client.ts), guard SAMA diperlukan di sini.
 */
export function useIclockWsMessage(onMessage: (msg: WsMessage) => void) {
  const { $iclockWs } = useNuxtApp()
  if (!$iclockWs) {
    return { status: ref<WsConnectionStatus>("disconnected") }
  }
  onMounted(() => {
    const unsubscribe = $iclockWs.subscribe(onMessage)
    onUnmounted(unsubscribe)
  })
  return { status: $iclockWs.status }
}
