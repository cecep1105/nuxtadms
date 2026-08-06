<script setup lang="ts">
import { FileSpreadsheet, Loader2 } from "@lucide/vue"

/**
 * Tombol "Export XLSX" -- padanan export-xlsx-button.tsx versi
 * Next.js. File .xlsx SEMUA baris yg cocok filter yg SEDANG AKTIF
 * (bukan cuma halaman yg sedang tampil), diambil langsung dari
 * route.query -- apa pun yg SUDAH di-"Terapkan Filter" di URL, itu
 * yg dikirim ke endpoint export.
 *
 * PAKAI fetch() MANUAL (BUKAN useApiClient().request(), yg cuma bisa
 * JSON) -- response di sini BINARY (file .xlsx), ditangani sbg Blob,
 * dipicu jadi download browser via <a> sementara + URL.createObjectURL.
 */
const props = defineProps<{ apiPath: string }>()

const route = useRoute()
const config = useRuntimeConfig()
const { session } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)

async function handleExport() {
  loading.value = true
  error.value = null
  try {
    const query = new URLSearchParams(route.query as Record<string, string>).toString()
    const url = `${config.public.apiBaseUrl}${props.apiPath}?${query}`
    const res = await fetch(url, {
      headers: session.value?.accessToken ? { Authorization: `Bearer ${session.value.accessToken}` } : {},
    })
    if (!res.ok) {
      let message = `Gagal export (status ${res.status}).`
      try {
        const body = await res.json()
        message = body.error || body.detail || message
      } catch {
        /* respons error bukan JSON -- pesan default di atas dipakai */
      }
      throw new Error(message)
    }

    const blob = await res.blob()
    const disposition = res.headers.get("Content-Disposition") || ""
    const match = disposition.match(/filename="([^"]+)"/)
    const filename = match?.[1] ?? "rekap-absensi.xlsx"

    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(downloadUrl)
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Gagal export ke XLSX."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <Button
      type="button" size="sm" variant="outline" :disabled="loading"
      class="border-success/40 text-success hover:bg-success/10 hover:text-success"
      @click="handleExport"
    >
      <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><FileSpreadsheet v-else class="h-3.5 w-3.5" /> Export XLSX
    </Button>
    <p v-if="error" class="text-[11px] text-destructive">{{ error }}</p>
  </div>
</template>
