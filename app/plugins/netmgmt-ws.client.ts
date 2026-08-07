/**
 * Koneksi WebSocket /ws/netmgmt -- broadcast mail queue (Zentyal),
 * netwatch (Mikrotik), & user AD terkunci. `.client.ts` (bukan
 * `.ts` polos) -- Nitro TIDAK PERNAH jalankan plugin ini di server,
 * WebSocket browser TIDAK relevan/tidak ada di SSR.
 */
export default defineNuxtPlugin(() => {
  const netmgmtWs = createWsConnection("/ws/netmgmt")
  return { provide: { netmgmtWs } }
})
