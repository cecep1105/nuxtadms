import type { WsMessage, WsConnectionStatus } from "./createWsConnection"

/**
 * ⚠️ BUG YANG SUDAH DIPERBAIKI (halaman crash 500 "Cannot read
 * properties of undefined (reading 'status')"): plugin
 * netmgmt-ws.client.ts CUMA jalan di CLIENT (nama file berakhiran
 * `.client.ts`, Nitro SENGAJA tidak pernah jalankan ini di server) --
 * TAPI composable ini dipanggil dari dalam <script setup> halaman/
 * komponen, yang jalan di SERVER JUGA (SSR) sebelum hydration. Saat
 * SSR, `useNuxtApp().$netmgmtWs` BELUM ADA SAMA SEKALI (undefined) --
 * baris lama `return { status: $netmgmtWs.status }` LANGSUNG crash
 * krn coba akses `.status` dari undefined. Fix: guard eksplisit --
 * kalau $netmgmtWs belum ada (SSR), balikin ref status statis
 * "disconnected" TANPA nyoba subscribe (percuma, event listener
 * client-only itu juga TIDAK ADA gunanya di server).
 */
export function useNetmgmtWsMessage(onMessage: (msg: WsMessage) => void) {
  const { $netmgmtWs } = useNuxtApp()
  if (!$netmgmtWs) {
    return { status: ref<WsConnectionStatus>("disconnected") }
  }
  onMounted(() => {
    const unsubscribe = $netmgmtWs.subscribe(onMessage)
    onUnmounted(unsubscribe)
  })
  return { status: $netmgmtWs.status }
}
