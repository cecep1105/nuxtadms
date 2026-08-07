/**
 * Koneksi WebSocket /ws/iclock -- broadcast status device fingerprint
 * REAL-TIME (device_request = heartbeat/polling, device_attlog = ada
 * transaksi/absensi baru) -- TERPISAH dari /ws/netmgmt (volume traffic
 * jauh lebih ramai, banyak device fisik).
 */
export default defineNuxtPlugin(() => {
  const iclockWs = createWsConnection("/ws/iclock")
  return { provide: { iclockWs } }
})
