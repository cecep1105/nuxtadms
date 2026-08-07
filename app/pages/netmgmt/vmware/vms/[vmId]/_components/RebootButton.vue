<script setup lang="ts">
import { Loader2, RotateCcw } from "@lucide/vue"

/**
 * Reboot VM -- panggil proxy generik yang sudah ada (/api/vsphere/...,
 * BUKAN endpoint baru) krn ini cuma "teruskan apa adanya" ke vCenter.
 *
 * PENTING: /power/reset adalah HARD RESET (spt tekan tombol reset
 * fisik) -- BUKAN restart OS yang rapi (soft reboot via VMware Tools).
 */
const props = defineProps<{ vmId: string }>()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

async function handleReboot() {
  loading.value = true
  error.value = null
  try {
    await $fetch(`/api/vsphere/vm/${encodeURIComponent(props.vmId)}/power/reset`, { method: "POST" })
    open.value = false
    await refreshNuxtData()
  } catch (err: any) {
    // $fetch ke server route LOKAL sendiri (bukan Django lewat
    // useApiClient) -- bentuk error-nya BEDA (ofetch FetchError, data
    // di err.data/err.statusMessage), extractErrorMessage() TIDAK
    // cocok utk ini (itu khusus ApiError/NetworkError dari Django).
    error.value = err?.data?.statusMessage || err?.statusMessage || err?.message || "Gagal reboot VM."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button size="sm" variant="outline" @click="open = true"><RotateCcw class="h-3.5 w-3.5" /> Reboot</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Reboot VM?</DialogTitle>
        <DialogDescription>
          Ini adalah <span class="font-medium text-foreground">hard reset</span> (setara menekan tombol reset fisik) --
          BUKAN restart OS yang rapi. Data yang belum tersimpan di guest OS bisa hilang.
        </DialogDescription>
      </DialogHeader>
      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button variant="destructive" :disabled="loading" @click="handleReboot">
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Reboot
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
