/**
 * Ambil tiket console VMRC (VMware Remote Console) utk 1 VM, susun URI
 * vmrc:// LENGKAP di sini (server-side).
 *
 * ⚠️ CATATAN PENTING (dari pengalaman produksi versi Next.js, DIPORTING
 * APA ADANYA krn ini bukan asumsi tapi temuan nyata): field `ticket`
 * yang dikembalikan vCenter TERNYATA BUKAN token mentah, MELAINKAN
 * string yang SUDAH berbentuk mirip URI vmrc LENGKAP (sudah termasuk
 * host & ?moid=...), cuma skemanya "vmrc//" (kurang 1 titik dua) bukan
 * "vmrc://", misalnya:
 *
 *   vmrc//clone:cst-VCT-<uuid>--tp-<thumbprint>@<vcenter-host>:443/?moid=<vm-id>
 *
 * Kalau di-treat sbg token polos lalu DIBUNGKUS LAGI dgn host & moid
 * sendiri, hasilnya jadi duplikat host & moid, URI tidak valid. Di sini
 * pakai `ticket` APA ADANYA, cuma perbaiki skemanya -- TIDAK menambah
 * host/moid sendiri (fallback ke cara lama HANYA kalau ticket ternyata
 * benar polos, jaga-jaga versi vCenter lain berperilaku beda).
 */
export default defineEventHandler(async (event) => {
  const vm = getQuery(event).vm as string | undefined
  if (!vm) {
    throw createError({ statusCode: 400, statusMessage: "Parameter 'vm' wajib diisi." })
  }

  const config = useRuntimeConfig()
  const vcenterHost = config.vsphereHost
  if (!vcenterHost) {
    throw createError({ statusCode: 500, statusMessage: "NUXT_VSPHERE_HOST belum diisi di .env." })
  }

  try {
    const data = await vsphereRequest<{ value: { type: string; ticket: string } }>(
      "POST",
      `/rest/vcenter/vm/${encodeURIComponent(vm)}/console/tickets`,
      { spec: { type: "VMRC" } }
    )
    const ticket = data.value?.ticket
    if (!ticket) {
      throw createError({ statusCode: 502, statusMessage: "vCenter tidak mengembalikan tiket VMRC." })
    }

    let uri: string
    if (ticket.startsWith("vmrc://")) {
      uri = ticket
    } else if (ticket.startsWith("vmrc//")) {
      uri = "vmrc://" + ticket.slice("vmrc//".length)
    } else {
      uri = `vmrc://clone:${ticket}@${vcenterHost}/?moid=${encodeURIComponent(vm)}`
    }

    return { uri }
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err // sudah createError di atas
    const status = err instanceof VsphereError ? err.status : 502
    const message = err instanceof Error ? err.message : "Gagal mengambil tiket VMRC."
    throw createError({ statusCode: status, statusMessage: message })
  }
})
